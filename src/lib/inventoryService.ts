import { VapeProduct, StockStatus } from '@/types/vape';
import { INITIAL_PRODUCTS } from '@/data/inventory';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'rash_vape_inventory_v9';
export const INVENTORY_EVENT = 'rash_vape_inventory_updated';
const DB_ROW_ID = 'current';

/**
 * Synchronous local cache reader for zero-latency initial rendering.
 */
export function getStoredInventory(): VapeProduct[] {
  if (typeof window === 'undefined') {
    return INITIAL_PRODUCTS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === INITIAL_PRODUCTS.length) {
      const hasBothBrands = parsed.some((p: VapeProduct) => p.brand === 'Black Elite') &&
                            parsed.some((p: VapeProduct) => p.brand === 'Black A Elite');
      const hasUpdatedPrices = parsed.some((p: VapeProduct) => p.price === 320) &&
                               parsed.some((p: VapeProduct) => p.price === 270);
      if (hasBothBrands && hasUpdatedPrices) {
        return parsed;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  } catch (err) {
    console.warn('Failed to parse stored inventory:', err);
  }
  return INITIAL_PRODUCTS;
}

/**
 * Fetches the latest live inventory from Supabase if configured.
 * Automatically seeds the database if it is empty.
 */
export async function fetchInventoryFromCloud(): Promise<VapeProduct[] | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('vape_inventory')
      .select('data')
      .eq('id', DB_ROW_ID)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error (will use local cache):', error.message);
      return null;
    }

    if (data && Array.isArray(data.data) && data.data.length > 0) {
      const cloudProducts = data.data as VapeProduct[];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudProducts));
        window.dispatchEvent(new CustomEvent(INVENTORY_EVENT, { detail: cloudProducts }));
      }
      return cloudProducts;
    }

    // Table row doesn't exist yet -> seed with current stored inventory
    const seed = getStoredInventory();
    await supabase.from('vape_inventory').upsert({
      id: DB_ROW_ID,
      data: seed,
      updated_at: new Date().toISOString(),
    });
    return seed;
  } catch (err) {
    console.warn('Error fetching inventory from cloud:', err);
    return null;
  }
}

/**
 * Saves inventory to both local storage and Supabase Cloud.
 */
export async function saveInventory(products: VapeProduct[]): Promise<boolean> {
  // 1. Instant local persistence and UI dispatch
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      window.dispatchEvent(new CustomEvent(INVENTORY_EVENT, { detail: products }));
    } catch (err) {
      console.error('Failed to save inventory locally:', err);
    }
  }

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('vape_inventory').upsert({
        id: DB_ROW_ID,
        data: products,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Supabase save error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to save inventory to Supabase:', err);
      return false;
    }
  }

  return true;
}

/**
 * Subscribes to real-time changes across all users via Supabase Realtime WebSockets.
 */
export function subscribeToInventoryRealtime(onUpdate: (products: VapeProduct[]) => void): () => void {
  const client = supabase;
  if (!isSupabaseConfigured() || !client) {
    return () => {};
  }

  try {
    const channel = client
      .channel('vape_inventory_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vape_inventory',
          filter: `id=eq.${DB_ROW_ID}`,
        },
        (payload) => {
          if (payload.new && (payload.new as { data?: VapeProduct[] }).data) {
            const incoming = (payload.new as { data: VapeProduct[] }).data;
            if (Array.isArray(incoming)) {
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
                } catch (e) {
                  console.warn('Failed to update local cache from realtime:', e);
                }
                window.dispatchEvent(new CustomEvent(INVENTORY_EVENT, { detail: incoming }));
              }
              onUpdate(incoming);
            }
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Failed to initialize Supabase realtime subscription:', err);
    return () => {};
  }
}

export function updateFlavorStock(productId: string, flavorId: string, delta: number): VapeProduct[] {
  const current = getStoredInventory();
  const updated = current.map((product) => {
    if (product.id !== productId) return product;
    return {
      ...product,
      flavors: product.flavors.map((flavor) => {
        if (flavor.id !== flavorId) return flavor;
        const newCount = Math.max(0, flavor.stockCount + delta);
        let newStatus: StockStatus = 'in_stock';
        if (newCount === 0) {
          newStatus = 'out_of_stock';
        } else if (newCount <= 3) {
          newStatus = 'low_stock';
        }
        return {
          ...flavor,
          stockCount: newCount,
          status: newStatus,
        };
      }),
    };
  });

  saveInventory(updated);
  return updated;
}

export function setExactFlavorStock(productId: string, flavorId: string, exactCount: number): VapeProduct[] {
  const current = getStoredInventory();
  const updated = current.map((product) => {
    if (product.id !== productId) return product;
    return {
      ...product,
      flavors: product.flavors.map((flavor) => {
        if (flavor.id !== flavorId) return flavor;
        const newCount = Math.max(0, exactCount);
        let newStatus: StockStatus = 'in_stock';
        if (newCount === 0) {
          newStatus = 'out_of_stock';
        } else if (newCount <= 3) {
          newStatus = 'low_stock';
        }
        return {
          ...flavor,
          stockCount: newCount,
          status: newStatus,
        };
      }),
    };
  });

  saveInventory(updated);
  return updated;
}

export function toggleFlavorSoldOut(productId: string, flavorId: string): VapeProduct[] {
  const current = getStoredInventory();
  const updated = current.map((product) => {
    if (product.id !== productId) return product;
    return {
      ...product,
      flavors: product.flavors.map((flavor) => {
        if (flavor.id !== flavorId) return flavor;
        const isCurrentlySoldOut = flavor.stockCount === 0 || flavor.status === 'out_of_stock';
        const newCount = isCurrentlySoldOut ? 10 : 0;
        const newStatus: StockStatus = isCurrentlySoldOut ? 'in_stock' : 'out_of_stock';
        return {
          ...flavor,
          stockCount: newCount,
          status: newStatus,
        };
      }),
    };
  });

  saveInventory(updated);
  return updated;
}

export function resetInventoryToDefault(): VapeProduct[] {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(INVENTORY_EVENT, { detail: INITIAL_PRODUCTS }));
  }
  if (isSupabaseConfigured() && supabase) {
    supabase.from('vape_inventory').upsert({
      id: DB_ROW_ID,
      data: INITIAL_PRODUCTS,
      updated_at: new Date().toISOString(),
    }).then();
  }
  return INITIAL_PRODUCTS;
}

export function exportInventoryJson(products: VapeProduct[]): void {
  const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonStr);
  downloadAnchor.setAttribute('download', `rash_vape_inventory_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
