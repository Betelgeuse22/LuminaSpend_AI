// types.ts

// Мы используем enum, чтобы Category существовал как объект в runtime
export enum Category {
  Sweets = 'сладости',
  Drinks = 'напитки',
  Fruits = 'фрукты',
  Vegetables = 'овощи',
  Meat = 'мясо',
  Fish = 'рыба',
  Dairy = 'молочные продукты',
  Groceries = 'бакалея',
  ReadyFood = 'готовая еда',
  Household = 'бытовые товары',
  Other = 'прочее'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: Category; // Теперь это ссылается на enum
  confidence: number;
  discount?: number;
}

export interface Receipt {
  id: string;
  storeName: string;
  date: string;
  totalAmount: number;
  currency: string;
  items: Product[];
  taxAmount?: number;
  imageUrl?: string;
  aiSummary?: string;
}

export interface SpendingInsight {
  title: string;
  description: string;
  type: 'warning' | 'savings' | 'trend';
  impact?: string;
}