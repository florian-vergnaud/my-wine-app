"use client";

import * as XLSX from "xlsx";
import type { Bottle, HistoryEntry, StorageUnit } from "./types";
import { bottleTitle } from "./format";

// --- column template (used for both export and the import template) --------

export interface ColumnDef {
  key: keyof Bottle | "storageUnit";
  header: string;
}

export const COLUMNS: ColumnDef[] = [
  { key: "name", header: "Nom du vin" },
  { key: "producer", header: "Producteur" },
  { key: "winemaker", header: "Vigneron" },
  { key: "vintage", header: "Millesime" },
  { key: "color", header: "Couleur" },
  { key: "country", header: "Pays" },
  { key: "region", header: "Region" },
  { key: "subRegion", header: "Sous-region" },
  { key: "appellation", header: "Appellation" },
  { key: "grapes", header: "Cepages" },
  { key: "cuvee", header: "Cuvee" },
  { key: "quantity", header: "Quantite" },
  { key: "format", header: "Format" },
  { key: "purchaseDate", header: "Date d'achat" },
  { key: "purchasePrice", header: "Prix d'achat" },
  { key: "storageUnit", header: "Cave / rangement" },
  { key: "location", header: "Emplacement" },
  { key: "drinkFrom", header: "A boire des" },
  { key: "drinkTo", header: "A boire avant" },
  { key: "occasion", header: "Occasion" },
  { key: "rating", header: "Note externe" },
  { key: "ratingScale", header: "Echelle note" },
  { key: "ratingSource", header: "Source note" },
  { key: "notes", header: "Notes" },
];

function normalize(s: string): string {
  return s
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Accept our headers + common English/alternate spellings.
const ALIASES: Record<string, ColumnDef["key"]> = {};
for (const c of COLUMNS) ALIASES[normalize(c.header)] = c.key;
Object.assign(ALIASES, {
  nom: "name",
  vin: "name",
  wine: "name",
  name: "name",
  producteur: "producer",
  domaine: "producer",
  producer: "producer",
  winemaker: "winemaker",
  vigneron: "winemaker",
  millesime: "vintage",
  annee: "vintage",
  vintage: "vintage",
  couleur: "color",
  color: "color",
  type: "color",
  pays: "country",
  country: "country",
  region: "region",
  sousregion: "subRegion",
  subregion: "subRegion",
  appellation: "appellation",
  aoc: "appellation",
  cepage: "grapes",
  cepages: "grapes",
  grape: "grapes",
  grapes: "grapes",
  cepagecuvee: "cuvee",
  cuvee: "cuvee",
  quantite: "quantity",
  quantity: "quantity",
  qty: "quantity",
  nombre: "quantity",
  format: "format",
  contenance: "format",
  dateachat: "purchaseDate",
  achat: "purchaseDate",
  prixachat: "purchasePrice",
  prix: "purchasePrice",
  price: "purchasePrice",
  cave: "storageUnit",
  rangement: "storageUnit",
  cellier: "storageUnit",
  emplacement: "location",
  location: "location",
  casier: "location",
  aboiredes: "drinkFrom",
  drinkfrom: "drinkFrom",
  apogeedebut: "drinkFrom",
  aboireavant: "drinkTo",
  drinkto: "drinkTo",
  apogeefin: "drinkTo",
  occasion: "occasion",
  note: "rating",
  noteexterne: "rating",
  rating: "rating",
  echellenote: "ratingScale",
  scale: "ratingScale",
  sourcenote: "ratingSource",
  source: "ratingSource",
  notes: "notes",
  commentaire: "notes",
});

export type RawRow = Record<string, any>;

export interface ImportRow {
  index: number;
  data: Partial<Bottle> & { storageUnitName?: string };
  errors: string[];
  warnings: string[];
}

const COLOR_ALIASES: Record<string, string> = {
  rouge: "rouge",
  red: "rouge",
  r: "rouge",
  blanc: "blanc",
  white: "blanc",
  b: "blanc",
  rose: "rosé",
  rosé: "rosé",
  rosado: "rosé",
  effervescent: "effervescent",
  petillant: "effervescent",
  sparkling: "effervescent",
  champagne: "effervescent",
  cremant: "effervescent",
  orange: "orange",
  doux: "doux",
  liquoreux: "doux",
  moelleux: "doux",
  sweet: "doux",
  vdn: "doux",
  fortifie: "doux",
  fortified: "doux",
};

function toInt(v: any): number | null {
  if (v === "" || v == null) return null;
  const n = parseInt(String(v).replace(/[^\d-]/g, ""), 10);
  return Number.isNaN(n) ? null : n;
}

function toFloat(v: any): number | null {
  if (v === "" || v == null) return null;
  const n = parseFloat(String(v).replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isNaN(n) ? null : n;
}

/** Parse the first sheet of an .xlsx/.csv file into validated import rows. */
export async function parseFile(file: File): Promise<ImportRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: RawRow[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows.map((raw, i) => {
    const data: Partial<Bottle> & { storageUnitName?: string } = {};
    for (const [header, value] of Object.entries(raw)) {
      const key = ALIASES[normalize(header)];
      if (!key) continue;
      const v = typeof value === "string" ? value.trim() : value;
      if (v === "" || v == null) continue;
      switch (key) {
        case "vintage":
        case "drinkFrom":
        case "drinkTo":
        case "ratingCount":
          (data as any)[key] = toInt(v);
          break;
        case "quantity":
          data.quantity = toInt(v) ?? 1;
          break;
        case "purchasePrice":
        case "rating":
          (data as any)[key] = toFloat(v);
          break;
        case "color":
          data.color = COLOR_ALIASES[normalize(String(v))] ?? String(v);
          break;
        case "storageUnit":
          data.storageUnitName = String(v);
          break;
        default:
          (data as any)[key] = String(v);
      }
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    if (!data.name && !data.producer)
      errors.push("Nom ou producteur manquant");
    if (data.quantity == null) data.quantity = 1;
    if (data.vintage && (data.vintage < 1900 || data.vintage > 2100))
      warnings.push("Millésime inhabituel");
    if (data.color && !COLOR_ALIASES[normalize(String(data.color))])
      warnings.push(`Couleur non reconnue : "${data.color}"`);
    if (
      data.drinkFrom &&
      data.drinkTo &&
      data.drinkFrom > data.drinkTo
    )
      warnings.push("Fenêtre de garde incohérente");

    return { index: i + 2, data, errors, warnings }; // +2: header row + 1-based
  });
}

// --- exports --------------------------------------------------------------

function bottleRow(b: Bottle, units: StorageUnit[]): Record<string, any> {
  const unit = units.find((u) => u.id === b.storageUnitId);
  const row: Record<string, any> = {};
  for (const c of COLUMNS) {
    if (c.key === "storageUnit") row[c.header] = unit?.name ?? "";
    else row[c.header] = (b as any)[c.key] ?? "";
  }
  return row;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadSheet(
  rows: Record<string, any>[],
  baseName: string,
  format: "xlsx" | "csv",
) {
  const ws = XLSX.utils.json_to_sheet(rows);
  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws);
    triggerDownload(
      new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }),
      `${baseName}.csv`,
    );
  } else {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cave");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    triggerDownload(
      new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${baseName}.xlsx`,
    );
  }
}

export function exportBottles(
  bottles: Bottle[],
  units: StorageUnit[],
  format: "xlsx" | "csv" = "xlsx",
) {
  const rows = bottles.map((b) => bottleRow(b, units));
  downloadSheet(rows, `cave-${new Date().toISOString().slice(0, 10)}`, format);
}

export function exportHistory(
  history: HistoryEntry[],
  format: "xlsx" | "csv" = "xlsx",
) {
  const rows = history.map((h) => ({
    "Date dégustation": h.date,
    "Nom du vin": bottleTitle(h),
    Producteur: h.producer ?? "",
    Millesime: h.vintage ?? "",
    Couleur: h.color ?? "",
    Region: h.region ?? "",
    Appellation: h.appellation ?? "",
    "Note /5": h.rating ?? "",
    "Accompagné de": h.meal ?? "",
    Commentaires: h.notes ?? "",
  }));
  downloadSheet(
    rows,
    `degustations-${new Date().toISOString().slice(0, 10)}`,
    format,
  );
}

export function downloadTemplate(format: "xlsx" | "csv" = "xlsx") {
  const example: Record<string, any> = {};
  const sample: Record<string, any> = {
    "Nom du vin": "Clos des Papes",
    Producteur: "Paul Avril",
    Vigneron: "",
    Millesime: 2016,
    Couleur: "rouge",
    Pays: "France",
    Region: "Vallée du Rhône",
    "Sous-region": "Rhône sud",
    Appellation: "Châteauneuf-du-Pape",
    Cepages: "Grenache, Mourvèdre, Syrah",
    Cuvee: "",
    Quantite: 6,
    Format: "750ml",
    "Date d'achat": "2019-05-10",
    "Prix d'achat": 75,
    "Cave / rangement": "Cave principale",
    Emplacement: "Travée B, étagère 3",
    "A boire des": 2024,
    "A boire avant": 2035,
    Occasion: "Grande occasion",
    "Note externe": "16/20",
    "Echelle note": "/20",
    "Source note": "RVF",
    Notes: "",
  };
  for (const c of COLUMNS) example[c.header] = "";
  downloadSheet([sample, example], "modele-import-cave", format);
}
