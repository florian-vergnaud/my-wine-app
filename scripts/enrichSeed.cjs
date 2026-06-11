// Enriches public/cellar.local.json in place: fills region, sub-region,
// grapes, drink-window and occasion from an appellation knowledge base
// (authored from Claude's wine knowledge). Only fills EMPTY fields, so any
// manual edits or AI label-scan data are preserved. Re-run after genSeed.cjs:
//   node scripts/enrichSeed.cjs
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "public", "cellar.local.json");
const bottles = JSON.parse(fs.readFileSync(file, "utf8"));

const norm = (s) =>
  (s ?? "").toString().toLowerCase().replace(/[\s\-']+/g, " ").trim();

// appellation -> { r: region, s: sub-region, g: grapes (string | by-colour) }
const APP = {
  // --- Rhône septentrional ---
  "côte rôtie": { r: "Vallée du Rhône", s: "Rhône septentrional", g: "Syrah" },
  "condrieu": { r: "Vallée du Rhône", s: "Rhône septentrional", g: "Viognier" },
  "saint joseph": { r: "Vallée du Rhône", s: "Rhône septentrional", g: { rouge: "Syrah", blanc: "Marsanne, Roussanne" } },
  "cornas": { r: "Vallée du Rhône", s: "Rhône septentrional", g: "Syrah" },
  "hermitage": { r: "Vallée du Rhône", s: "Rhône septentrional", g: { rouge: "Syrah", blanc: "Marsanne, Roussanne" } },
  "crozes hermitage": { r: "Vallée du Rhône", s: "Rhône septentrional", g: { rouge: "Syrah", blanc: "Marsanne, Roussanne" } },
  "igp collines rhodaniennes": { r: "Vallée du Rhône", s: "Rhône septentrional", g: { rouge: "Syrah", blanc: "Viognier" } },
  // --- Rhône méridional ---
  "châteauneuf du pape": { r: "Vallée du Rhône", s: "Rhône méridional", g: { rouge: "Grenache, Syrah, Mourvèdre", blanc: "Grenache blanc, Roussanne, Clairette" } },
  "côtes du rhône": { r: "Vallée du Rhône", s: "Rhône méridional", g: { rouge: "Grenache, Syrah, Mourvèdre", blanc: "Grenache blanc, Viognier", rosé: "Grenache, Cinsault" } },
  "tavel": { r: "Vallée du Rhône", s: "Rhône méridional", g: "Grenache, Cinsault, Syrah" },
  "muscat de beaumes de venise": { r: "Vallée du Rhône", s: "Rhône méridional", g: "Muscat à petits grains" },
  "vin de pays du vaucluse": { r: "Vallée du Rhône", s: "Rhône méridional", g: { rouge: "Grenache, Syrah" } },
  // --- Loire ---
  "vouvray": { r: "Loire", s: "Touraine", g: "Chenin Blanc" },
  "montlouis sur loire": { r: "Loire", s: "Touraine", g: "Chenin Blanc" },
  "savennières": { r: "Loire", s: "Anjou", g: "Chenin Blanc" },
  "savennières roche aux moines": { r: "Loire", s: "Anjou", g: "Chenin Blanc" },
  "savennières coulée de serrant": { r: "Loire", s: "Anjou", g: "Chenin Blanc" },
  "sancerre": { r: "Loire", s: "Centre-Loire", g: { blanc: "Sauvignon Blanc", rouge: "Pinot Noir", rosé: "Pinot Noir" } },
  "menetou salon": { r: "Loire", s: "Centre-Loire", g: { blanc: "Sauvignon Blanc", rouge: "Pinot Noir", rosé: "Pinot Noir" } },
  "menetou salon morogues": { r: "Loire", s: "Centre-Loire", g: { blanc: "Sauvignon Blanc", rouge: "Pinot Noir" } },
  "saumur": { r: "Loire", s: "Saumur", g: { rouge: "Cabernet Franc", blanc: "Chenin Blanc", effervescent: "Chenin Blanc" } },
  "saumur champigny": { r: "Loire", s: "Saumur", g: "Cabernet Franc" },
  "anjou": { r: "Loire", s: "Anjou", g: { rouge: "Cabernet Franc", blanc: "Chenin Blanc" } },
  "bourgueil": { r: "Loire", s: "Touraine", g: "Cabernet Franc" },
  "chinon": { r: "Loire", s: "Touraine", g: { rouge: "Cabernet Franc", blanc: "Chenin Blanc" } },
  "jasnières": { r: "Loire", s: "Touraine", g: "Chenin Blanc" },
  "coteaux du layon": { r: "Loire", s: "Anjou", g: "Chenin Blanc" },
  "quarts de chaume": { r: "Loire", s: "Anjou", g: "Chenin Blanc" },
  "muscadet sèvre et maine": { r: "Loire", s: "Pays nantais", g: "Melon de Bourgogne" },
  "touraine amboise": { r: "Loire", s: "Touraine", g: { rouge: "Côt (Malbec), Gamay", blanc: "Chenin Blanc" } },
  // --- Savoie ---
  "vin des allobroges": { r: "Savoie", s: "", g: "" },
  "vin de savoie": { r: "Savoie", s: "", g: { blanc: "Jacquère", rouge: "Mondeuse" } },
  "roussette de savoie": { r: "Savoie", s: "", g: "Altesse" },
  // --- Alsace ---
  "alsace": { r: "Alsace", s: "", g: { rouge: "Pinot Noir" } },
  "alsace pinot noir": { r: "Alsace", s: "", g: "Pinot Noir" },
  "alsace riesling": { r: "Alsace", s: "", g: "Riesling" },
  "alsace grand cru": { r: "Alsace", s: "Grand Cru", g: "" },
  "alsace grand cru grafenreben": { r: "Alsace", s: "Grand Cru Grafenreben", g: "" },
  "alsace grand cru schlossberg": { r: "Alsace", s: "Grand Cru Schlossberg", g: "Riesling" },
  "crémant d alsace": { r: "Alsace", s: "", g: "Assemblage (Pinot blanc, Auxerrois…)" },
  "riesling": { r: "Alsace", s: "", g: "Riesling" },
  // --- Bourgogne ---
  "givry premier cru": { r: "Bourgogne", s: "Côte Chalonnaise", g: { rouge: "Pinot Noir", blanc: "Chardonnay" } },
  "volnay": { r: "Bourgogne", s: "Côte de Beaune", g: "Pinot Noir" },
  "volnay premier cru": { r: "Bourgogne", s: "Côte de Beaune", g: "Pinot Noir" },
  "maranges premier cru": { r: "Bourgogne", s: "Côte de Beaune", g: "Pinot Noir" },
  "meursault": { r: "Bourgogne", s: "Côte de Beaune", g: "Chardonnay" },
  "meursault premier cru": { r: "Bourgogne", s: "Côte de Beaune", g: "Chardonnay" },
  "puligny montrachet": { r: "Bourgogne", s: "Côte de Beaune", g: "Chardonnay" },
  "saint aubin premier cru": { r: "Bourgogne", s: "Côte de Beaune", g: { blanc: "Chardonnay", rouge: "Pinot Noir" } },
  "santenay premier cru": { r: "Bourgogne", s: "Côte de Beaune", g: { rouge: "Pinot Noir", blanc: "Chardonnay" } },
  "beaune premier cru": { r: "Bourgogne", s: "Côte de Beaune", g: { rouge: "Pinot Noir", blanc: "Chardonnay" } },
  "beaune pertuizots premier cru": { r: "Bourgogne", s: "Côte de Beaune", g: "Pinot Noir" },
  "chablis": { r: "Bourgogne", s: "Chablis", g: "Chardonnay" },
  "chablis premier cru": { r: "Bourgogne", s: "Chablis", g: "Chardonnay" },
  "gevrey chambertin": { r: "Bourgogne", s: "Côte de Nuits", g: "Pinot Noir" },
  "gevrey chambertin premier cru": { r: "Bourgogne", s: "Côte de Nuits", g: "Pinot Noir" },
  "chambertin grand cru": { r: "Bourgogne", s: "Côte de Nuits", g: "Pinot Noir" },
  "nuits saint georges": { r: "Bourgogne", s: "Côte de Nuits", g: "Pinot Noir" },
  "montagny premier cru": { r: "Bourgogne", s: "Côte Chalonnaise", g: "Chardonnay" },
  "macon chaintré": { r: "Bourgogne", s: "Mâconnais", g: "Chardonnay" },
  "macon cruzille": { r: "Bourgogne", s: "Mâconnais", g: { blanc: "Chardonnay", rouge: "Gamay" } },
  // --- Beaujolais ---
  "moulin à vent": { r: "Beaujolais", s: "", g: "Gamay" },
  // --- Bordeaux ---
  "pauillac": { r: "Bordeaux", s: "Médoc", g: "Cabernet Sauvignon, Merlot" },
  "margaux": { r: "Bordeaux", s: "Médoc", g: "Cabernet Sauvignon, Merlot" },
  "saint estèphe": { r: "Bordeaux", s: "Médoc", g: "Cabernet Sauvignon, Merlot" },
  "haut médoc": { r: "Bordeaux", s: "Médoc", g: "Cabernet Sauvignon, Merlot" },
  "bordeaux supérieur": { r: "Bordeaux", s: "", g: "Merlot, Cabernet Sauvignon" },
  "côtes de bourg": { r: "Bordeaux", s: "Côtes de Bordeaux", g: "Merlot, Cabernet" },
  "côtes de bordeaux": { r: "Bordeaux", s: "Côtes de Bordeaux", g: "Merlot, Cabernet" },
  "sauternes": { r: "Bordeaux", s: "Sauternais", g: "Sémillon, Sauvignon Blanc" },
  // --- Provence ---
  "bandol": { r: "Provence", s: "", g: { rouge: "Mourvèdre", rosé: "Mourvèdre, Grenache, Cinsault" } },
  "les baux de provence": { r: "Provence", s: "", g: { rouge: "Grenache, Syrah", rosé: "Grenache, Syrah, Cinsault" } },
  "igp alpilles": { r: "Provence", s: "", g: { rouge: "Syrah, Grenache" } },
  "vin de pays des bouches du rhône": { r: "Provence", s: "", g: { rouge: "Grenache, Syrah, Cabernet" } },
  // --- Languedoc-Roussillon ---
  "corbières": { r: "Languedoc", s: "", g: "Carignan, Grenache, Syrah" },
  "pic saint loup": { r: "Languedoc", s: "", g: "Syrah, Grenache, Mourvèdre" },
  "languedoc": { r: "Languedoc", s: "", g: "Syrah, Grenache, Mourvèdre" },
  "saint guilhem le désert": { r: "Languedoc", s: "", g: { rouge: "Grenache, Syrah" } },
  "igp pays d hérault": { r: "Languedoc", s: "", g: "" },
  "igp côtes catalanes": { r: "Roussillon", s: "", g: "" },
  "maury": { r: "Roussillon", s: "", g: "Grenache" },
  // --- Sud-Ouest ---
  "cahors": { r: "Sud-Ouest", s: "", g: "Malbec (Côt)" },
  "jurançon": { r: "Sud-Ouest", s: "", g: "Petit Manseng, Gros Manseng" },
  // --- Corse ---
  "vins de corse": { r: "Corse", s: "", g: { rouge: "Nielluccio, Sciaccarello", blanc: "Vermentinu" } },
  "corse figari": { r: "Corse", s: "", g: { rouge: "Nielluccio, Sciaccarello", blanc: "Vermentinu" } },
  "muscat du cap corse": { r: "Corse", s: "", g: "Muscat à petits grains" },
  // --- Jura ---
  "côtes du jura": { r: "Jura", s: "", g: { blanc: "Chardonnay, Savagnin", rouge: "Poulsard, Trousseau, Pinot Noir" } },
  "arbois": { r: "Jura", s: "", g: { blanc: "Chardonnay, Savagnin", rouge: "Poulsard, Trousseau, Pinot Noir" } },
  "l étoile": { r: "Jura", s: "", g: "Chardonnay, Savagnin" },
  // --- Champagne ---
  "champagne": { r: "Champagne", s: "", g: "Chardonnay, Pinot Noir, Meunier" },
  // --- divers France ---
  "vin de france": { r: "", s: "", g: "" },
  // --- Italie ---
  "barolo": { r: "Piémont", s: "", g: "Nebbiolo" },
  "brunello di montalcino": { r: "Toscane", s: "", g: "Sangiovese" },
  "valpolicella superiore": { r: "Vénétie", s: "", g: "Corvina, Rondinella" },
  "merlot cabernet riserva": { r: "Italie", s: "", g: "Merlot, Cabernet" },
  "cabernet riserva": { r: "Italie", s: "", g: "Cabernet" },
  "kerner": { r: "Haut-Adige", s: "", g: "Kerner" },
  "pinot bianco": { r: "Haut-Adige", s: "", g: "Pinot Bianco" },
  "moscato giallo passito": { r: "Haut-Adige", s: "", g: "Moscato Giallo" },
  // --- Allemagne / Autriche ---
  "mosel": { r: "Mosel", s: "", g: "Riesling" },
  "kamptal": { r: "Kamptal", s: "", g: { blanc: "Grüner Veltliner" } },
  // --- Portugal / Espagne ---
  "porto": { r: "Douro", s: "", g: "Touriga Nacional, Touriga Franca" },
  "rioja": { r: "Rioja", s: "", g: "Tempranillo" },
  // --- USA ---
  "californie": { r: "Californie", s: "", g: "" },
  "santa cruz mountains": { r: "Californie", s: "Santa Cruz Mountains", g: "" },
  // --- Afrique du Sud ---
  "afrique du sud": { r: "Afrique du Sud", s: "", g: "" },
  "swartland": { r: "Afrique du Sud", s: "Swartland", g: "" },
  // --- Grèce ---
  "muscat of kefalonia": { r: "Grèce", s: "Céphalonie", g: "Muscat" },
  "rethymno": { r: "Grèce", s: "Crète", g: "" },
};

const GRAND = new Set([
  "chambertin grand cru", "hermitage", "côte rôtie", "barolo",
  "brunello di montalcino", "pauillac", "margaux", "saint estèphe",
  "sauternes", "puligny montrachet", "meursault premier cru",
  "gevrey chambertin premier cru",
]);
const GEEK = new Set([
  "côtes du jura", "arbois", "l étoile", "vin de savoie", "roussette de savoie",
  "vin des allobroges", "vins de corse", "corse figari", "muscat du cap corse",
  "mosel", "kamptal", "swartland", "afrique du sud", "californie",
  "santa cruz mountains", "muscat of kefalonia", "rethymno", "rioja", "kerner",
  "pinot bianco", "moscato giallo passito", "valpolicella superiore", "cornas",
  "maury", "jurançon", "savennières", "savennières roche aux moines",
  "savennières coulée de serrant", "jasnières", "quarts de chaume",
  "coteaux du layon", "vin de france", "igp pays d hérault",
  "igp côtes catalanes", "igp collines rhodaniennes", "igp alpilles",
  "saint guilhem le désert",
]);
const EASY = new Set([
  "moulin à vent", "côtes du rhône", "saumur", "saumur champigny", "bourgueil",
  "chinon", "anjou", "corbières", "languedoc", "bordeaux supérieur",
  "côtes de bourg", "côtes de bordeaux", "muscadet sèvre et maine", "tavel",
  "pic saint loup", "les baux de provence", "vin de pays du vaucluse",
  "vin de pays des bouches du rhône", "touraine amboise", "crozes hermitage",
]);
const ELEGANT = new Set([
  "sancerre", "vouvray", "montlouis sur loire", "condrieu", "chablis",
  "chablis premier cru", "meursault", "volnay", "volnay premier cru",
  "givry premier cru", "beaune premier cru", "beaune pertuizots premier cru",
  "santenay premier cru", "maranges premier cru", "saint aubin premier cru",
  "montagny premier cru", "menetou salon", "menetou salon morogues",
  "macon chaintré", "macon cruzille", "alsace", "alsace riesling",
  "alsace pinot noir", "alsace grand cru", "alsace grand cru grafenreben",
  "alsace grand cru schlossberg", "crémant d alsace", "riesling",
  "saint joseph", "nuits saint georges", "gevrey chambertin",
]);
const FAMILY = new Set([
  "châteauneuf du pape", "bandol", "cahors", "haut médoc", "porto",
  "muscat de beaumes de venise",
]);

const LONG_RED = new Set([
  "châteauneuf du pape", "hermitage", "côte rôtie", "cornas", "barolo",
  "brunello di montalcino", "pauillac", "margaux", "saint estèphe", "haut médoc",
  "chambertin grand cru", "gevrey chambertin", "gevrey chambertin premier cru",
  "nuits saint georges", "bandol", "rioja", "cahors", "valpolicella superiore",
]);
const LONG_WHITE = new Set([
  "vouvray", "savennières", "savennières roche aux moines",
  "savennières coulée de serrant", "jasnières", "mosel", "alsace grand cru",
  "alsace grand cru grafenreben", "alsace grand cru schlossberg", "riesling",
  "montlouis sur loire", "meursault premier cru", "puligny montrachet",
  "chablis premier cru", "kamptal",
]);

function resolveGrapes(a, color) {
  const g = a && a.g;
  if (!g) return "";
  if (typeof g === "string") return g;
  return g[color] || g.rouge || g.blanc || Object.values(g)[0] || "";
}

// Fallback: detect a grape named in the cuvée/wine name (common in Alsace,
// varietal IGP, Vin de France…). Order matters (more specific first).
const NAME_GRAPES = [
  [/gewurztraminer|gewurz/i, "Gewurztraminer"],
  [/pinot\s*gris|tokay/i, "Pinot Gris"],
  [/pinot\s*blanc|klevner/i, "Pinot Blanc"],
  [/pinot\s*noir/i, "Pinot Noir"],
  [/riesling/i, "Riesling"],
  [/sylvaner/i, "Sylvaner"],
  [/gr[üu]ner\s*veltliner/i, "Grüner Veltliner"],
  [/sauvignon/i, "Sauvignon Blanc"],
  [/chardonnay/i, "Chardonnay"],
  [/chenin/i, "Chenin Blanc"],
  [/viognier/i, "Viognier"],
  [/marsanne/i, "Marsanne"],
  [/roussanne/i, "Roussanne"],
  [/savagnin/i, "Savagnin"],
  [/alig[oô]t[ée]/i, "Aligoté"],
  [/muscat/i, "Muscat"],
  [/syrah|shiraz/i, "Syrah"],
  [/mourv[èe]dre/i, "Mourvèdre"],
  [/grenache/i, "Grenache"],
  [/cabernet\s*franc/i, "Cabernet Franc"],
  [/cabernet/i, "Cabernet Sauvignon"],
  [/merlot/i, "Merlot"],
  [/gamay/i, "Gamay"],
  [/malbec|c[oô]t\b/i, "Malbec"],
  [/nebbiolo/i, "Nebbiolo"],
  [/sangiovese/i, "Sangiovese"],
  [/tempranillo/i, "Tempranillo"],
  [/nielluccio/i, "Nielluccio"],
  [/mondeuse/i, "Mondeuse"],
  [/altesse/i, "Altesse"],
  [/poulsard|ploussard/i, "Poulsard"],
  [/trousseau/i, "Trousseau"],
  [/vermentin[ou]/i, "Vermentinu"],
];

function grapeFromName(text) {
  const t = text || "";
  for (const [re, label] of NAME_GRAPES) if (re.test(t)) return label;
  return "";
}

function garde(b, key) {
  const v = b.vintage;
  if (!v) return {};
  const c = b.color;
  let from = 1, to = 6;
  if (c === "rouge") { from = 2; to = 8; }
  else if (c === "blanc") { from = 1; to = 5; }
  else if (c === "effervescent") { from = 1; to = 7; }
  else if (c === "rosé") { from = 0; to = 2; }
  else if (c === "doux") { from = 3; to = 25; }
  else if (c === "orange") { from = 1; to = 8; }
  const premier = key.includes("premier cru") || key.includes("grand cru");
  if (c === "rouge") {
    if (LONG_RED.has(key)) { from = 4; to = 25; }
    else if (premier) { from = 3; to = 15; }
  } else if (c === "blanc") {
    if (LONG_WHITE.has(key)) { from = 3; to = 20; }
    else if (premier) { from = 2; to = 12; }
  } else if (c === "doux") {
    if (key === "porto") { from = 0; to = 40; }
    else if (key === "sauternes") { from = 5; to = 40; }
    else if (["coteaux du layon", "quarts de chaume", "jurançon"].includes(key)) { from = 4; to = 35; }
  } else if (c === "effervescent" && key === "champagne") {
    from = 2; to = 15;
  }
  return { drinkFrom: v + from, drinkTo: v + to };
}

function assignOccasion(b, key) {
  const fmt = (b.format || "").toLowerCase();
  const big = /magnum|jéroboam|jeroboam|réhoboam|rehoboam|mathusalem/.test(fmt);
  if (GRAND.has(key)) return "Un grand moment";
  if (big) return "Repas de famille / fêtes";
  if (GEEK.has(key) || b.color === "orange") return "Pépite pour passionnés";
  if (b.color === "doux") return "Repas de famille / fêtes";
  if (EASY.has(key) || b.color === "rosé") return "Un moment simple entre copains";
  if (ELEGANT.has(key) || b.color === "effervescent") return "Dîner à deux";
  if (FAMILY.has(key)) return "Repas de famille / fêtes";
  if (b.color === "rouge") return "Un moment simple entre copains";
  if (b.color === "blanc") return "Dîner à deux";
  return "Un moment simple entre copains";
}

const stats = { region: 0, grapes: 0, garde: 0, occasion: 0 };
const unmapped = new Set();

for (const b of bottles) {
  const key = norm(b.appellation);
  const a = APP[key];
  if (!a && b.appellation) unmapped.add(b.appellation);

  if (!b.region && a && a.r) { b.region = a.r; stats.region++; }
  if (!b.subRegion && a && a.s) b.subRegion = a.s;
  if (!b.grapes) {
    const gr = resolveGrapes(a, b.color);
    if (gr) { b.grapes = gr; stats.grapes++; }
  }
  if (!b.grapes) {
    const gr2 = grapeFromName(`${b.name || ""} ${b.cuvee || ""}`);
    if (gr2) { b.grapes = gr2; stats.grapes++; }
  }
  const gw = garde(b, key);
  if (b.drinkFrom == null && gw.drinkFrom != null) { b.drinkFrom = gw.drinkFrom; stats.garde++; }
  if (b.drinkTo == null && gw.drinkTo != null) b.drinkTo = gw.drinkTo;
  if (!b.occasion) { b.occasion = assignOccasion(b, key); stats.occasion++; }
}

fs.writeFileSync(file, JSON.stringify(bottles, null, 2) + "\n", "utf8");
console.log(`Enriched ${bottles.length} bottles.`);
console.log(`  region filled : ${stats.region}`);
console.log(`  grapes filled : ${stats.grapes}`);
console.log(`  garde filled  : ${stats.garde}`);
console.log(`  occasion set  : ${stats.occasion}`);
if (unmapped.size)
  console.log(`  UNMAPPED appellations (region not filled): ${[...unmapped].join(", ")}`);

// Occasion distribution
const dist = {};
for (const b of bottles) dist[b.occasion] = (dist[b.occasion] || 0) + 1;
console.log("  occasions:", JSON.stringify(dist));
