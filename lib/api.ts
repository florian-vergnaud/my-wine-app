"use client";

import { getSupabase } from "./supabaseClient";

/**
 * POSTs JSON to one of our /api routes. Attaches the Supabase access token
 * when available so the server can protect the (paid) Claude endpoints.
 * Throws a friendly Error on non-2xx or when the route is missing.
 */
export async function apiPost<T = any>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    /* non-JSON response (e.g. a 404 page) */
  }
  if (!res.ok) {
    throw new Error(
      json?.error || `La fonction IA n'est pas disponible (${res.status}).`,
    );
  }
  return json as T;
}
