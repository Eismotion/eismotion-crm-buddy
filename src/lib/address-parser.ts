/**
 * Extrahiert den Standort (Stadt) aus einer Adresse
 * 
 * @param address - Vollständige Adresse (z.B. "Grabenstr. 13, 53424 Remagen")
 * @returns Stadt-Name oder "Unbekannt"
 */
export function extractLocation(address: string | null | undefined): string {
  if (!address) return 'Unbekannt';
  
  // Entferne Länderkürzel in Klammern wie (ES), (DE)
  let cleaned = address.replace(/\([A-Z]{2}\)/g, '').trim();
  
  // Splitte bei Komma
  const parts = cleaned.split(',').map(p => p.trim());
  
  // Letzter Teil enthält normalerweise PLZ + Stadt
  const lastPart = parts[parts.length - 1];
  
  // Entferne PLZ (5 Ziffern am Anfang)
  const city = lastPart.replace(/^\d{5}\s*/, '').trim();
  
  // Falls Stadt leer, versuche vorletzten Teil
  if (!city && parts.length > 1) {
    const secondLast = parts[parts.length - 2];
    return secondLast.replace(/^\d{5}\s*/, '').trim() || 'Unbekannt';
  }
  
  return city || 'Unbekannt';
}

/**
 * Extrahiert PLZ aus einer Adresse
 */
export function extractPostalCode(address: string | null | undefined): string {
  if (!address) return '';
  
  const match = address.match(/\b\d{5}\b/);
  return match ? match[0] : '';
}

/**
 * Extrahiert das Land aus einer Adresse
 * Sucht nach Länderkürzel in Klammern oder versucht PLZ-basierte Erkennung
 */
export function extractCountry(address: string | null | undefined): string {
  if (!address) return 'DE';
  
  // Suche nach Länderkürzel in Klammern
  const match = address.match(/\(([A-Z]{2})\)/);
  if (match) return match[1];
  
  // Suche nach Ländernamen
  if (address.includes('España') || address.includes('Spain')) return 'ES';
  if (address.includes('Österreich') || address.includes('Austria')) return 'AT';
  if (address.includes('France') || address.includes('Frankreich')) return 'FR';
  if (address.includes('Italia') || address.includes('Italien')) return 'IT';
  
  // PLZ-basierte Erkennung
  const plz = extractPostalCode(address);
  if (plz) {
    const plzNum = parseInt(plz);
    // Spanische PLZ: 01000-52999
    if (plzNum >= 1000 && plzNum <= 52999) return 'ES';
    // Deutsche PLZ: meistens höher
    if (plzNum >= 1000 && plzNum <= 99999) return 'DE';
  }
  
  // Default: Deutschland
  return 'DE';
}
