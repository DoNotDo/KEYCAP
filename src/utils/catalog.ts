import { InventoryItem } from '../types';

export interface CatalogItem {
  sku: string;
  name: string;
  category: string;
  type: 'finished' | 'material';
  unit: string;
  price: number;
  minQuantity: number;
  maxQuantity: number;
  imageUrl?: string;
  description?: string;
  location?: string;
}

export const fetchCatalogItems = async (): Promise<CatalogItem[]> => {
  const response = await fetch('/catalog/items.json');
  if (!response.ok) {
    throw new Error('카탈로그를 불러올 수 없습니다.');
  }
  return response.json();
};

export const mapCatalogToInventoryItem = (item: CatalogItem): Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    sku: item.sku,
    name: item.name,
    category: item.category,
    type: item.type,
    branchName: '본사',
    quantity: 0,
    minQuantity: item.minQuantity,
    maxQuantity: item.maxQuantity,
    unit: item.unit,
    price: item.price,
    location: item.location || '',
    description: item.description || '',
    imageUrl: item.imageUrl,
  };
};
