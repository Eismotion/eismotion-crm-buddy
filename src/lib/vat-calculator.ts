export interface VATResult {
  rate: number;
  reason: string;
  reverseCharge: boolean;
}

export interface CustomerData {
  country?: string;
  postalCode?: string;
  address?: string;
  taxId?: string;
  isValidated?: boolean;
}

/**
 * Berechnet den korrekten MwSt-Satz nach EU-Recht
 */
export function calculateVAT(customer: CustomerData): VATResult {
  const country = customer.country || extractCountryFromAddress(customer.address || '');
  const postalCode = customer.postalCode || extractPostalCode(customer.address || '');
  const taxId = customer.taxId;
  const isValidated = customer.isValidated;

  // 1. Deutschland
  if (country === 'DE' || isGermanPostalCode(postalCode)) {
    return {
      rate: 0.19,
      reason: 'Deutschland - 19% MwSt',
      reverseCharge: false
    };
  }

  // 2. Spanien
  if (country === 'ES' || isSpanishPostalCode(postalCode)) {
    return {
      rate: 0.21,
      reason: 'Spanien - 21% IVA',
      reverseCharge: false
    };
  }

  // 3. EU mit validierter USt-ID (Reverse Charge)
  if (isEUCountry(country) && taxId && isValidated) {
    return {
      rate: 0.00,
      reason: `EU Reverse Charge - 0% (USt-ID: ${taxId})`,
      reverseCharge: true
    };
  }

  // 4. EU ohne USt-ID → Lokaler Satz
  if (isEUCountry(country)) {
    const localRate = getEUVATRate(country);
    return {
      rate: localRate,
      reason: `${country} - ${(localRate * 100).toFixed(0)}% MwSt`,
      reverseCharge: false
    };
  }

  // 5. Nicht-EU → 0% (Export)
  return {
    rate: 0.00,
    reason: 'Export außerhalb EU - 0%',
    reverseCharge: false
  };
}

/**
 * Extrahiert Länderkürzel aus Adresse
 */
export function extractCountryFromAddress(address: string): string {
  if (!address) return 'DE';

  // Suche nach Länderkürzel in Klammern (ES), (DE), etc.
  const match = address.match(/\(([A-Z]{2})\)/);
  if (match) {
    return match[1];
  }

  // Suche nach PLZ-Mustern
  const plz = extractPostalCode(address);
  if (plz) {
    const num = parseInt(plz);
    
    // Spanische PLZ (01000-52999)
    if (num >= 1000 && num <= 52999 && plz.length === 5) {
      return 'ES';
    }
    
    // Deutsche PLZ (01000-99999)
    if (num >= 1000 && num <= 99999 && plz.length === 5) {
      return 'DE';
    }
  }

  // Suche nach Ländernamen
  if (address.includes('España') || address.includes('Spain') || address.includes('Spanien')) {
    return 'ES';
  }
  if (address.includes('Deutschland') || address.includes('Germany')) {
    return 'DE';
  }
  if (address.includes('Österreich') || address.includes('Austria')) {
    return 'AT';
  }
  if (address.includes('France') || address.includes('Frankreich')) {
    return 'FR';
  }
  if (address.includes('Italia') || address.includes('Italien') || address.includes('Italy')) {
    return 'IT';
  }
  if (address.includes('Nederland') || address.includes('Niederlande') || address.includes('Netherlands')) {
    return 'NL';
  }

  // Default: Deutschland
  return 'DE';
}

/**
 * Extrahiert PLZ aus Adresse
 */
export function extractPostalCode(address: string): string {
  const match = address.match(/\b\d{5}\b/);
  return match ? match[0] : '';
}

/**
 * Prüft ob PLZ deutsch ist
 */
export function isGermanPostalCode(plz: string): boolean {
  if (!plz || plz.length !== 5) return false;
  const num = parseInt(plz);
  return num >= 1000 && num <= 99999;
}

/**
 * Prüft ob PLZ spanisch ist
 */
export function isSpanishPostalCode(plz: string): boolean {
  if (!plz || plz.length !== 5) return false;
  const num = parseInt(plz);
  return num >= 1000 && num <= 52999;
}

/**
 * Prüft ob Land in EU ist
 */
export function isEUCountry(country: string): boolean {
  const euCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
  ];
  return euCountries.includes(country);
}

/**
 * Gibt EU-MwSt-Satz für Land zurück
 */
export function getEUVATRate(country: string): number {
  const rates: Record<string, number> = {
    AT: 0.20, // Österreich
    BE: 0.21, // Belgien
    BG: 0.20, // Bulgarien
    HR: 0.25, // Kroatien
    CY: 0.19, // Zypern
    CZ: 0.21, // Tschechien
    DK: 0.25, // Dänemark
    EE: 0.20, // Estland
    FI: 0.24, // Finnland
    FR: 0.20, // Frankreich
    DE: 0.19, // Deutschland
    GR: 0.24, // Griechenland
    HU: 0.27, // Ungarn
    IE: 0.23, // Irland
    IT: 0.22, // Italien
    LV: 0.21, // Lettland
    LT: 0.21, // Litauen
    LU: 0.17, // Luxemburg
    MT: 0.18, // Malta
    NL: 0.21, // Niederlande
    PL: 0.23, // Polen
    PT: 0.23, // Portugal
    RO: 0.19, // Rumänien
    SK: 0.20, // Slowakei
    SI: 0.22, // Slowenien
    ES: 0.21, // Spanien
    SE: 0.25, // Schweden
  };
  return rates[country] || 0.19; // Default: 19%
}

/**
 * Formatiert MwSt-Satz als Prozent
 */
export function formatVATRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Berechnet MwSt-Betrag
 */
export function calculateVATAmount(subtotal: number, rate: number): number {
  return Math.round(subtotal * rate * 100) / 100;
}

/**
 * Berechnet Gesamtbetrag inkl. MwSt
 */
export function calculateTotal(subtotal: number, rate: number): number {
  return Math.round((subtotal + calculateVATAmount(subtotal, rate)) * 100) / 100;
}

/**
 * Berechnet Netto aus Brutto
 */
export function calculateNetFromGross(gross: number, rate: number): number {
  return Math.round((gross / (1 + rate)) * 100) / 100;
}
