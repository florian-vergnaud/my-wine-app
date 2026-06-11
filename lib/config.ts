// Reads public configuration available to the browser.
// NEXT_PUBLIC_* vars are inlined at build time.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when Supabase is configured; otherwise the app runs in demo (local) mode. */
export const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const APP_NAME = "Ma Cave Virtuelle";
