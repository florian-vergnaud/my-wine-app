import type { Store } from "./index";
import type { Bottle, HistoryEntry, StorageUnit } from "../types";

const KEYS = {
  bottles: "mcv.bottles",
  units: "mcv.units",
  history: "mcv.history",
};

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

/** Demo-mode store: everything lives in the browser. No account needed. */
export class LocalStore implements Store {
  readonly mode = "demo" as const;

  async listBottles(): Promise<Bottle[]> {
    return read<Bottle>(KEYS.bottles);
  }

  async upsertBottle(bottle: Bottle): Promise<Bottle> {
    const all = read<Bottle>(KEYS.bottles);
    const idx = all.findIndex((b) => b.id === bottle.id);
    const next = { ...bottle, updatedAt: new Date().toISOString() };
    if (idx >= 0) all[idx] = next;
    else all.unshift(next);
    write(KEYS.bottles, all);
    return next;
  }

  async deleteBottle(id: string): Promise<void> {
    write(
      KEYS.bottles,
      read<Bottle>(KEYS.bottles).filter((b) => b.id !== id),
    );
  }

  async listUnits(): Promise<StorageUnit[]> {
    return read<StorageUnit>(KEYS.units);
  }

  async upsertUnit(unit: StorageUnit): Promise<StorageUnit> {
    const all = read<StorageUnit>(KEYS.units);
    const idx = all.findIndex((u) => u.id === unit.id);
    if (idx >= 0) all[idx] = unit;
    else all.push(unit);
    write(KEYS.units, all);
    return unit;
  }

  async deleteUnit(id: string): Promise<void> {
    write(
      KEYS.units,
      read<StorageUnit>(KEYS.units).filter((u) => u.id !== id),
    );
  }

  async listHistory(): Promise<HistoryEntry[]> {
    return read<HistoryEntry>(KEYS.history);
  }

  async upsertHistory(entry: HistoryEntry): Promise<HistoryEntry> {
    const all = read<HistoryEntry>(KEYS.history);
    const idx = all.findIndex((h) => h.id === entry.id);
    const next = { ...entry, updatedAt: new Date().toISOString() };
    if (idx >= 0) all[idx] = next;
    else all.unshift(next);
    write(KEYS.history, all);
    return next;
  }

  async deleteHistory(id: string): Promise<void> {
    write(
      KEYS.history,
      read<HistoryEntry>(KEYS.history).filter((h) => h.id !== id),
    );
  }

  async uploadPhoto(dataUrl: string): Promise<string> {
    // In demo mode we simply keep the data URL inline.
    return dataUrl;
  }
}
