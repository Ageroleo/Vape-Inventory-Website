export type ProductCategory = 'transparent_disposable' | 'non_transparent_disposable';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface FlavorVariant {
  id: string;
  name: string;
  colorHex: string;
  coolingLevel: 1 | 2 | 3 | 4 | 5;
  sweetnessLevel: 1 | 2 | 3 | 4 | 5;
  stockCount: number;
  status: StockStatus;
}

export interface VapeProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;
  nicotineStrength: string;
  puffCount?: number;
  batteryCapacity?: string;
  coilType?: string;
  capacity?: string;
  chargingPort?: string;
  airflow?: string;
  resistance?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  image: string;
  description: string;
  flavors: FlavorVariant[];
}

export interface FilterState {
  searchQuery: string;
  category: ProductCategory | 'all';
  brand: string;
  puffRange: string;
  coolingFilter: string;
  sortBy: string;
  inStockOnly: boolean;
}

export interface SelectedInquiryItem {
  productId: string;
  productName: string;
  brand: string;
  flavorId: string;
  flavorName: string;
  price: number;
}
