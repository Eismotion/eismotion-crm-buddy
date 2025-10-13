/**
 * Hilfsfunktionen für die saisonale Template-Auswahl
 * Ermittelt automatisch die passende Jahreszeit und Anlässe basierend auf dem aktuellen Datum
 */

export type Season = 'Frühling' | 'Sommer' | 'Herbst' | 'Winter';
export type Occasion = 'Weihnachten' | 'Ostern' | 'Silvester' | 'Neujahr' | 'Valentinstag' | null;

interface SeasonInfo {
  season: Season;
  occasion: Occasion;
  monthName: string;
}

/**
 * Ermittelt die aktuelle Jahreszeit basierend auf dem Datum
 */
export const getCurrentSeason = (date: Date = new Date()): Season => {
  const month = date.getMonth(); // 0-11
  
  // Frühling: März (2), April (3), Mai (4)
  if (month >= 2 && month <= 4) return 'Frühling';
  
  // Sommer: Juni (5), Juli (6), August (7)
  if (month >= 5 && month <= 7) return 'Sommer';
  
  // Herbst: September (8), Oktober (9), November (10)
  if (month >= 8 && month <= 10) return 'Herbst';
  
  // Winter: Dezember (11), Januar (0), Februar (1)
  return 'Winter';
};

/**
 * Ermittelt besondere Anlässe basierend auf dem Datum
 */
export const getCurrentOccasion = (date: Date = new Date()): Occasion => {
  const month = date.getMonth();
  const day = date.getDate();
  
  // Weihnachtszeit: 1. Dezember - 26. Dezember
  if (month === 11 && day >= 1 && day <= 26) return 'Weihnachten';
  
  // Silvester: 27. Dezember - 31. Dezember
  if (month === 11 && day >= 27) return 'Silvester';
  
  // Neujahr: 1. Januar - 6. Januar
  if (month === 0 && day <= 6) return 'Neujahr';
  
  // Valentinstag: 10. Februar - 14. Februar
  if (month === 1 && day >= 10 && day <= 14) return 'Valentinstag';
  
  // Ostern (bewegliches Fest - vereinfachte Berechnung für März/April)
  // Hinweis: Für exakte Osterberechnung könnte eine Library verwendet werden
  if (month === 2 || month === 3) {
    const easterDate = calculateEaster(date.getFullYear());
    const diff = Math.abs(date.getTime() - easterDate.getTime());
    const daysDiff = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    // 2 Wochen vor bis 1 Woche nach Ostern
    if (daysDiff <= 14) return 'Ostern';
  }
  
  return null;
};

/**
 * Berechnet das Osterdatum für ein gegebenes Jahr (Gaußsche Osterformel)
 */
const calculateEaster = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-based month
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month, day);
};

/**
 * Gibt vollständige Saison-Informationen zurück
 */
export const getSeasonInfo = (date: Date = new Date()): SeasonInfo => {
  const season = getCurrentSeason(date);
  const occasion = getCurrentOccasion(date);
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  const monthName = monthNames[date.getMonth()];
  
  return { season, occasion, monthName };
};

/**
 * Gibt eine benutzerfreundliche Beschreibung der aktuellen Saison/Anlass zurück
 */
export const getSeasonDescription = (date: Date = new Date()): string => {
  const { season, occasion } = getSeasonInfo(date);
  
  if (occasion) {
    return occasion;
  }
  
  return season;
};

/**
 * Hilfsfunktion zum Filtern von Templates nach Saison und Anlass
 */
export const matchesCurrentSeason = (
  templateSeason?: string | null,
  templateOccasion?: string | null,
  date: Date = new Date()
): boolean => {
  const { season, occasion } = getSeasonInfo(date);
  
  // Priorisiere Anlässe über Jahreszeiten
  if (occasion && templateOccasion) {
    return templateOccasion.toLowerCase() === occasion.toLowerCase();
  }
  
  if (templateSeason) {
    return templateSeason.toLowerCase() === season.toLowerCase();
  }
  
  return false;
};

/**
 * Sortiert Templates nach Relevanz für die aktuelle Saison
 * Templates mit passendem Anlass/Saison kommen zuerst
 */
export const sortTemplatesBySeason = <T extends { season?: string | null; occasion?: string | null }>(
  templates: T[],
  date: Date = new Date()
): T[] => {
  return [...templates].sort((a, b) => {
    const aMatches = matchesCurrentSeason(a.season, a.occasion, date);
    const bMatches = matchesCurrentSeason(b.season, b.occasion, date);
    
    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    return 0;
  });
};
