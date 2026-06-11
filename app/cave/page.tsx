"use client";

import Link from "next/link";
import { useState } from "react";
import { useCellar } from "@/lib/cellarContext";
import CellarTable from "@/components/CellarTable";
import WineFormModal from "@/components/WineFormModal";
import { exportBottles } from "@/lib/excel";
import type { Bottle } from "@/lib/types";

export default function CavePage() {
  const { ready, bottles, units } = useCellar();
  const [editing, setEditing] = useState<Bottle | "new" | null>(null);
  const [visible, setVisible] = useState<Bottle[]>([]);

  if (!ready) return <p className="text-wine-500">Chargement…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-wine-800">Ma cave</h1>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => exportBottles(visible.length ? visible : bottles, units)}
          >
            ⬇️ Exporter
          </button>
          <Link href="/import" className="btn btn-secondary">
            ⬆️ Importer
          </Link>
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            ➕ Ajouter un vin
          </button>
        </div>
      </div>

      <p className="text-sm text-wine-500">
        Cliquez un en-tête pour trier, et utilisez la ligne de filtres sous
        chaque colonne (les nombres acceptent <code>&gt;2015</code>,{" "}
        <code>&lt;2010</code>…). L'export reprend la vue filtrée.
      </p>

      <CellarTable
        bottles={bottles}
        onEdit={(b) => setEditing(b)}
        onVisibleChange={setVisible}
        empty="Aucune bouteille — ajoutez-en une ou importez votre fichier."
      />

      {editing && (
        <WineFormModal
          bottle={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
