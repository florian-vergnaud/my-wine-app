"use client";

import { useMemo } from "react";
import { useCellar } from "@/lib/cellarContext";
import { colorMeta, formatPrice } from "@/lib/format";

function countBy<T>(items: T[], key: (t: T) => string | undefined, weight: (t: T) => number) {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    if (!k) continue;
    map.set(k, (map.get(k) || 0) + weight(it));
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function BarList({
  title,
  data,
  max,
}: {
  title: string;
  data: [string, number][];
  max?: number;
}) {
  const top = data.slice(0, max ?? 8);
  const peak = Math.max(1, ...top.map((d) => d[1]));
  return (
    <div className="card p-4">
      <h3 className="mb-3 font-serif font-semibold text-wine-800">{title}</h3>
      {top.length === 0 ? (
        <p className="text-sm text-wine-400">—</p>
      ) : (
        <div className="space-y-2">
          {top.map(([label, n]) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-wine-600">
                <span className="truncate pr-2">{label}</span>
                <span>{n}</span>
              </div>
              <div className="h-2 rounded-full bg-wine-100">
                <div
                  className="h-2 rounded-full bg-wine-600"
                  style={{ width: `${(n / peak) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StatsPage() {
  const { ready, bottles, history } = useCellar();

  const data = useMemo(() => {
    const qty = (b: { quantity?: number }) => b.quantity || 0;
    const byColor = countBy(bottles, (b) => colorMeta(b.color).label, qty);
    const byCountry = countBy(bottles, (b) => b.country, qty);
    const byAppellation = countBy(bottles, (b) => b.appellation, qty);
    const byVintage = countBy(
      bottles,
      (b) => (b.vintage ? String(b.vintage) : undefined),
      qty,
    );
    const totalBottles = bottles.reduce((a, b) => a + qty(b), 0);
    const value = bottles.reduce(
      (a, b) => a + (b.purchasePrice || 0) * qty(b),
      0,
    );
    const thisYear = new Date().getFullYear();
    const drunkThisYear = history.filter(
      (h) => new Date(h.date).getFullYear() === thisYear,
    ).length;
    const rated = history.filter((h) => h.rating != null);
    const avgRating = rated.length
      ? rated.reduce((a, h) => a + (h.rating || 0), 0) / rated.length
      : 0;
    return {
      byColor,
      byCountry,
      byAppellation,
      byVintage: byVintage.sort((a, b) => Number(b[0]) - Number(a[0])),
      totalBottles,
      value,
      drunkThisYear,
      avgRating,
    };
  }, [bottles, history]);

  if (!ready) return <p className="text-wine-500">Chargement…</p>;

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl font-bold text-wine-800">
        📊 Statistiques
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <div className="text-2xl font-bold text-wine-800">{bottles.length}</div>
          <div className="text-xs text-wine-500">Références</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-wine-800">
            {data.totalBottles}
          </div>
          <div className="text-xs text-wine-500">Bouteilles</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-wine-800">
            {data.value ? formatPrice(data.value) : "—"}
          </div>
          <div className="text-xs text-wine-500">Valeur estimée</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-wine-800">
            {data.drunkThisYear}
          </div>
          <div className="text-xs text-wine-500">Bues cette année</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BarList title="Par couleur" data={data.byColor} />
        <BarList title="Par pays" data={data.byCountry} />
        <BarList title="Par appellation (top 10)" data={data.byAppellation} max={10} />
        <BarList title="Par millésime" data={data.byVintage} max={10} />
      </div>
    </div>
  );
}
