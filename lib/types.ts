// ---------------------------------------------------------------------------
// Domain model for Ma Cave Virtuelle.
// All fields are optional except the few needed to identify a lot, so that
// bulk imports and label recognition can fill in whatever they have.
// ---------------------------------------------------------------------------

export const WINE_COLORS = [
  "rouge",
  "blanc",
  "rosé",
  "effervescent",
  "orange",
  "doux",
] as const;
export type WineColor = (typeof WINE_COLORS)[number];

export const BOTTLE_FORMATS = [
  "375ml",
  "500ml",
  "750ml",
  "magnum (1.5L)",
  "jéroboam (3L)",
  "réhoboam (4.5L)",
  "mathusalem (6L)",
] as const;

export const DEFAULT_OCCASIONS = [
  "Anniversaire",
  "Grande occasion",
  "Entre amis",
  "Déjeuner rapide / semaine",
  "À offrir",
  "Apéritif",
] as const;

/** A lot of identical bottles owned in the cellar. */
export interface Bottle {
  id: string;
  name: string;
  producer?: string;
  winemaker?: string;
  vintage?: number | null;
  color?: WineColor | string;
  country?: string;
  region?: string;
  subRegion?: string;
  appellation?: string;
  grapes?: string; // comma-separated varietals
  cuvee?: string; // production / cuvée detail
  quantity: number;
  format?: string;
  purchaseDate?: string; // ISO date
  purchasePrice?: number | null;
  storageUnitId?: string; // which cellar / fridge
  location?: string; // rack / shelf / bin / row-column
  drinkFrom?: number | null; // year
  drinkTo?: number | null; // year
  occasion?: string;
  // External rating enrichment (optional metadata).
  rating?: number | null;
  ratingScale?: string; // e.g. "/20", "/100", "1-5"
  ratingCount?: number | null;
  ratingSource?: string; // e.g. "Wine-Searcher", "RVF"
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** A physical storage location (the user may own several). */
export interface StorageUnit {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

/** A consumption event + its (optional) tasting note. */
export interface HistoryEntry {
  id: string;
  bottleId?: string; // may be null once the lot is emptied/deleted
  // snapshot of the wine identity at the time it was drunk
  name: string;
  producer?: string;
  vintage?: number | null;
  color?: WineColor | string;
  country?: string;
  region?: string;
  appellation?: string;
  grapes?: string;
  // consumption + tasting
  date: string; // ISO date drunk
  rating?: number | null; // 1-5
  notes?: string;
  meal?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** Structured wine data parsed from a label photo or typed name. */
export interface ParsedWine {
  name?: string;
  producer?: string;
  winemaker?: string;
  vintage?: number | null;
  color?: string;
  country?: string;
  region?: string;
  subRegion?: string;
  appellation?: string;
  grapes?: string;
  cuvee?: string;
  drinkFrom?: number | null;
  drinkTo?: number | null;
  confidence?: string;
  notes?: string;
}

export interface ExternalRating {
  source: string;
  score: string; // keep original, e.g. "16/20", "92/100", "4.1/5"
  scale: string; // "/20" | "/100" | "1-5"
  count?: number | null;
  note?: string;
}

export function emptyBottle(): Bottle {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "",
    quantity: 1,
    format: "750ml",
    createdAt: now,
    updatedAt: now,
  };
}
