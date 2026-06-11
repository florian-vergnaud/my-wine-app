"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCellar } from "@/lib/cellarContext";
import { downloadTemplate, parseFile, type ImportRow } from "@/lib/excel";
import { emptyBottle, type Bottle } from "@/lib/types";

export default function ImportPage() {
  const router = useRouter();
  const { bulkAddBottles } = useCellar();
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const parsed = await parseFile(file);
    setRows(parsed);
  }

  const valid = rows?.filter((r) => r.errors.length === 0) ?? [];
  const invalid = rows?.filter((r) => r.errors.length > 0) ?? [];

  async function commit() {
    if (!valid.length) return;
    setImporting(true);
    try {
      const bottles: Bottle[] = valid.map((r) => {
        const { storageUnitName, ...data } = r.data;
        const base = emptyBottle();
        return {
          ...base,
          ...data,
          name: data.name || data.producer || "Vin",
          quantity: data.quantity ?? 1,
          location: data.location || storageUnitName || base.location,
        };
      });
      await bulkAddBottles(bottles);
      router.push("/cave");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-wine-800">
          ⬆️ Importer depuis Excel / CSV
        </h1>
        <p className="text-sm text-wine-500">
          Chargez un fichier .xlsx ou .csv. Les colonnes sont reconnues
          automatiquement (français ou anglais). Vérifiez l'aperçu avant
          d'importer.
        </p>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="text-sm" />
        <button
          className="btn btn-secondary"
          onClick={() => downloadTemplate("xlsx")}
        >
          ⬇️ Télécharger le modèle
        </button>
      </div>

      {rows && (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="chip bg-green-100 text-green-700">
              {valid.length} ligne(s) valides
            </span>
            {invalid.length > 0 && (
              <span className="chip bg-red-100 text-red-700">
                {invalid.length} à corriger (ignorées)
              </span>
            )}
            <span className="chip bg-wine-100 text-wine-700">{fileName}</span>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-wine-50 text-xs uppercase text-wine-600">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Nom</th>
                  <th className="p-2">Producteur</th>
                  <th className="p-2">Mill.</th>
                  <th className="p-2">Couleur</th>
                  <th className="p-2">Appellation</th>
                  <th className="p-2">Qté</th>
                  <th className="p-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((r) => (
                  <tr
                    key={r.index}
                    className={`border-t border-wine-50 ${
                      r.errors.length ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="p-2 text-wine-400">{r.index}</td>
                    <td className="p-2">{r.data.name ?? "—"}</td>
                    <td className="p-2">{r.data.producer ?? "—"}</td>
                    <td className="p-2">{r.data.vintage ?? "—"}</td>
                    <td className="p-2">{r.data.color ?? "—"}</td>
                    <td className="p-2">{r.data.appellation ?? "—"}</td>
                    <td className="p-2">{r.data.quantity ?? 1}</td>
                    <td className="p-2 text-xs">
                      {r.errors.length > 0 ? (
                        <span className="text-red-600">{r.errors.join(", ")}</span>
                      ) : r.warnings.length > 0 ? (
                        <span className="text-amber-600">
                          {r.warnings.join(", ")}
                        </span>
                      ) : (
                        <span className="text-green-600">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 200 && (
              <p className="p-2 text-xs text-wine-400">
                Aperçu limité à 200 lignes ({rows.length} au total) — toutes
                seront importées.
              </p>
            )}
          </div>

          <button
            className="btn btn-primary"
            disabled={importing || valid.length === 0}
            onClick={commit}
          >
            {importing
              ? "Import en cours…"
              : `Importer ${valid.length} vin(s) dans la cave`}
          </button>
        </>
      )}
    </div>
  );
}
