"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bottle, HistoryEntry } from "@/lib/types";
import { useCellar } from "@/lib/cellarContext";
import { colorMeta, formatPrice } from "@/lib/format";
import { drinkInfo, STATUS_META } from "@/lib/drinkWindow";
import TastingModal from "./TastingModal";

type FilterType = "text" | "select" | "number" | "none";

interface Col {
  key: string;
  label: string;
  filter: FilterType;
  width: string; // tailwind width class for <col>
  nowrap?: boolean;
  align?: "right";
  value: (b: Bottle) => string | number | null | undefined;
  cell?: (b: Bottle) => React.ReactNode;
}

// Order requested: Pays, Région, Appellation, Producteur, Cuvée, Millésime, …
const COLS: Col[] = [
  { key: "country", label: "Pays", filter: "select", width: "w-[4.5rem]", value: (b) => b.country },
  { key: "region", label: "Région", filter: "select", width: "w-[6rem]", value: (b) => b.region },
  { key: "appellation", label: "Appellation", filter: "text", width: "w-[7rem]", value: (b) => b.appellation },
  { key: "producer", label: "Producteur", filter: "text", width: "w-[7.5rem]", value: (b) => b.producer },
  { key: "name", label: "Cuvée", filter: "text", width: "w-[7.5rem]", value: (b) => b.name },
  { key: "vintage", label: "Mill.", filter: "number", width: "w-[3rem]", nowrap: true, align: "right", value: (b) => b.vintage ?? "" },
  {
    key: "color",
    label: "Robe",
    filter: "select",
    width: "w-[5rem]",
    value: (b) => colorMeta(b.color).label,
    cell: (b) => {
      const cm = colorMeta(b.color);
      return (
        <span className="inline-flex items-center gap-1">
          <span className={`h-2 w-2 shrink-0 rounded-full ${cm.dot}`} />
          {cm.label}
        </span>
      );
    },
  },
  { key: "grapes", label: "Cépages", filter: "text", width: "w-[6rem]", value: (b) => b.grapes },
  { key: "format", label: "Format", filter: "select", width: "w-[4.5rem]", value: (b) => b.format },
  { key: "quantity", label: "Qté", filter: "number", width: "w-[2.6rem]", nowrap: true, align: "right", value: (b) => b.quantity },
  { key: "location", label: "Emplac.", filter: "text", width: "w-[6rem]", value: (b) => b.location },
  { key: "occasion", label: "Occasion", filter: "select", width: "w-[6rem]", value: (b) => b.occasion },
  {
    key: "garde",
    label: "Garde",
    filter: "none",
    width: "w-[4.5rem]",
    nowrap: true,
    value: (b) => b.drinkTo ?? b.drinkFrom ?? "",
    cell: (b) =>
      b.drinkFrom || b.drinkTo ? `${b.drinkFrom ?? "?"}–${b.drinkTo ?? "?"}` : "—",
  },
  {
    key: "statut",
    label: "Statut",
    filter: "select",
    width: "w-[5.5rem]",
    value: (b) => STATUS_META[drinkInfo(b).status].label,
    cell: (b) => {
      const sm = STATUS_META[drinkInfo(b).status];
      return <span className={`chip ${sm.chip} !px-1.5 !py-0`}>{sm.label}</span>;
    },
  },
  {
    key: "price",
    label: "Prix",
    filter: "number",
    width: "w-[4rem]",
    nowrap: true,
    align: "right",
    value: (b) => b.purchasePrice ?? "",
    cell: (b) => (b.purchasePrice != null ? formatPrice(b.purchasePrice) : "—"),
  },
];

function numberMatch(raw: any, f: string): boolean {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  const m = f.trim().match(/^([<>]=?|=)?\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return String(raw ?? "").includes(f);
  const op = m[1] || "=";
  const t = parseFloat(m[2]);
  if (Number.isNaN(n)) return false;
  switch (op) {
    case ">":
      return n > t;
    case ">=":
      return n >= t;
    case "<":
      return n < t;
    case "<=":
      return n <= t;
    default:
      return n === t;
  }
}

function cmp(a: any, b: any): number {
  const an = a == null || a === "";
  const bn = b == null || b === "";
  if (an && bn) return 0;
  if (an) return 1;
  if (bn) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "fr", { numeric: true });
}

export default function CellarTable({
  bottles,
  onEdit,
  showColumnFilters = true,
  onVisibleChange,
  empty,
}: {
  bottles: Bottle[];
  onEdit: (b: Bottle) => void;
  showColumnFilters?: boolean;
  onVisibleChange?: (rows: Bottle[]) => void;
  empty?: React.ReactNode;
}) {
  const { consumeBottle } = useCellar();
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const distincts = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const c of COLS) {
      if (c.filter !== "select") continue;
      const set = new Set<string>();
      for (const b of bottles) {
        const v = c.value(b);
        if (v != null && v !== "") set.add(String(v));
      }
      m[c.key] = [...set].sort((a, b) => a.localeCompare(b, "fr"));
    }
    return m;
  }, [bottles]);

  const rows = useMemo(() => {
    let r = bottles.filter((b) =>
      COLS.every((c) => {
        const f = filters[c.key];
        if (!f) return true;
        const raw = c.value(b);
        if (c.filter === "select") return String(raw ?? "") === f;
        if (c.filter === "number") return numberMatch(raw, f);
        return String(raw ?? "")
          .toLowerCase()
          .includes(f.toLowerCase());
      }),
    );
    if (sortKey) {
      const col = COLS.find((c) => c.key === sortKey);
      if (col) {
        r = [...r].sort(
          (a, b) => cmp(col.value(a), col.value(b)) * (sortDir === "asc" ? 1 : -1),
        );
      }
    }
    return r;
  }, [bottles, filters, sortKey, sortDir]);

  useEffect(() => {
    onVisibleChange?.(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  async function handleConsume(id: string) {
    const e = await consumeBottle(id);
    if (e) setEntry(e);
  }

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const anyFilter = Object.values(filters).some(Boolean) || !!sortKey;

  const ctrl =
    "w-full rounded border border-wine-200 bg-white px-1 py-0.5 text-[11px] outline-none focus:border-wine-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-wine-500">
        <span>{rows.length} réf. affichée(s)</span>
        {anyFilter && (
          <button
            className="btn btn-ghost px-2 py-0.5 text-xs"
            onClick={() => {
              setFilters({});
              setSortKey("");
            }}
          >
            ↺ Réinitialiser
          </button>
        )}
      </div>

      <div className="card max-h-[74vh] overflow-auto">
        <table className="w-full table-fixed border-collapse text-xs">
          <colgroup>
            {COLS.map((c) => (
              <col key={c.key} className={c.width} />
            ))}
            <col className="w-[3.5rem]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-wine-50">
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={`px-1.5 py-1 text-[11px] font-semibold leading-tight text-wine-700 ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <button
                    className="inline-flex items-start gap-0.5 hover:text-wine-900"
                    onClick={() => toggleSort(c.key)}
                  >
                    <span className="break-words">{c.label}</span>
                    {sortKey === c.key && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
                  </button>
                </th>
              ))}
              <th className="px-1 py-1 text-right text-[11px] font-semibold text-wine-700">
                ⋯
              </th>
            </tr>
            {showColumnFilters && (
              <tr className="bg-white">
                {COLS.map((c) => (
                  <th key={c.key} className="px-1 py-1 align-top">
                    {c.filter === "select" ? (
                      <select
                        className={ctrl}
                        value={filters[c.key] ?? ""}
                        onChange={(e) =>
                          setFilters((f) => ({ ...f, [c.key]: e.target.value }))
                        }
                      >
                        <option value="">Tous</option>
                        {(distincts[c.key] ?? []).map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    ) : c.filter === "none" ? null : (
                      <input
                        className={ctrl}
                        placeholder={c.filter === "number" ? ">2015" : "…"}
                        value={filters[c.key] ?? ""}
                        onChange={(e) =>
                          setFilters((f) => ({ ...f, [c.key]: e.target.value }))
                        }
                      />
                    )}
                  </th>
                ))}
                <th />
              </tr>
            )}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLS.length + 1} className="p-6 text-center text-wine-400">
                  {empty ?? "Aucune bouteille."}
                </td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id} className="border-t border-wine-50 hover:bg-wine-50/60">
                  {COLS.map((c) => (
                    <td
                      key={c.key}
                      className={`px-1.5 py-1 align-top leading-tight ${
                        c.align === "right" ? "text-right" : ""
                      } ${c.nowrap ? "whitespace-nowrap" : "break-words"}`}
                    >
                      {c.cell ? c.cell(b) : (c.value(b) ?? "—") || "—"}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-1 py-1 text-right align-top">
                    <button
                      onClick={() => handleConsume(b.id)}
                      className="rounded px-1 py-0.5 hover:bg-wine-100"
                      title="J'en bois une"
                    >
                      🍷
                    </button>
                    <button
                      onClick={() => onEdit(b)}
                      className="rounded px-1 py-0.5 hover:bg-wine-100"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {entry && <TastingModal entry={entry} onClose={() => setEntry(null)} />}
    </div>
  );
}
