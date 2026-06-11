"use client";

import { useState } from "react";
import { WINE_COLORS, type HistoryEntry } from "@/lib/types";
import { useCellar } from "@/lib/cellarContext";
import { fileToResizedDataUrl } from "@/lib/image";
import { bottleTitle } from "@/lib/format";
import StarRating from "./StarRating";

function num(v: string): number | null {
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Edits a tasting note. Used both from the "I'm drinking this" flow (identity
 * pre-filled) and to log a wine the user doesn't own (identity entered here).
 */
export default function TastingModal({
  entry,
  onClose,
}: {
  entry: HistoryEntry;
  onClose: () => void;
}) {
  const { saveHistory, uploadPhoto } = useCellar();
  const [name, setName] = useState(entry.name ?? "");
  const [producer, setProducer] = useState(entry.producer ?? "");
  const [vintage, setVintage] = useState<number | null>(entry.vintage ?? null);
  const [color, setColor] = useState(entry.color ?? "");
  const [region, setRegion] = useState(entry.region ?? "");
  const [appellation, setAppellation] = useState(entry.appellation ?? "");
  const [rating, setRating] = useState<number | null>(entry.rating ?? null);
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [meal, setMeal] = useState(entry.meal ?? "");
  const [date, setDate] = useState(entry.date);
  const [photoUrl, setPhotoUrl] = useState(entry.photoUrl ?? "");
  const [saving, setSaving] = useState(false);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToResizedDataUrl(file);
    const url = await uploadPhoto(dataUrl, `tasting-${entry.id}`);
    setPhotoUrl(url);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await saveHistory({
        ...entry,
        name,
        producer,
        vintage,
        color,
        region,
        appellation,
        rating,
        notes,
        meal,
        date,
        photoUrl,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-start sm:p-4 sm:py-8">
      <div className="card max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-b-none p-5 sm:rounded-b-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-wine-800">
              Note de dégustation
            </h2>
            <p className="text-sm text-wine-600">
              {bottleTitle({ name, producer, vintage })}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost px-2" aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Nom du vin / cuvée *</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Producteur</label>
              <input
                className="input"
                value={producer}
                onChange={(e) => setProducer(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Millésime</label>
              <input
                className="input"
                type="number"
                value={vintage ?? ""}
                onChange={(e) => setVintage(num(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Couleur</label>
              <select
                className="input"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              >
                <option value="">—</option>
                {WINE_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Région</label>
              <input
                className="input"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Appellation</label>
              <input
                className="input"
                value={appellation}
                onChange={(e) => setAppellation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <span className="label">Note</span>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date?.slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Accompagné de (repas)</label>
            <input
              className="input"
              placeholder="ex. côte de bœuf, gratin dauphinois…"
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Impressions</label>
            <textarea
              className="input min-h-[110px]"
              placeholder="Arômes, structure, évolution, ressenti…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div>
            <span className="label">Photo de la bouteille</span>
            <label className="btn btn-secondary cursor-pointer">
              📷 Prendre / charger une photo
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Bouteille"
                className="mt-2 h-32 rounded-lg object-cover"
              />
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">
            Annuler
          </button>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="btn btn-primary"
          >
            {saving ? "Enregistrement…" : "Enregistrer la note"}
          </button>
        </div>
      </div>
    </div>
  );
}
