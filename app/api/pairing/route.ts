import { getClient, MODEL, textOf, parseJsonLoose, aiError, SOMMELIER } from "@/lib/server/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { meal, context, candidates } = await req.json();
    if (!meal || !Array.isArray(candidates) || candidates.length === 0) {
      return aiError(new Error("Repas ou liste de vins manquants."), 400);
    }

    const client = getClient();
    const user = `Le convive va manger : « ${meal} ».
Contexte : ${context || "non précisé"}.

Voici UNIQUEMENT les vins disponibles en cave (choisis exclusivement parmi ces id) :
${JSON.stringify(candidates)}

Recommande le meilleur accord parmi ces vins. Privilégie, à qualité d'accord égale, les bouteilles à boire bientôt (champ "drink"). Adapte le niveau de la bouteille au contexte (un grand vin pour une grande occasion, une valeur sûre pour un repas simple).

Réponds UNIQUEMENT par un objet JSON (aucun texte autour) :
{
  "comment": phrase d'introduction conviviale (string),
  "topPick": { "id": id du vin choisi, "title": nom du vin, "reason": pourquoi cet accord fonctionne (acidité, tanins, intensité…) },
  "alternatives": [ { "id": ..., "title": ..., "reason": contraste proposé (ex. plus frais / plus puissant) } ]  // 1 à 2 alternatives
}`;

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SOMMELIER,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: user }],
    } as any);

    return Response.json(parseJsonLoose(textOf(resp)));
  } catch (e) {
    return aiError(e);
  }
}
