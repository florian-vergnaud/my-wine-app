import type { Bottle, WineColor } from "./types";

export const COLOR_META: Record<
  string,
  { label: string; dot: string; chip: string }
> = {
  rouge: { label: "Rouge", dot: "bg-wine-700", chip: "bg-wine-100 text-wine-800" },
  blanc: { label: "Blanc", dot: "bg-amber-300", chip: "bg-amber-100 text-amber-800" },
  rosé: { label: "Rosé", dot: "bg-pink-400", chip: "bg-pink-100 text-pink-800" },
  effervescent: {
    label: "Effervescent",
    dot: "bg-yellow-200",
    chip: "bg-yellow-100 text-yellow-800",
  },
  orange: { label: "Orange", dot: "bg-orange-400", chip: "bg-orange-100 text-orange-800" },
  doux: { label: "Doux / muté", dot: "bg-amber-600", chip: "bg-amber-100 text-amber-900" },
};

export function colorMeta(color?: string) {
  return (
    (color && COLOR_META[color]) || {
      label: color || "—",
      dot: "bg-gray-300",
      chip: "bg-gray-100 text-gray-700",
    }
  );
}

export function bottleTitle(b: Pick<Bottle, "name" | "producer" | "vintage">): string {
  const parts: string[] = [];
  if (b.producer) parts.push(b.producer);
  if (b.name && b.name !== b.producer) parts.push(b.name);
  let title = parts.join(" — ") || b.name || "Vin sans nom";
  if (b.vintage) title += ` ${b.vintage}`;
  return title;
}

export function formatPrice(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function stars(rating?: number | null): string {
  if (!rating) return "—";
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
