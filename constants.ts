import { Receipt, Category } from './types';

export const MOCK_RECEIPTS: Receipt[] = [
  {
    id: '1',
    storeName: 'Whole Foods Market',
    date: '2023-10-24',
    total: 42.85,
    currency: 'USD',
    confidence: 0.98,
    items: [
      { name: 'Organic Milk', price: 5.99, category: Category.Groceries },
      { name: 'Avocados (3)', price: 4.50, category: Category.Groceries },
      { name: 'Sourdough Bread', price: 6.25, category: Category.Groceries },
      { name: 'Chicken Breast', price: 12.50, category: Category.Groceries },
      { name: 'Kombucha', price: 3.99, category: Category.Dining }
    ],
    aiInsight: "Organic produce markup detected. Local farmers market could save 20%."
  },
  {
    id: '2',
    storeName: 'Tech Haven',
    date: '2023-10-22',
    total: 124.50,
    currency: 'USD',
    confidence: 0.95,
    items: [
      { name: 'USB-C Cable', price: 14.50, category: Category.Electronics },
      { name: 'Wireless Mouse', price: 45.00, category: Category.Electronics },
      { name: 'Mechanical Switch Pack', price: 65.00, category: Category.Electronics }
    ]
  },
  {
    id: '3',
    storeName: 'Starbucks',
    date: '2023-10-25',
    total: 18.40,
    currency: 'USD',
    confidence: 0.99,
    items: [
      { name: 'Latte Grande', price: 5.45, category: Category.Dining },
      { name: 'Cappuccino', price: 5.25, category: Category.Dining },
      { name: 'Croissant', price: 3.95, category: Category.Dining },
      { name: 'Tip', price: 3.75, category: Category.Dining }
    ]
  }
];