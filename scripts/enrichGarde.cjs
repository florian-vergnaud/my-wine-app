// Refines the drink-window (drinkFrom / drinkTo) of every bottle in
// public/cellar.local.json using the Claude API, reasoning per-wine over
// producer reputation, cuvée level, appellation, vintage quality and wine type
// — far better than the rules in enrichSeed.cjs.
//
// Usage:
//   1. Put your key in .env.local:   ANTHROPIC_API_KEY=sk-ant-...
//      (optional)                    ANTHROPIC_MODEL=claude-opus-4-8
//   2. node scripts/enrichGarde.cjs            # all wines
//      node scripts/enrichGarde.cjs 30         # only the first 30 (test run)
//
// Re-runnable and idempotent-ish: it overwrites drinkFrom/drinkTo for every
// distinct wine. The app re-seeds automatically when the file changes.

const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

// --- load .env.local so the key never has to leave the machine ------------
function loadEnvLocal() {
  const p = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnvLocal();

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const BATCH = 20;
const limit = parseInt(process.argv[2], 10) || Infinity;

if (!API_KEY) {
  console.error(
    "ANTHROPIC_API_KEY manquant. Ajoutez-le dans .env.local puis relancez.",
  );
  process.exit(1);
}

const file = path.join(__dirname, "..", "public", "cellar.local.json");
const bottles = JSON.parse(fs.readFileSync(file, "utf8"));

// Dedupe by distinct wine (same wine+vintage => one query, applied to all lots)
const keyOf = (b) =>
  [b.producer, b.name, b.appellation, b.vintage, b.color].join("|").toLowerCase();
const uniq = [];
const seen = new Map();
for (const b of bottles) {
  const k = keyOf(b);
  if (!seen.has(k)) {
    seen.set(k, uniq.length);
    uniq.push(b);
  }
}
const targets = uniq.slice(0, limit === Infinity ? uniq.length : limit);
console.log(
  `${bottles.length} bouteilles, ${uniq.length} vins distincts, ${targets.length} à traiter (modèle ${MODEL}).`,
);

const client = new (Anthropic.default || Anthropic)({ apiKey: API_KEY });

const SYSTEM =
  "Tu es LE MEILLEUR SOMMELIER DE FRANCE — Meilleur Ouvrier de France en " +
  "sommellerie, chef sommelier d'une grande maison étoilée. Ta connaissance des " +
  "domaines, des cuvées, des terroirs et des millésimes est encyclopédique et " +
  "d'une précision absolue. Pour chaque vin, donne la fenêtre de consommation " +
  "OPTIMALE (apogée) en années pleines, en t'appuyant sur : la réputation et le " +
  "style du PRODUCTEUR, le niveau exact de la CUVÉE (générique / village / 1er cru / " +
  "grand cru / lieu-dit / vieilles vignes / sélection parcellaire), l'appellation, la " +
  "QUALITÉ DU MILLÉSIME pour cette région précise, et le type de vin. Un même vin " +
  "chez un producteur de référence se garde bien plus longtemps que l'exemple " +
  "générique de l'appellation ; distingue les grands et les petits millésimes. Si le " +
  "millésime est absent (non millésimé), considère une consommation dès l'année " +
  "courante (2026). Sois d'une précision de sommelier, réaliste, sans fenêtres " +
  "absurdement longues.";

function buildPrompt(slice, offset) {
  const lines = slice.map((b, j) => {
    const v = b.vintage ? String(b.vintage) : "non millésimé";
    return `${offset + j}. ${b.producer || "?"} — ${b.name || "?"} — ${
      b.appellation || "?"
    } (${b.region || b.country || "?"}) — ${b.color || "?"} — millésime ${v}`;
  });
  return (
    "Vins :\n" +
    lines.join("\n") +
    '\n\nRéponds UNIQUEMENT par un tableau JSON, un objet par vin, avec l\'index : ' +
    '[{"i":<index>,"from":<année>,"to":<année>}]. Aucun texte autour.'
  );
}

function parseJsonArray(text) {
  let t = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const a = t.indexOf("[");
  const b = t.lastIndexOf("]");
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

async function runBatch(slice, offset, attempt = 1) {
  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(slice, offset) }],
    });
    const text = resp.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");
    return parseJsonArray(text);
  } catch (e) {
    if (attempt < 3) {
      console.warn(`  lot ${offset}: échec (${e.message}), nouvelle tentative…`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return runBatch(slice, offset, attempt + 1);
    }
    throw e;
  }
}

(async () => {
  const windows = new Map(); // distinct-key -> {from,to}
  for (let i = 0; i < targets.length; i += BATCH) {
    const slice = targets.slice(i, i + BATCH);
    const arr = await runBatch(slice, i);
    for (const r of arr) {
      const b = targets[r.i];
      if (!b) continue;
      const from = Number(r.from) || null;
      const to = Number(r.to) || null;
      if (from && to) windows.set(keyOf(b), { from, to });
    }
    console.log(`  ${Math.min(i + BATCH, targets.length)}/${targets.length}…`);
  }

  let applied = 0;
  for (const b of bottles) {
    const w = windows.get(keyOf(b));
    if (w) {
      b.drinkFrom = w.from;
      b.drinkTo = w.to;
      applied++;
    }
  }
  fs.writeFileSync(file, JSON.stringify(bottles, null, 2) + "\n", "utf8");
  console.log(`Fenêtres de garde mises à jour sur ${applied} bouteilles.`);
})().catch((e) => {
  console.error("Erreur:", e.message);
  process.exit(1);
});
