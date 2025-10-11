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

export interface InvoiceTemplate {
  id: number;
  name: string;
  category: 'Saisonal' | 'Themen' | 'Anlässe';
  season?: 'Winter' | 'Frühling' | 'Sommer' | 'Herbst';
  theme?: string;
  thumbnail: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  elements: Array<{
    type: 'text' | 'image';
    content?: string;
    src?: string;
    position: { x: number; y: number };
    size?: { w: number; h: number };
  }>;
}

export interface Spruch {
  category: 'Lustig' | 'Saisonal' | 'Dankbar' | 'Motivierend';
  text: string;
}

export const mockTemplates: InvoiceTemplate[] = [
  {
    id: 1,
    name: 'Winter Wonderland',
    category: 'Saisonal',
    season: 'Winter',
    thumbnail: '/templates/winter-wonderland.jpg',
    colors: { primary: '#1565c0', secondary: '#e3f2fd', accent: '#0d47a1' },
    elements: [
      { type: 'text', content: 'Lassen Sie sich den Winter versüßen! ❄️', position: { x: 50, y: 400 } },
      { type: 'image', src: '/icons/snowflake.svg', position: { x: 20, y: 20 }, size: { w: 40, h: 40 } }
    ]
  },
  {
    id: 2,
    name: 'Sommer Vibes',
    category: 'Saisonal',
    season: 'Sommer',
    thumbnail: '/templates/sommer-vibes.jpg',
    colors: { primary: '#ff8f00', secondary: '#fff3e0', accent: '#ef6c00' },
    elements: [
      { type: 'text', content: 'Danke für Ihren Einkauf - Sie sind so cool wie unser Eis! 🍦', position: { x: 50, y: 400 } },
      { type: 'image', src: '/icons/sun.svg', position: { x: 20, y: 20 }, size: { w: 40, h: 40 } }
    ]
  },
  {
    id: 3,
    name: 'Geburtstags-Special',
    category: 'Anlässe',
    thumbnail: '/templates/geburtstag.jpg',
    colors: { primary: '#e91e63', secondary: '#fce4ec', accent: '#c2185b' },
    elements: [
      { type: 'text', content: 'Alles Gute zum Geburtstag! 🎉', position: { x: 50, y: 400 } },
      { type: 'image', src: '/icons/gift.svg', position: { x: 20, y: 20 }, size: { w: 40, h: 40 } }
    ]
  },
  {
    id: 4,
    name: 'Business Elegant',
    category: 'Themen',
    theme: 'Business',
    thumbnail: '/templates/business.jpg',
    colors: { primary: '#37474f', secondary: '#eceff1', accent: '#263238' },
    elements: [
      { type: 'text', content: 'Vielen Dank für Ihr Vertrauen', position: { x: 50, y: 400 } }
    ]
  },
  {
    id: 5,
    name: 'Herbst Zauber',
    category: 'Saisonal',
    season: 'Herbst',
    thumbnail: '/templates/herbst.jpg',
    colors: { primary: '#ff6f00', secondary: '#fff3e0', accent: '#e65100' },
    elements: [
      { type: 'text', content: 'Herbstliche Grüße von Eismotion! 🍂', position: { x: 50, y: 400 } },
      { type: 'image', src: '/icons/leaf.svg', position: { x: 20, y: 20 }, size: { w: 40, h: 40 } }
    ]
  },
  {
    id: 6,
    name: 'Frühling Erwacht',
    category: 'Saisonal',
    season: 'Frühling',
    thumbnail: '/templates/fruehling.jpg',
    colors: { primary: '#66bb6a', secondary: '#f1f8e9', accent: '#43a047' },
    elements: [
      { type: 'text', content: 'Frühlingsfrische Genüsse! 🌸', position: { x: 50, y: 400 } },
      { type: 'image', src: '/icons/flower.svg', position: { x: 20, y: 20 }, size: { w: 40, h: 40 } }
    ]
  }
];

export const mockSprueche: Spruch[] = [
  { category: 'Lustig', text: 'Danke für Ihren Einkauf - Sie sind so cool wie unser Eis! 🍦' },
  { category: 'Lustig', text: 'Ohne Sie wären wir nur eine leere Eisdiele 💙' },
  { category: 'Lustig', text: 'Sie haben unseren Tag versüßt! 🎉' },
  { category: 'Saisonal', text: 'Lassen Sie sich den Winter versüßen! ❄️' },
  { category: 'Saisonal', text: 'Sommer, Sonne, Eisvergnügen! ☀️' },
  { category: 'Saisonal', text: 'Herbstliche Grüße von Eismotion! 🍂' },
  { category: 'Saisonal', text: 'Frühlingsfrische Genüsse! 🌸' },
  { category: 'Dankbar', text: 'Sie haben einen ausgezeichneten Geschmack bewiesen!' },
  { category: 'Dankbar', text: 'Vielen Dank für Ihr Vertrauen!' },
  { category: 'Dankbar', text: 'Wir schätzen Ihre Treue sehr!' },
  { category: 'Motivierend', text: 'Bis zum nächsten süßen Moment!' },
  { category: 'Motivierend', text: 'Wir freuen uns auf Ihren nächsten Besuch!' },
  { category: 'Motivierend', text: 'Bleiben Sie cool! 😎' }
];

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};
