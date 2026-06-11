"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_ENABLED, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/** Returns a memoized browser Supabase client, or null in demo mode. */
export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_ENABLED) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
