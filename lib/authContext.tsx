"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getSupabase } from "./supabaseClient";
import { SUPABASE_ENABLED } from "./config";

interface AuthValue {
  ready: boolean;
  /** True when the app is usable: demo mode, or a logged-in Supabase session. */
  authed: boolean;
  supabaseEnabled: boolean;
  email: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!SUPABASE_ENABLED); // demo mode is ready immediately
  const [email, setEmail] = useState<string | null>(null);
  const [authed, setAuthed] = useState(!SUPABASE_ENABLED); // demo mode is always "authed"

  useEffect(() => {
    if (!SUPABASE_ENABLED) return;
    const sb = getSupabase();
    if (!sb) return;
    let unsub = () => {};
    (async () => {
      const { data } = await sb.auth.getSession();
      setAuthed(!!data.session);
      setEmail(data.session?.user?.email ?? null);
      setReady(true);
      const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
        setAuthed(!!session);
        setEmail(session?.user?.email ?? null);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => unsub();
  }, []);

  async function signIn(emailArg: string, password: string) {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase non configuré.");
    const { error } = await sb.auth.signInWithPassword({
      email: emailArg,
      password,
    });
    if (error) throw new Error(error.message);
  }

  async function signOut() {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ ready, authed, supabaseEnabled: SUPABASE_ENABLED, email, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
