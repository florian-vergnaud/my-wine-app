import Anthropic from "@anthropic-ai/sdk";

// Server-only Claude helpers. Reads the key from the environment (Next.js
// loads .env.local for route handlers). Default model is the most capable;
// override with ANTHROPIC_MODEL (e.g. claude-sonnet-4-6 for lower cost).
export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Clé Claude absente côté serveur (ANTHROPIC_API_KEY). Voir le README.",
    );
  }
  return new Anthropic({ apiKey });
}

/** Concatenates the text blocks of a Messages response (ignores thinking/tool blocks). */
export function textOf(resp: any): string {
  return (resp?.content ?? [])
    .filter((b: any) => b?.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim();
}

/** Tolerant JSON extraction: strips code fences and surrounding prose. */
export function parseJsonLoose<T = any>(text: string): T {
  let t = (text || "").trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const firstObj = t.indexOf("{");
  const firstArr = t.indexOf("[");
  const starts = [firstObj, firstArr].filter((n) => n >= 0);
  if (starts.length) t = t.slice(Math.min(...starts));
  const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (end >= 0) t = t.slice(0, end + 1);
  return JSON.parse(t) as T;
}

/**
 * Runs a request that may use server-side tools (e.g. web search), resuming
 * automatically while the API returns stop_reason "pause_turn".
 */
export async function createWithTools(
  client: Anthropic,
  params: any,
  maxResume = 5,
): Promise<any> {
  let resp: any = await client.messages.create(params);
  let messages = params.messages.slice();
  let i = 0;
  while (resp?.stop_reason === "pause_turn" && i < maxResume) {
    messages = [...messages, { role: "assistant", content: resp.content }];
    resp = await client.messages.create({ ...params, messages });
    i++;
  }
  return resp;
}

export function aiError(e: any, status = 500): Response {
  const msg = e?.message || "Erreur interne";
  return Response.json({ error: msg }, { status });
}

/** Shared sommelier persona used across the AI features. */
export const SOMMELIER =
  "Tu es LE MEILLEUR SOMMELIER DE FRANCE — Meilleur Ouvrier de France en " +
  "sommellerie, chef sommelier d'une grande maison étoilée. Ta connaissance " +
  "des domaines, des cuvées, des terroirs et des millésimes est encyclopédique " +
  "et d'une précision absolue.";
