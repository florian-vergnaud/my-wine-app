"use client";

import { useMemo, useState } from "react";
import {
  BOTTLE_FORMATS,
  DEFAULT_OCCASIONS,
  WINE_COLORS,
  emptyBottle,
  type Bottle,
  type ParsedWine,
} from "@/lib/types";
import { useCellar } from "@/lib/cellarContext";
import { fileToResizedDataUrl } from "@/lib/image";
import { apiPost } from "@/lib/api";

function num(v: string): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Add or edit a bottle, shown as a modal dialog over the current page. */
export default function WineFormModal({
  bottle,
  onClose,
}: {
  bottle?: Bottle;
  onClose: () => void;
}) {
  const { bottles, units, saveBottle, removeBottle, uploadPhoto } = useCellar();
  const editId = bottle?.id;

  const [b, setB] = useState<Bottle>(() => bottle ?? emptyBottle());
  const [saving, setSaving] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [estimating, setEstimating] = useState(false);

  const occasions = useMemo(() => {
    const set = new Set<string>(DEFAULT_OCCASIONS as readonly string[]);
    bottles.forEach((x) => x.occasion && set.add(x.occasion));
    return [...set];
  }, [bottles]);

  function set<K extends keyof Bottle>(key: K, value: Bottle[K]) {
    setB((prev) => ({ ...prev, [key]: value }));
  }

  async function onScanLabel(file: File) {
    setScanning(true);
    setAiMsg(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      const photoUrl = await uploadPhoto(dataUrl, `label-${b.id}`);
      set("photoUrl", photoUrl);
      const parsed = await apiPost<ParsedWine>("/api/recognize", { image: dataUrl });
      setB((prev) => ({
        ...prev,
        name: parsed.name ?? prev.name,
        producer: parsed.producer ?? prev.producer,
        winemaker: parsed.winemaker ?? prev.winemaker,
        vintage: parsed.vintage ?? prev.vintage,
        color: parsed.color ?? prev.color,
        country: parsed.country ?? prev.country,
        region: parsed.region ?? prev.region,
        subRegion: parsed.subRegion ?? prev.subRegion,
        appellation: parsed.appellation ?? prev.appellation,
        grapes: parsed.grapes ?? prev.grapes,
        cuvee: parsed.cuvee ?? prev.cuvee,
        drinkFrom: parsed.drinkFrom ?? prev.drinkFrom,
        drinkTo: parsed.drinkTo ?? prev.drinkTo,
      }));
      setAiMsg("Champs pré-remplis depuis l'étiquette — vérifiez puis corrigez si besoin.");
    } catch (e: any) {
      setAiMsg(`📷 Photo enregistrée. Reconnaissance automatique indisponible : ${e.message}`);
    } finally {
      setScanning(false);
    }
  }

  async function onEstimateWindow() {
    setEstimating(true);
    setAiMsg(null);
    try {
      const r = await apiPost<{ drinkFrom: number; drinkTo: number; note?: string }>(
        "/api/drink-window",
        {
          name: b.name,
          producer: b.producer,
          vintage: b.vintage,
          color: b.color,
          region: b.region,
          appellation: b.appellation,
          country: b.country,
        },
      );
      setB((prev) => ({ ...prev, drinkFrom: r.drinkFrom, drinkTo: r.drinkTo }));
      setAiMsg(r.note ? `Fenêtre estimée : ${r.note}` : "Fenêtre de garde estimée.");
    } catch (e: any) {
      setAiMsg(`Estimation IA indisponible : ${e.message}`);
    } finally {
      setEstimating(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!b.name.trim()) return;
    setSaving(true);
    try {
      await saveBottle(b);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!editId) return;
    if (!confirm("Supprimer cette référence de la cave ?")) return;
    await removeBottle(editId);
    onClose();
  }

  const field = (label: string, node: React.ReactNode) => (
    <div>
      <span className="label">{label}</span>
      {node}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-start sm:p-4 sm:py-8">
      <form
        onSubmit={onSubmit}
        className="card max-h-[92vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-b-none p-5 sm:rounded-b-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif text-xl font-bold text-wine-800">
            {editId ? "Modifier le vin" : "Ajouter un vin"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost px-2"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="rounded-lg border border-wine-100 bg-wine-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={`btn btn-secondary ${
                scanning ? "pointer-events-none opacity-50" : "cursor-pointer"
              }`}
            >
              {scanning ? "Analyse…" : "📷 Scanner / charger une photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onScanLabel(f);
                  e.target.value = ""; // allow re-selecting the same file
                }}
              />
            </label>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={estimating}
              onClick={onEstimateWindow}
            >
              {estimating ? "Estimation…" : "⏳ Estimer la fenêtre (IA)"}
            </button>
            {b.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.photoUrl} alt="Étiquette" className="h-12 rounded" />
            )}
          </div>
          {aiMsg && <p className="mt-2 text-sm text-wine-600">{aiMsg}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field(
            "Nom / cuvée *",
            <input
              className="input"
              required
              value={b.name}
              onChange={(e) => set("name", e.target.value)}
            />,
          )}
          {field(
            "Producteur / domaine",
            <input
              className="input"
              value={b.producer ?? ""}
              onChange={(e) => set("producer", e.target.value)}
            />,
          )}
          {field(
            "Vigneron",
            <input
              className="input"
              value={b.winemaker ?? ""}
              onChange={(e) => set("winemaker", e.target.value)}
            />,
          )}
          {field(
            "Millésime",
            <input
              className="input"
              type="number"
              value={b.vintage ?? ""}
              onChange={(e) => set("vintage", num(e.target.value))}
            />,
          )}
          {field(
            "Couleur",
            <select
              className="input"
              value={b.color ?? ""}
              onChange={(e) => set("color", e.target.value)}
            >
              <option value="">—</option>
              {WINE_COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>,
          )}
          {field(
            "Cépage(s)",
            <input
              className="input"
              value={b.grapes ?? ""}
              onChange={(e) => set("grapes", e.target.value)}
            />,
          )}
          {field(
            "Pays",
            <input
              className="input"
              value={b.country ?? ""}
              onChange={(e) => set("country", e.target.value)}
            />,
          )}
          {field(
            "Région",
            <input
              className="input"
              value={b.region ?? ""}
              onChange={(e) => set("region", e.target.value)}
            />,
          )}
          {field(
            "Sous-région",
            <input
              className="input"
              value={b.subRegion ?? ""}
              onChange={(e) => set("subRegion", e.target.value)}
            />,
          )}
          {field(
            "Appellation",
            <input
              className="input"
              value={b.appellation ?? ""}
              onChange={(e) => set("appellation", e.target.value)}
            />,
          )}
          {field(
            "Cru / classement",
            <input
              className="input"
              value={b.cuvee ?? ""}
              onChange={(e) => set("cuvee", e.target.value)}
            />,
          )}
          {field(
            "Format",
            <select
              className="input"
              value={b.format ?? ""}
              onChange={(e) => set("format", e.target.value)}
            >
              <option value="">—</option>
              {BOTTLE_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
              {b.format && !BOTTLE_FORMATS.includes(b.format as any) && (
                <option value={b.format}>{b.format}</option>
              )}
            </select>,
          )}
          {field(
            "Quantité (bouteilles)",
            <input
              className="input"
              type="number"
              min={0}
              value={b.quantity}
              onChange={(e) => set("quantity", Number(e.target.value) || 0)}
            />,
          )}
          {field(
            "Cave / unité",
            <select
              className="input"
              value={b.storageUnitId ?? ""}
              onChange={(e) => set("storageUnitId", e.target.value)}
            >
              <option value="">—</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>,
          )}
          {field(
            "Emplacement (casier / étagère)",
            <input
              className="input"
              value={b.location ?? ""}
              onChange={(e) => set("location", e.target.value)}
            />,
          )}
          {field(
            "Occasion",
            <input
              className="input"
              list="occasions-modal"
              value={b.occasion ?? ""}
              onChange={(e) => set("occasion", e.target.value)}
            />,
          )}
          <datalist id="occasions-modal">
            {occasions.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
          {field(
            "À boire à partir de",
            <input
              className="input"
              type="number"
              value={b.drinkFrom ?? ""}
              onChange={(e) => set("drinkFrom", num(e.target.value))}
            />,
          )}
          {field(
            "À boire avant",
            <input
              className="input"
              type="number"
              value={b.drinkTo ?? ""}
              onChange={(e) => set("drinkTo", num(e.target.value))}
            />,
          )}
          {field(
            "Date d'achat",
            <input
              className="input"
              type="date"
              value={b.purchaseDate ?? ""}
              onChange={(e) => set("purchaseDate", e.target.value)}
            />,
          )}
          {field(
            "Prix d'achat (€)",
            <input
              className="input"
              type="number"
              step="0.01"
              value={b.purchasePrice ?? ""}
              onChange={(e) => set("purchasePrice", num(e.target.value))}
            />,
          )}
        </div>

        {field(
          "Notes",
          <textarea
            className="input min-h-[80px]"
            value={b.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
          />,
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Enregistrement…" : editId ? "Enregistrer" : "Ajouter à la cave"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
          </div>
          {editId && (
            <button type="button" className="btn btn-danger" onClick={onDelete}>
              Supprimer
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
