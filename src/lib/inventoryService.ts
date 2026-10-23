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
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  } catch (err) {
    console.warn('Failed to parse stored inventory:', err);
  }
  return INITIAL_PRODUCTS;
}

/**
 * Fetches the latest live inventory.
 * 1. Uses the internal /api/inventory server proxy (immune to Brave Shields, CORS & adblockers).
 * 2. Falls back to direct Supabase or local storage.
 */
export async function fetchInventoryFromCloud(): Promise<VapeProduct[] | null> {
  // 1. Try Next.js server API proxy first (bulletproof on all devices & browsers)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/inventory', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const cloudProducts = json.data as VapeProduct[];
          console.log('☁️ [Inventory API] Live inventory synced from server:', cloudProducts.length, 'products');
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudProducts));
          window.dispatchEvent(new CustomEvent(INVENTORY_EVENT, { detail: cloudProducts }));
          return cloudProducts;
        }
      }
    } catch (e) {
      console.warn('[Inventory API fetch]:', e);
    }
  }

  // 2. Direct Supabase fallback
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('vape_inventory')
        .select('data')
        .eq('id', DB_ROW_ID)
        .maybeSingle();

      if (!error && data && Array.isArray(data.data) && data.data.length > 0) {
        const cloudProducts = data.data as VapeProduct[];
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudProducts));
          window.dispatchEvent(new CustomEvent(INVENTORY_EVENT, { detail: cloudProducts }));
        }
        return cloudProducts;
      }
    } catch (err) {
      console.warn('[Direct Supabase fallback]:', err);
    }
  }

  return null;
}

/**
 * Saves inventory to local storage, server proxy, and Supabase Cloud.
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

  // 2. Save via Next.js Server API Proxy (immune to browser-level blocking)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          console.log('✅ [Inventory API] Saved to Supabase via server proxy!');
          return true;
        }
      }
    } catch (err) {
      console.warn('Server API save failed, attempting direct Supabase save:', err);
    }
  }

  // 3. Fallback direct save to Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('vape_inventory').upsert({
        id: DB_ROW_ID,
        data: products,
        updated_at: new Date().toISOString(),
      });
      if (!error) {
        return true;
      }
    } catch (err) {
      console.error('Direct Supabase save error:', err);
    }
  }

  return true;
}

/**
 * Subscribes to real-time changes across all users.
 * Combines light server polling + Supabase Realtime WebSockets for 100% reliability.
 */
export function subscribeToInventoryRealtime(onUpdate: (products: VapeProduct[]) => void): () => void {
  let isUnmounted = false;
  let lastKnownJson = '';

  const checkServerUpdate = async () => {
    if (typeof window === 'undefined' || isUnmounted) return;
    try {
      const res = await fetch('/api/inventory', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const serialized = JSON.stringify(json.data);
          if (lastKnownJson && serialized !== lastKnownJson) {
            console.log('⚡ [Live Sync] Received updated inventory from server!');
            localStorage.setItem(STORAGE_KEY, serialized);
            window.dispatchEvent(new CustomEvent(INVENTORY_EVENT, { detail: json.data }));
            onUpdate(json.data);
          }
          lastKnownJson = serialized;
        }
      }
    } catch (e) {
      // quiet catch
    }
  };

  // Poll server every 3.5 seconds
  const pollTimer = setInterval(checkServerUpdate, 3500);

  // Also check immediately when tab gains focus
  const handleFocus = () => {
    checkServerUpdate();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleFocus);
  }

  // Also attempt Supabase Realtime WebSocket
  const client = supabase;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let channel: any = null;
  if (isSupabaseConfigured() && client) {
    try {
      channel = client
        .channel('vape_inventory_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vape_inventory',
          },
          (payload) => {
            const row = payload.new as { id?: string; data?: VapeProduct[] } | null;
            if (row && Array.isArray(row.data)) {
              const incoming = row.data;
              lastKnownJson = JSON.stringify(incoming);
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem(STORAGE_KEY, lastKnownJson);
                } catch (e) {}
                window.dispatchEvent(new CustomEvent(INVENTORY_EVENT, { detail: incoming }));
              }
              onUpdate(incoming);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Supabase realtime fallback to polling:', err);
    }
  }

  return () => {
    isUnmounted = true;
    clearInterval(pollTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', handleFocus);
    }
    if (channel && client) {
      try {
        client.removeChannel(channel);
      } catch (e) {}
    }
  };
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
    saveInventory(INITIAL_PRODUCTS);
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
