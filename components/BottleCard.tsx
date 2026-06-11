"use client";

import type { Bottle } from "@/lib/types";
import { useCellar } from "@/lib/cellarContext";
import { bottleTitle, colorMeta, formatPrice, stars } from "@/lib/format";
import { drinkInfo, STATUS_META } from "@/lib/drinkWindow";

export default function BottleCard({
  bottle,
  onConsume,
  onEdit,
}: {
  bottle: Bottle;
  onConsume: (id: string) => void;
  onEdit: (bottle: Bottle) => void;
}) {
  const { priorTastings } = useCellar();
  const cm = colorMeta(bottle.color);
  const di = drinkInfo(bottle);
  const sm = STATUS_META[di.status];
  const prior = priorTastings(bottle);
  const last = prior[0];

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-serif font-semibold text-wine-900">
            {bottleTitle(bottle)}
          </h3>
          <p className="truncate text-xs text-wine-500">
            {[bottle.appellation, bottle.region, bottle.country]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
        <span className={`chip ${cm.chip} shrink-0`}>
          <span className={`h-2 w-2 rounded-full ${cm.dot}`} />
          {cm.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="chip bg-wine-50 text-wine-700">
          {bottle.quantity} × {bottle.format || "75cl"}
        </span>
        <span className={`chip ${sm.chip}`}>{di.label}</span>
        {bottle.occasion && (
          <span className="chip bg-purple-100 text-purple-700">{bottle.occasion}</span>
        )}
        {bottle.purchasePrice != null && (
          <span className="chip bg-gray-100 text-gray-600">
            {formatPrice(bottle.purchasePrice)}
          </span>
        )}
      </div>

      {(bottle.location || bottle.grapes) && (
        <div className="space-y-0.5 text-xs text-wine-500">
          {bottle.location && <p>📍 {bottle.location}</p>}
          {bottle.grapes && <p>🍇 {bottle.grapes}</p>}
        </div>
      )}

      {bottle.rating != null && (
        <p className="text-xs text-wine-600">
          {bottle.ratingSource || "Note externe"} : {bottle.rating}
          {bottle.ratingScale || ""}
          {bottle.ratingCount ? ` (${bottle.ratingCount} avis)` : ""}
        </p>
      )}

      {last && (
        <div className="rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          La dernière fois : {stars(last.rating)}{" "}
          {last.notes ? `— « ${last.notes.slice(0, 70)}${last.notes.length > 70 ? "…" : ""} »` : ""}
        </div>
      )}

      <div className="mt-auto flex gap-2 pt-1">
        <button onClick={() => onConsume(bottle.id)} className="btn btn-primary flex-1">
          🍷 J'en bois une
        </button>
        <button onClick={() => onEdit(bottle)} className="btn btn-secondary">
          Modifier
        </button>
      </div>
    </div>
  );
}
