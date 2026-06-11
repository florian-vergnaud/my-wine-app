import { getClient, MODEL, textOf, parseJsonLoose, aiError, SOMMELIER } from "@/lib/server/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const client = getClient();
    const v = b.vintage ? String(b.vintage) : "non millésimé";
    const user = `Donne la fenêtre de consommation OPTIMALE (apogée) de ce vin, en tenant compte de la réputation du producteur, du niveau de la cuvée, de l'appellation, de la qualité du millésime et du type de vin :

Producteur : ${b.producer || "?"}
Cuvée / nom : ${b.name || "?"}
Appellation : ${b.appellation || "?"}
Région / pays : ${b.region || "?"} / ${b.country || "?"}
Couleur : ${b.color || "?"}
Millésime : ${v}

Si le millésime est absent, base-toi sur l'année courante (2026).
Réponds UNIQUEMENT par un objet JSON : { "drinkFrom": <année>, "drinkTo": <année>, "note": "<courte justification en français>" }`;

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: SOMMELIER,
      messages: [{ role: "user", content: user }],
    } as any);

    return Response.json(parseJsonLoose(textOf(resp)));
  } catch (e) {
    return aiError(e);
  }
}
