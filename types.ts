export enum Category {
  Groceries = "Groceries",
  Dining = "Dining",
  Electronics = "Electronics",
  Utilities = "Utilities",
  Transport = "Transport",
  Clothing = "Clothing",
  Health = "Health",
  Entertainment = "Entertainment",
  Other = "Other"
}

export interface ReceiptItem {
  name: string;
  price: number;
  category: Category;
}

export interface Receipt {
  id: string;
  storeName: string;
  date: string;
  total: number;
  currency: string;
  items: ReceiptItem[];
  imageUrl?: string;
  confidence: number;
  aiInsight?: string;
}

export interface SpendingInsight {
  title: string;
  description: string;
  type: 'warning' | 'savings' | 'trend';
  impact?: string;
}

export interface UserSettings {
  currency: string;
  monthlyBudget: number;
}