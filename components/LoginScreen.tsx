"use client";

import { useState } from "react";
import { useAuth } from "@/lib/authContext";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      setError(err.message || "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-5 text-center">
          <div className="text-4xl">🍇</div>
          <h1 className="mt-2 font-serif text-2xl font-bold text-wine-800">
            Ma Cave Virtuelle
          </h1>
          <p className="text-sm text-wine-500">Accès privé</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-wine-400">
          Compte créé depuis le tableau de bord Supabase (Authentication → Users).
        </p>
      </div>
    </div>
  );
}
