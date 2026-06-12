import { createClient } from "@supabase/supabase-js";

/**
 * Guards the (paid) Claude routes. When Supabase is configured (i.e. in
 * production), a valid logged-in session bearer token is required — this stops
 * anonymous visitors from running up API cost. In demo/local mode (no Supabase
 * env), the routes stay open.
 *
 * Returns a 401 Response to short-circuit the handler, or null when allowed.
 */
export async function requireAuth(req: Request): Promise<Response | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null; // demo / local: open

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }
  try {
    const sb = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await sb.auth.getUser();
    if (error || !data?.user) {
      return Response.json({ error: "Session invalide." }, { status: 401 });
    }
    return null;
  } catch {
    return Response.json({ error: "Session invalide." }, { status: 401 });
  }
}
