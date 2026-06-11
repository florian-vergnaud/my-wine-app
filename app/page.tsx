"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCellar } from "@/lib/cellarContext";
import { drinkSoonList } from "@/lib/drinkWindow";
import { colorMeta, formatPrice } from "@/lib/format";
import CellarTable from "@/components/CellarTable";
import WineFormModal from "@/components/WineFormModal";
import type { Bottle } from "@/lib/types";

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="card p-4">
      <div className="text-2xl font-bold text-wine-800">{value}</div>
      <div className="text-xs text-wine-500">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const { ready, bottles, history } = useCellar();
  const [editing, setEditing] = useState<Bottle | "new" | null>(null);

  const stats = useMemo(() => {
    const totalBottles = bottles.reduce((a, b) => a + (b.quantity || 0), 0);
    const byColor = new Map<string, number>();
    let value = 0;
    for (const b of bottles) {
      const key = b.color || "autre";
      byColor.set(key, (byColor.get(key) || 0) + (b.quantity || 0));
      if (b.purchasePrice) value += b.purchasePrice * (b.quantity || 0);
    }
    const thisYear = new Date().getFullYear();
    const drunkThisYear = history.filter(
      (h) => new Date(h.date).getFullYear() === thisYear,
    ).length;
    return { totalBottles, byColor: [...byColor.entries()], value, drunkThisYear };
  }, [bottles, history]);

  const soon = useMemo(() => drinkSoonList(bottles).slice(0, 6), [bottles]);

  if (!ready) return <p className="text-wine-500">Chargement de la cave…</p>;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 font-serif text-2xl font-bold text-wine-800">Bonsoir 🍷</h1>
          <p className="text-sm text-wine-500">Votre cave en un coup d'œil.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          ➕ Ajouter un vin
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Références" value={String(bottles.length)} href="/cave" />
        <Stat label="Bouteilles" value={String(stats.totalBottles)} href="/cave" />
        <Stat
          label="Valeur estimée"
          value={stats.value ? formatPrice(stats.value) : "—"}
        />
        <Stat
          label="Bues cette année"
          value={String(stats.drunkThisYear)}
          href="/historique"
        />
      </section>

      <section className="flex flex-wrap gap-2">
        {stats.byColor
          .sort((a, b) => b[1] - a[1])
          .map(([color, n]) => {
            const cm = colorMeta(color);
            return (
              <span key={color} className={`chip ${cm.chip}`}>
                <span className={`h-2 w-2 rounded-full ${cm.dot}`} />
                {cm.label} · {n}
              </span>
            );
          })}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-wine-800">⏰ À boire bientôt</h2>
          <Link href="/quoi-boire" className="text-sm text-wine-600 hover:underline">
            Quoi boire ? →
          </Link>
        </div>
        <CellarTable
          bottles={soon}
          onEdit={(b) => setEditing(b)}
          showColumnFilters={false}
          empty="Rien d'urgent à boire — renseignez les fenêtres de garde pour activer les suggestions."
        />
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/cave" className="btn btn-secondary">
          🍷 Ma cave
        </Link>
        <Link href="/quoi-boire" className="btn btn-secondary">
          🍽️ Quoi boire ?
        </Link>
        <Link href="/historique" className="btn btn-secondary">
          📖 Mes dégustations
        </Link>
        <Link href="/stats" className="btn btn-secondary">
          📊 Statistiques
        </Link>
      </section>

      {editing && (
        <WineFormModal
          bottle={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
