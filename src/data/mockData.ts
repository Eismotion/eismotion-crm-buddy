export interface Customer {
  id: number;
  name: string;
  email: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
}

export interface Invoice {
  id: number;
  number: string;
  customer: string;
  date: string;
  amount: number;
  status: 'bezahlt' | 'gesendet' | 'überfällig';
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  season: 'Ganzjährig' | 'Winter' | 'Sommer' | 'Herbst' | 'Frühling';
}

export const mockCustomers: Customer[] = [
  { id: 1, name: 'Max Mustermann', email: 'max@example.com', city: 'Berlin', totalOrders: 15, totalSpent: 245.50 },
  { id: 2, name: 'Anna Schmidt', email: 'anna@example.com', city: 'München', totalOrders: 8, totalSpent: 156.30 },
  { id: 3, name: 'Café Sonnenschein', email: 'info@sonnenschein.de', city: 'Hamburg', totalOrders: 32, totalSpent: 890.75 },
  { id: 4, name: 'Peter Wagner', email: 'peter@example.com', city: 'Köln', totalOrders: 12, totalSpent: 189.20 },
  { id: 5, name: 'Maria Müller', email: 'maria@example.com', city: 'Frankfurt', totalOrders: 20, totalSpent: 345.80 },
];

export const mockInvoices: Invoice[] = [
  { id: 1, number: '2025-001', customer: 'Max Mustermann', date: '2025-01-04', amount: 15.50, status: 'bezahlt' },
  { id: 2, number: '2025-002', customer: 'Anna Schmidt', date: '2025-01-05', amount: 22.30, status: 'gesendet' },
  { id: 3, number: '2025-003', customer: 'Café Sonnenschein', date: '2024-12-20', amount: 67.80, status: 'überfällig' },
  { id: 4, number: '2025-004', customer: 'Peter Wagner', date: '2025-01-06', amount: 34.50, status: 'bezahlt' },
  { id: 5, number: '2025-005', customer: 'Maria Müller', date: '2024-12-28', amount: 45.20, status: 'überfällig' },
  { id: 6, number: '2025-006', customer: 'Max Mustermann', date: '2025-01-07', amount: 28.90, status: 'gesendet' },
];

export const mockProducts: Product[] = [
  { id: 1, name: 'Vanilleeis - 2 Kugeln', category: 'Eis', price: 4.50, season: 'Ganzjährig' },
  { id: 2, name: 'Schokoladeneis - 2 Kugeln', category: 'Eis', price: 4.50, season: 'Ganzjährig' },
  { id: 3, name: 'Erdbeereis - 2 Kugeln', category: 'Eis', price: 4.50, season: 'Ganzjährig' },
  { id: 4, name: 'Glühwein', category: 'Heißgetränke', price: 3.50, season: 'Winter' },
  { id: 5, name: 'Heiße Schokolade', category: 'Heißgetränke', price: 3.80, season: 'Winter' },
  { id: 6, name: 'Eiskaffee', category: 'Kaltgetränke', price: 5.20, season: 'Sommer' },
  { id: 7, name: 'Frozen Yogurt', category: 'Eis', price: 5.50, season: 'Sommer' },
  { id: 8, name: 'Kürbiseis', category: 'Eis', price: 4.80, season: 'Herbst' },
  { id: 9, name: 'Apfelstrudel mit Eis', category: 'Dessert', price: 6.50, season: 'Herbst' },
  { id: 10, name: 'Erdbeer-Sorbet', category: 'Eis', price: 4.80, season: 'Frühling' },
  { id: 11, name: 'Matcha-Eis', category: 'Eis', price: 5.20, season: 'Frühling' },
];

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};
