"use client";

import { useState } from "react";
import type { Bottle } from "@/lib/types";
import { useCellar } from "@/lib/cellarContext";
import { apiPost } from "@/lib/api";
import { bottleTitle, colorMeta, formatPrice, formatDate, stars } from "@/lib/format";
import { drinkInfo, STATUS_META } from "@/lib/drinkWindow";

interface Rating {
  source: string;
  score: string;
  scale?: string;
  count?: number | null;
}
interface WineInfo {
  summary?: string;
  ratings?: Rating[];
  sources?: string[];
}

function parseScore(s: string): number | null {
  const m = String(s).match(/-?\d+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(",", ".")) : null;
}

/** Read-only bottle detail shown when a cellar row is clicked. */
export default function BottleDetailModal({
  bottle,
  onClose,
  onConsume,
  onEdit,
}: {
  bottle: Bottle;
  onClose: () => void;
  onConsume: (id: string) => void;
  onEdit: (b: Bottle) => void;
}) {
  const { priorTastings, saveBottle } = useCellar();
  const [info, setInfo] = useState<{
    loading: boolean;
    data?: WineInfo;
    error?: string;
  }>({ loading: false });
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const cm = colorMeta(bottle.color);
  const di = drinkInfo(bottle);
  const sm = STATUS_META[di.status];
  const prior = priorTastings(bottle);

  async function onInfo() {
    setInfo({ loading: true });
    try {
      const data = await apiPost<WineInfo>("/api/wine-info", {
        producer: bottle.producer,
        name: bottle.name,
        vintage: bottle.vintage,
        appellation: bottle.appellation,
        region: bottle.region,
        color: bottle.color,
        cuvee: bottle.cuvee,
      });
      setInfo({ loading: false, data });
    } catch (e: any) {
      setInfo({ loading: false, error: e.message });
    }
  }

  async function saveRating(r: Rating) {
    await saveBottle({
      ...bottle,
      rating: parseScore(r.score),
      ratingScale: r.scale || r.score.replace(/^[\d.,]+/, ""),
      ratingSource: r.source,
      ratingCount: r.count ?? null,
    });
    setSavedMsg(`Note ${r.source} enregistrée sur la fiche.`);
  }

  const rows: [string, string | number | null | undefined][] = [
    ["Pays", bottle.country],
    ["Région", bottle.region],
    ["Sous-région", bottle.subRegion],
    ["Appellation", bottle.appellation],
    ["Cru / classement", bottle.cuvee],
    ["Cépages", bottle.grapes],
    ["Vigneron", bottle.winemaker],
    ["Format", bottle.format],
    ["Quantité", bottle.quantity],
    ["Emplacement", bottle.location],
    ["Occasion", bottle.occasion],
    [
      "Fenêtre de garde",
      bottle.drinkFrom || bottle.drinkTo
        ? `${bottle.drinkFrom ?? "?"} – ${bottle.drinkTo ?? "?"}`
        : null,
    ],
    ["Date d'achat", bottle.purchaseDate],
    ["Prix d'achat", bottle.purchasePrice != null ? formatPrice(bottle.purchasePrice) : null],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-start sm:p-4 sm:py-8">
      <div className="card max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-b-none p-5 sm:rounded-b-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-bold text-wine-900">
              {bottleTitle(bottle)}
            </h2>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className={`chip ${cm.chip}`}>
                <span className={`h-2 w-2 rounded-full ${cm.dot}`} />
                {cm.label}
              </span>
              <span className={`chip ${sm.chip}`}>{di.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost px-2" aria-label="Fermer">
            ✕
          </button>
        </div>

        {/* attributes */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
          {rows
            .filter(([, v]) => v != null && v !== "")
            .map(([label, v]) => (
              <div key={label}>
                <dt className="text-[11px] uppercase tracking-wide text-wine-400">
                  {label}
                </dt>
                <dd className="text-wine-800">{String(v)}</dd>
              </div>
            ))}
        </dl>

        {bottle.notes && (
          <p className="mt-3 rounded-lg bg-wine-50 p-2 text-sm text-wine-700">
            {bottle.notes}
          </p>
        )}

        {bottle.rating != null && (
          <p className="mt-2 text-sm text-wine-600">
            Note externe enregistrée : <strong>{bottle.rating}{bottle.ratingScale || ""}</strong>{" "}
            {bottle.ratingSource ? `(${bottle.ratingSource})` : ""}
          </p>
        )}

        {/* prior tastings — memory / continuity */}
        {prior.length > 0 && (
          <div className="mt-3">
            <p className="label">Vos dégustations précédentes</p>
            <div className="space-y-1">
              {prior.slice(0, 3).map((h) => (
                <div key={h.id} className="rounded-lg bg-amber-50 px-2 py-1 text-sm text-amber-800">
                  {formatDate(h.date)} · {stars(h.rating)}
                  {h.notes ? ` — « ${h.notes} »` : ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI info */}
        <div className="mt-4 rounded-lg border border-wine-100 bg-wine-50 p-3">
          <button onClick={onInfo} disabled={info.loading} className="btn btn-primary">
            {info.loading ? "Recherche en cours… (peut prendre 1–2 min)" : "✨ Donne-moi des infos"}
          </button>
          <p className="mt-1 text-xs text-wine-500">
            Synthèse La Passion du Vin + notes Vivino / Wine Spectator / RVF…
          </p>

          {info.error && (
            <p className="mt-2 text-sm text-amber-700">Indisponible : {info.error}</p>
          )}

          {info.data?.ratings && info.data.ratings.length > 0 && (
            <div className="mt-3">
              <p className="label">Notes externes</p>
              <div className="flex flex-wrap gap-2">
                {info.data.ratings.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => saveRating(r)}
                    title="Cliquer pour enregistrer cette note sur la fiche"
                    className="chip bg-white text-wine-700 hover:bg-wine-100"
                  >
                    {r.source} : {r.score}
                    {r.count ? ` (${r.count})` : ""} 💾
                  </button>
                ))}
              </div>
              {savedMsg && <p className="mt-1 text-xs text-green-700">{savedMsg}</p>}
            </div>
          )}

          {info.data?.summary && (
            <div className="mt-3">
              <p className="label">Impression de la communauté (LPV / critique)</p>
              <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-wine-100 bg-white p-2 text-sm text-wine-700">
                {info.data.summary}
              </div>
            </div>
          )}
        </div>

        {/* actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => onConsume(bottle.id)} className="btn btn-primary">
            🍷 J'en bois une
          </button>
          <button onClick={() => onEdit(bottle)} className="btn btn-secondary">
            ✏️ Modifier
          </button>
          <button onClick={onClose} className="btn btn-ghost">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
