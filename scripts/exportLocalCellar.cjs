// Exports the local (enriched) demo cellar from public/cellar.local.json into
// cellar-export.xlsx, using the SAME column headers as the in-app import
// template. One-time migration: once deployed with Supabase, log in and import
// this file (Ma cave > Importer) to load your enriched cellar online.
//   node scripts/exportLocalCellar.cjs
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

// Mirrors lib/excel.ts COLUMNS (header -> bottle key).
const COLUMNS = [
  ["Nom du vin", "name"],
  ["Producteur", "producer"],
  ["Vigneron", "winemaker"],
  ["Millesime", "vintage"],
  ["Couleur", "color"],
  ["Pays", "country"],
  ["Region", "region"],
  ["Sous-region", "subRegion"],
  ["Appellation", "appellation"],
  ["Cepages", "grapes"],
  ["Cuvee", "cuvee"],
  ["Quantite", "quantity"],
  ["Format", "format"],
  ["Date d'achat", "purchaseDate"],
  ["Prix d'achat", "purchasePrice"],
  ["Cave / rangement", "storageUnit"], // not in seed -> empty
  ["Emplacement", "location"],
  ["A boire des", "drinkFrom"],
  ["A boire avant", "drinkTo"],
  ["Occasion", "occasion"],
  ["Note externe", "rating"],
  ["Echelle note", "ratingScale"],
  ["Source note", "ratingSource"],
  ["Notes", "notes"],
];

const src = path.join(__dirname, "..", "public", "cellar.local.json");
if (!fs.existsSync(src)) {
  console.error("public/cellar.local.json introuvable. Lance d'abord scripts/genSeed.cjs + enrichSeed.cjs.");
  process.exit(1);
}
const bottles = JSON.parse(fs.readFileSync(src, "utf8"));

const rows = bottles.map((b) => {
  const row = {};
  for (const [header, key] of COLUMNS) {
    const v = key === "storageUnit" ? "" : b[key];
    row[header] = v == null ? "" : v;
  }
  return row;
});

const ws = XLSX.utils.json_to_sheet(rows, {
  header: COLUMNS.map(([h]) => h),
});
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Cave");
const out = path.join(__dirname, "..", "cellar-export.xlsx");
XLSX.writeFile(wb, out);
console.log(
  `Wrote ${rows.length} bottles to cellar-export.xlsx (importable via Ma cave > Importer).`,
);
