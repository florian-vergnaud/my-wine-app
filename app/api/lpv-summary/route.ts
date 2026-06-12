import { getClient, MODEL, textOf, createWithTools, aiError, SOMMELIER } from "@/lib/server/ai";
import { requireAuth } from "@/lib/server/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM =
  SOMMELIER +
  " Tu produis une SYNTHÈSE QUALITATIVE de ce que la communauté de La Passion du Vin " +
  "(lapassionduvin.com) et la critique disent d'un vin. Méthode : effectue D'ABORD une " +
  "recherche web avec la requête « [producteur] [cuvée] [millésime] lpv » — ajouter le " +
  "mot-clé `lpv` fait remonter directement le bon fil de La Passion du Vin. Ouvre et exploite " +
  "en priorité ce fil ; tu peux aussi essayer `site:lapassionduvin.com [producteur] [cuvée]`. " +
  "Fonde ta synthèse PRINCIPALEMENT sur les fils LPV ; ne complète avec d'autres sources " +
  "sérieuses (Wine-Searcher, RVF, etc.) que si LPV est pauvre — et indique-le. Distingue " +
  "clairement ce qui vient de LPV de ce qui vient d'ailleurs. Couvre : arômes et structure " +
  "typiques, consensus sur la qualité, fenêtre de garde évoquée, accords mets-vins cités, et " +
  "les notes de critiques si tu en trouves (en conservant l'échelle, ex. 16/20). Sois honnête " +
  "s'il y a peu d'informations sur ce vin précis. Réponds en français, en quelques paragraphes " +
  "courts. Termine par une ligne « Sources : » listant les domaines consultés.";

export async function POST(req: Request) {
  try {
    const denied = await requireAuth(req);
    if (denied) return denied;
    const b = await req.json();
    if (!b.name && !b.producer) {
      return aiError(new Error("Vin non identifié."), 400);
    }
    const client = getClient();
    const user = `Vin : ${b.producer || ""} — ${b.name || ""} ${b.vintage || ""}
Appellation : ${b.appellation || "?"} (${b.region || "?"})
Couleur : ${b.color || "?"}

Produis la synthèse « impression de la communauté ».`;

    const resp = await createWithTools(client, {
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
      messages: [{ role: "user", content: user }],
    });

    const summary = textOf(resp);
    if (!summary) return aiError(new Error("Aucune synthèse générée."), 502);
    return Response.json({ summary });
  } catch (e) {
    return aiError(e);
  }
}
