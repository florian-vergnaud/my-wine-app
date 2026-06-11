"use client";

import { useMemo, useState } from "react";
import { useCellar } from "@/lib/cellarContext";
import { drinkInfo, drinkSoonList } from "@/lib/drinkWindow";
import { bottleTitle } from "@/lib/format";
import { apiPost } from "@/lib/api";
import type { Bottle } from "@/lib/types";
import CellarTable from "@/components/CellarTable";
import WineFormModal from "@/components/WineFormModal";

interface Pick {
  id: string;
  title: string;
  reason: string;
}
interface PairingResult {
  topPick?: Pick;
  alternatives?: Pick[];
  comment?: string;
}

const CONTEXTS = [
  "À la maison, soir de semaine",
  "À la maison, occasion",
  "Entre amis",
  "Chez la belle-famille",
  "Dîner important",
];

function candidates(bottles: Bottle[]): Bottle[] {
  return [...bottles]
    .filter((b) => b.quantity > 0)
    .sort((a, b) => drinkInfo(a).priority - drinkInfo(b).priority)
    .slice(0, 40);
}

export default function QuoiBoirePage() {
  const { ready, bottles } = useCellar();
  const [editing, setEditing] = useState<Bottle | null>(null);

  // --- meal pairing -------------------------------------------------------
  const [meal, setMeal] = useState("");
  const [context, setContext] = useState(CONTEXTS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PairingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPair(e: React.FormEvent) {
    e.preventDefault();
    if (!meal.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const list = candidates(bottles).map((b) => ({
        id: b.id,
        name: bottleTitle(b),
        color: b.color,
        appellation: b.appellation,
        region: b.region,
        grapes: b.grapes,
        vintage: b.vintage,
        drink: drinkInfo(b).label,
      }));
      const res = await apiPost<PairingResult>("/api/pairing", {
        meal,
        context,
        candidates: list,
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const soon = useMemo(() => drinkSoonList(bottles), [bottles]);
  const byId = (id: string) => bottles.find((b) => b.id === id);

  function PickCard({ pick, badge }: { pick: Pick; badge: string }) {
    const b = byId(pick.id);
    return (
      <div className="card p-4">
        <span className="chip mb-2 bg-wine-700 text-white">{badge}</span>
        <h3 className="font-serif font-semibold text-wine-900">{pick.title}</h3>
        <p className="mt-1 text-sm text-wine-700">{pick.reason}</p>
        {b && (
          <button
            onClick={() => setEditing(b)}
            className="mt-2 text-sm text-wine-600 hover:underline"
          >
            Voir / modifier la fiche →
          </button>
        )}
      </div>
    );
  }

  if (!ready) return <p className="text-wine-500">Chargement…</p>;

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-bold text-wine-800">
        🍽️ Quoi boire ce soir ?
      </h1>

      {/* 1. Meal pairing */}
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-wine-800">
          Suggérer un vin pour un plat
        </h2>
        <form onSubmit={onPair} className="card space-y-3 p-4">
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[220px] flex-1">
              <label className="label">Qu'allez-vous manger ?</label>
              <input
                className="input"
                placeholder="ex. poulet rôti aux herbes, plateau de fromages…"
                value={meal}
                onChange={(e) => setMeal(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Contexte</label>
              <select
                className="input"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              >
                {CONTEXTS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Réflexion…" : "Proposer un accord"}
          </button>
        </form>

        {error && (
          <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
            <p className="mt-1 text-xs text-amber-700">
              Cette suggestion utilise l'API Claude. Renseignez{" "}
              <code>ANTHROPIC_API_KEY</code> (voir le README) pour l'activer.
            </p>
          </div>
        )}
        {result && (
          <div className="space-y-3">
            {result.comment && (
              <p className="text-sm italic text-wine-600">{result.comment}</p>
            )}
            {result.topPick && <PickCard pick={result.topPick} badge="Mon choix" />}
            {result.alternatives && result.alternatives.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {result.alternatives.map((a) => (
                  <PickCard key={a.id} pick={a} badge="Alternative" />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. Drink soon */}
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-wine-800">
          ⏰ À boire bientôt
        </h2>
        <p className="text-sm text-wine-500">
          Dans la fenêtre de garde ou proche de l'apogée, les plus urgentes d'abord.
        </p>
        <CellarTable
          bottles={soon}
          onEdit={setEditing}
          showColumnFilters={false}
          empty="Renseignez les fenêtres de garde (fiche du vin → « Estimer la fenêtre ») pour activer ces suggestions."
        />
      </section>

      {/* 3. Search with per-column filters */}
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-wine-800">
          🔎 Trouver une bouteille
        </h2>
        <p className="text-sm text-wine-500">
          Filtrez chaque colonne (occasion, région, couleur, pays…) pour trouver
          la bonne bouteille.
        </p>
        <CellarTable
          bottles={bottles}
          onEdit={setEditing}
          empty="Aucune bouteille ne correspond à ces filtres."
        />
      </section>

      {editing && (
        <WineFormModal bottle={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
