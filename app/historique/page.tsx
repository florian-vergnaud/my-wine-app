"use client";

import { useMemo, useState } from "react";
import { useCellar } from "@/lib/cellarContext";
import { bottleTitle, formatDate, stars, todayISO } from "@/lib/format";
import { exportHistory } from "@/lib/excel";
import type { HistoryEntry } from "@/lib/types";
import TastingModal from "@/components/TastingModal";

function newEntry(): HistoryEntry {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: "",
    date: todayISO(),
    createdAt: now,
    updatedAt: now,
  };
}

export default function HistoriquePage() {
  const { ready, history, removeHistory } = useCellar();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<HistoryEntry | null>(null);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return history;
    return history.filter((h) =>
      [h.name, h.producer, h.region, h.appellation, h.notes, h.meal]
        .join(" ")
        .toLowerCase()
        .includes(n),
    );
  }, [history, q]);

  if (!ready) return <p className="text-wine-500">Chargement…</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-wine-800">
            📖 Mes dégustations
          </h1>
          <p className="text-sm text-wine-500">
            Journal des bouteilles ouvertes et de vos impressions.
          </p>
        </div>
        <div className="flex gap-2">
          {history.length > 0 && (
            <button className="btn btn-secondary" onClick={() => exportHistory(history)}>
              ⬇️ Exporter
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setEditing(newEntry())}>
            ➕ Ajouter une dégustation
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <input
          className="input"
          placeholder="Rechercher dans le journal…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      )}

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-wine-500">
          Aucune bouteille ouverte pour l'instant. Depuis « Ma cave », touchez
          « J'en bois une » sur une bouteille pour la consigner ici.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((h) => (
            <div key={h.id} className="card flex items-start gap-3 p-4">
              {h.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={h.photoUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-serif font-semibold text-wine-900">
                    {bottleTitle(h)}
                  </h3>
                  <span className="text-xs text-wine-400">{formatDate(h.date)}</span>
                </div>
                <p className="text-sm text-amber-500">{stars(h.rating)}</p>
                {h.meal && (
                  <p className="text-xs text-wine-500">🍽️ {h.meal}</p>
                )}
                {h.notes && (
                  <p className="mt-1 text-sm text-wine-700">{h.notes}</p>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    className="btn btn-ghost px-2 py-1 text-xs"
                    onClick={() => setEditing(h)}
                  >
                    ✏️ Modifier la note
                  </button>
                  <button
                    className="btn btn-ghost px-2 py-1 text-xs text-red-600"
                    onClick={() =>
                      confirm("Supprimer cette entrée du journal ?") &&
                      removeHistory(h.id)
                    }
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TastingModal entry={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
