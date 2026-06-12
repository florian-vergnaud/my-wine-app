import { getClient, MODEL, textOf, parseJsonLoose, aiError, SOMMELIER } from "@/lib/server/ai";
import { requireAuth } from "@/lib/server/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROMPT = `À partir de cette photo d'étiquette de vin, identifie le vin et renvoie UNIQUEMENT un objet JSON (aucun texte autour) avec ces clés :
{
  "name": cuvée ou nom du vin (string),
  "producer": producteur / domaine / château (string),
  "winemaker": vigneron si visible (string ou null),
  "vintage": millésime (nombre ou null),
  "color": l'une de "rouge","blanc","rosé","effervescent","orange","doux" (string ou null),
  "country": pays (string ou null),
  "region": région viticole (string ou null),
  "subRegion": sous-région (string ou null),
  "appellation": appellation (string ou null),
  "grapes": cépage(s), séparés par des virgules (string ou null),
  "cuvee": mention de cru / classement / lieu-dit (string ou null)
}
Déduis les champs non imprimés (région, cépages) à partir de l'appellation et du producteur quand tu en es sûr ; sinon mets null. Ne mets jamais de texte hors du JSON.`;

export async function POST(req: Request) {
  try {
    const denied = await requireAuth(req);
    if (denied) return denied;
    const { image } = await req.json();
    const m = /^data:(image\/\w+);base64,(.+)$/.exec(image || "");
    if (!m) return aiError(new Error("Image invalide."), 400);
    const [, media_type, data] = m;

    const client = getClient();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SOMMELIER + " Tu es aussi expert en lecture d'étiquettes.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type, data } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    } as any);

    return Response.json(parseJsonLoose(textOf(resp)));
  } catch (e) {
    return aiError(e);
  }
}
