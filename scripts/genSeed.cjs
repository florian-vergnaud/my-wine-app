// One-off generator: reads the owner's "Livre de cave" Excel and emits
// lib/seedData.ts so the demo cellar is pre-loaded with the real inventory.
// Re-run with:  node scripts/genSeed.cjs "<path-to-xlsx>"
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const src =
  process.argv[2] ||
  "C:/Users/vergnaud florian/Downloads/Livre de cave - Florian Vergnaud - 11-06-2026.xlsx";

const wb = XLSX.readFile(src);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });

function color(robe) {
  if (!robe) return undefined;
  const r = String(robe).toLowerCase();
  if (r.includes("effervescent") || r.includes("pétillant")) return "effervescent";
  if (r.includes("liquoreux") || r.includes("moelleux") || r.includes("doux"))
    return "doux";
  if (r.includes("rosé") || r.includes("rose")) return "rosé";
  if (r.includes("orange")) return "orange";
  if (r.includes("rouge")) return "rouge";
  if (r.includes("blanc")) return "blanc";
  return undefined;
}

function format(c) {
  if (!c) return "750ml";
  const v = String(c).replace(",", ".").toLowerCase().trim();
  if (v.startsWith("75")) return "750ml";
  if (v.startsWith("150")) return "magnum (1.5L)";
  if (v.startsWith("37")) return "375ml";
  if (v.startsWith("50")) return "500ml";
  if (v.startsWith("62")) return "620ml (clavelin)";
  if (v.startsWith("100")) return "1L";
  if (v.startsWith("300")) return "jéroboam (3L)";
  return String(c);
}

function vintage(m) {
  if (m == null) return null;
  const n = parseInt(String(m).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function clean(s) {
  if (s == null) return undefined;
  const t = String(s).trim();
  return t === "" ? undefined : t;
}

const seed = rows
  .map((r) => {
    const name = clean(r["Dénomination"]);
    const producer = clean(r["Producteur"]);
    if (!name && !producer && !clean(r["Appellation"])) return null; // skip empties
    const price = Number(r["Prix"]);
    const qty = Number(r["Nombre de bouteilles"] ?? r["Quantité"]) || 1;
    return {
      name: name || producer || clean(r["Appellation"]) || "Vin",
      producer,
      appellation: clean(r["Appellation"]),
      country: clean(r["Pays"]),
      cuvee: clean(r["Cru"]), // classification (Grand Cru Classé, 1er Cru, …)
      color: color(r["Robe"]),
      vintage: vintage(r["Millésime"]),
      format: format(r["Contenance"]),
      quantity: qty,
      purchasePrice: price > 0 ? price : null,
      notes: clean(r["Commentaire"]),
      location: "iCave (Issy-les-Moulineaux)",
    };
  })
  .filter(Boolean);

const header = `// AUTO-GENERATED from the owner's "Livre de cave" Excel by scripts/genSeed.cjs.
// Loaded as the initial demo cellar. Safe to edit, but re-running the
// generator will overwrite this file.
import type { Bottle } from "./types";

export type SeedBottle = Omit<Bottle, "id" | "createdAt" | "updatedAt">;

export const SEED_BOTTLES: SeedBottle[] = `;

const body = JSON.stringify(seed, null, 2);
const out = path.join(__dirname, "..", "lib", "seedData.ts");
fs.writeFileSync(out, header + body + ";\n", "utf8");
console.log(`Wrote ${seed.length} bottles to lib/seedData.ts`);
console.log(
  "Total bottles:",
  seed.reduce((a, b) => a + (b.quantity || 0), 0),
);
