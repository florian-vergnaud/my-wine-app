import {
  getClient,
  MODEL,
  textOf,
  parseJsonLoose,
  createWithTools,
  aiError,
  SOMMELIER,
} from "@/lib/server/ai";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM =
  SOMMELIER +
  " Tu rassembles, via recherche web, DEUX choses sur un vin : (1) une SYNTHÈSE " +
  "QUALITATIVE de ce que dit la communauté de La Passion du Vin (lapassionduvin.com), " +
  "et (2) les NOTES de critiques et communautés externes. " +
  "Méthode LPV : lance une recherche « [producteur] [cuvée] [millésime] lpv » — le " +
  "mot-clé `lpv` fait remonter directement le bon fil de La Passion du Vin ; exploite-le " +
  "en priorité. Pour les notes, cherche Wine-Searcher (qui agrège de nombreux critiques, " +
  "dont la RVF), Vivino (note sur 5 + nombre d'avis), Wine Spectator / Parker (sur 100) et " +
  "la Revue du Vin de France (sur 20). CONSERVE l'échelle d'origine de chaque note (ne la " +
  "normalise pas). Sois honnête s'il y a peu d'informations sur ce vin précis, et N'INVENTE " +
  "JAMAIS de note ni de citation.";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.name && !b.producer) return aiError(new Error("Vin non identifié."), 400);

    const client = getClient();
    const user = `Vin : ${b.producer || ""} — ${b.name || ""} ${b.vintage || ""}
Cru / classement : ${b.cuvee || "—"}
Appellation : ${b.appellation || "?"} (${b.region || "?"})
Couleur : ${b.color || "?"}

Réponds UNIQUEMENT par un objet JSON (aucun texte autour) :
{
  "summary": "<synthèse en français, 2 à 4 paragraphes : arômes/structure typiques, consensus de qualité, fenêtre de garde évoquée, accords cités ; distingue clairement ce qui vient de LPV de ce qui vient d'ailleurs>",
  "ratings": [
    { "source": "Vivino", "score": "4.1/5", "scale": "/5", "count": 1234 },
    { "source": "Wine Spectator", "score": "93/100", "scale": "/100", "count": null }
  ],
  "sources": ["lapassionduvin.com", "wine-searcher.com"]
}
Si aucune note fiable n'est trouvée, mets "ratings": []. Garde "score" tel quel (ex. "16/20").`;

    const resp = await createWithTools(
      client,
      {
        model: MODEL,
        max_tokens: 2500,
        system: SYSTEM,
        thinking: { type: "adaptive" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
        messages: [{ role: "user", content: user }],
      },
      4,
    );

    const text = textOf(resp);
    try {
      return Response.json(parseJsonLoose(text));
    } catch {
      // Model returned prose (e.g. when web search was rate-limited) instead of
      // JSON — surface it as the summary rather than failing.
      return Response.json({ summary: text, ratings: [] });
    }
  } catch (e) {
    return aiError(e);
  }
}
