import type { Bottle } from "./types";

export type DrinkStatus =
  | "too-young" // avant la fenêtre
  | "drink-soon" // dans la fenêtre, vers la fin / proche
  | "in-window" // au cœur de la fenêtre
  | "past" // au-delà de la fenêtre
  | "unknown"; // pas de fenêtre renseignée

const CURRENT_YEAR = new Date().getFullYear();

export interface DrinkInfo {
  status: DrinkStatus;
  label: string;
  /** sorting priority: lower = more urgent to drink */
  priority: number;
}

/**
 * Computes a drink-window status for a lot. "drink-soon" covers anything that
 * is inside its window OR within two years of entering it / past the start,
 * so the cellar can surface bottles to enjoy.
 */
export function drinkInfo(b: Bottle, year = CURRENT_YEAR): DrinkInfo {
  const from = b.drinkFrom ?? null;
  const to = b.drinkTo ?? null;

  if (from == null && to == null) {
    return { status: "unknown", label: "Fenêtre inconnue", priority: 5 };
  }
  if (to != null && year > to) {
    return { status: "past", label: `À boire d'urgence (apogée < ${to})`, priority: 0 };
  }
  if (from != null && year < from) {
    const yearsLeft = from - year;
    return {
      status: "too-young",
      label: `À attendre (dès ${from})`,
      priority: 6 + yearsLeft,
    };
  }
  // Inside the window.
  if (to != null) {
    const yearsLeft = to - year;
    if (yearsLeft <= 2) {
      return {
        status: "drink-soon",
        label: `À boire bientôt (avant ${to})`,
        priority: 1,
      };
    }
    return { status: "in-window", label: `Dans la fenêtre (→ ${to})`, priority: 3 };
  }
  return { status: "in-window", label: `Prêt à boire`, priority: 2 };
}

export const STATUS_META: Record<DrinkStatus, { chip: string; label: string }> = {
  past: { chip: "bg-red-100 text-red-700", label: "Apogée dépassée" },
  "drink-soon": { chip: "bg-orange-100 text-orange-700", label: "À boire bientôt" },
  "in-window": { chip: "bg-green-100 text-green-700", label: "Dans la fenêtre" },
  "too-young": { chip: "bg-blue-100 text-blue-700", label: "À attendre" },
  unknown: { chip: "bg-gray-100 text-gray-600", label: "Fenêtre inconnue" },
};

/** Bottles approaching or inside their optimal window, most urgent first. */
export function drinkSoonList(bottles: Bottle[]): Bottle[] {
  return bottles
    .filter((b) => b.quantity > 0)
    .map((b) => ({ b, info: drinkInfo(b) }))
    .filter(({ info }) =>
      ["past", "drink-soon", "in-window"].includes(info.status),
    )
    .sort((a, x) => a.info.priority - x.info.priority)
    .map(({ b }) => b);
}
