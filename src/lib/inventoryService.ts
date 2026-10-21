import { VapeProduct, StockStatus } from '@/types/vape';
import { INITIAL_PRODUCTS } from '@/data/inventory';

const STORAGE_KEY = 'rash_vape_inventory_v9';
export const INVENTORY_EVENT = 'rash_vape_inventory_updated';

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

export function saveInventory(products: VapeProduct[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent(INVENTORY_EVENT, { detail: products }));
  } catch (err) {
    console.error('Failed to save inventory:', err);
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
