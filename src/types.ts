export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  unit: Unit;
  ownerId: string;
  expiryDate?: string; // ISO format or YYYY-MM-DD
  lowStockThreshold?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // Positive means customer owes shopkeeper (Udhaar)
  ownerId: string;
  lastTransaction?: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  type: 'GAVE' | 'GOT';
  description: string;
  timestamp: number;
  ownerId: string;
}

export interface HistoryItem {
  id: string;
  productId: string;
  productName: string;
  action: 'ADD' | 'REMOVE' | 'EDIT' | 'CREATE' | 'DELETE';
  amount?: number;
  unit?: Unit;
  timestamp: number;
  priceAtTime?: number;
}

export type Category = 'Rashan' | 'Sabzi' | 'Doodh' | 'Masala' | 'Other';
export type Unit = 'kg' | 'gm' | 'Litre' | 'Quantity';
