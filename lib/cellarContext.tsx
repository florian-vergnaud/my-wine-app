"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createStore, type Store } from "./store";
import type { Bottle, HistoryEntry, SeedBottle, StorageUnit } from "./types";
import { todayISO } from "./format";

interface CellarContextValue {
  ready: boolean;
  mode: "demo" | "supabase";
  bottles: Bottle[];
  units: StorageUnit[];
  history: HistoryEntry[];
  error: string | null;
  refresh: () => Promise<void>;
  saveBottle: (b: Bottle) => Promise<void>;
  removeBottle: (id: string) => Promise<void>;
  bulkAddBottles: (list: Bottle[]) => Promise<void>;
  addUnit: (name: string, description?: string) => Promise<StorageUnit>;
  removeUnit: (id: string) => Promise<void>;
  /** Decrement a lot by one, log to history, return the created entry. */
  consumeBottle: (id: string, date?: string) => Promise<HistoryEntry | null>;
  saveHistory: (h: HistoryEntry) => Promise<void>;
  removeHistory: (id: string) => Promise<void>;
  uploadPhoto: (dataUrl: string, key: string) => Promise<string>;
  /** Prior tasting notes for a wine identified by name/producer/vintage. */
  priorTastings: (w: {
    name?: string;
    producer?: string;
    vintage?: number | null;
  }) => HistoryEntry[];
}

const CellarContext = createContext<CellarContextValue | null>(null);

// The demo re-seeds whenever the cellar file's content changes (hash differs
// from the last one loaded) — no manual version bumps needed.
const SEED_HASH_KEY = "mcv.seedHash";

function nowISO() {
  return new Date().toISOString();
}

function hashStr(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * Loads the owner's cellar from a gitignored file served at /cellar.local.json
 * (kept out of the repo for privacy). Returns null when absent (e.g. production,
 * where data lives in Supabase). IDs are deterministic so re-seeding upserts
 * the same rows instead of duplicating them.
 */
async function fetchSeed(): Promise<{ seeds: Bottle[]; hash: string } | null> {
  try {
    const res = await fetch("/cellar.local.json", { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    const raw = JSON.parse(text) as SeedBottle[];
    const y = nowISO();
    const seeds = raw.map((s, i) => ({
      ...s,
      id: `seed-${i}`,
      createdAt: y,
      updatedAt: y,
    }));
    return { seeds, hash: hashStr(text) };
  } catch {
    return null;
  }
}

export function CellarProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<Store | null>(null);
  if (!storeRef.current) storeRef.current = createStore();
  const store = storeRef.current;
  const didInit = useRef(false);

  const [ready, setReady] = useState(false);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [units, setUnits] = useState<StorageUnit[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [b, u, h] = await Promise.all([
        store.listBottles(),
        store.listUnits(),
        store.listHistory(),
      ]);
      setBottles(b);
      setUnits(u);
      setHistory(h);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Erreur de chargement");
    }
  }, [store]);

  // Initial load (+ demo seed). Guarded so it runs once even under
  // React Strict Mode's double-invocation in development.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    (async () => {
      try {
        if (store.mode === "demo" && typeof window !== "undefined") {
          const data = await fetchSeed();
          if (data && data.seeds.length > 0) {
            const stored = window.localStorage.getItem(SEED_HASH_KEY);
            if (stored !== data.hash) {
              // Cellar file changed: replace the seeded rows (ids "seed-*"),
              // leaving any bottles the user added manually untouched.
              const existing = await store.listBottles();
              for (const old of existing)
                if (old.id.startsWith("seed-")) await store.deleteBottle(old.id);
              for (const seed of data.seeds) await store.upsertBottle(seed);
              window.localStorage.setItem(SEED_HASH_KEY, data.hash);
            }
          }
        }
      } catch {
        /* ignore seed errors */
      }
      await refresh();
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveBottle = useCallback(
    async (b: Bottle) => {
      await store.upsertBottle(b);
      await refresh();
    },
    [store, refresh],
  );

  const removeBottle = useCallback(
    async (id: string) => {
      await store.deleteBottle(id);
      await refresh();
    },
    [store, refresh],
  );

  const bulkAddBottles = useCallback(
    async (list: Bottle[]) => {
      for (const b of list) await store.upsertBottle(b);
      await refresh();
    },
    [store, refresh],
  );

  const addUnit = useCallback(
    async (name: string, description?: string) => {
      const unit: StorageUnit = {
        id: crypto.randomUUID(),
        name,
        description,
        createdAt: nowISO(),
      };
      const saved = await store.upsertUnit(unit);
      await refresh();
      return saved;
    },
    [store, refresh],
  );

  const removeUnit = useCallback(
    async (id: string) => {
      await store.deleteUnit(id);
      await refresh();
    },
    [store, refresh],
  );

  const consumeBottle = useCallback(
    async (id: string, date?: string) => {
      const b = bottles.find((x) => x.id === id);
      if (!b) return null;
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        bottleId: b.id,
        name: b.name,
        producer: b.producer,
        vintage: b.vintage ?? null,
        color: b.color,
        country: b.country,
        region: b.region,
        appellation: b.appellation,
        grapes: b.grapes,
        date: date || todayISO(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      await store.upsertHistory(entry);
      const remaining = (b.quantity || 1) - 1;
      if (remaining <= 0) await store.deleteBottle(b.id);
      else await store.upsertBottle({ ...b, quantity: remaining });
      await refresh();
      return entry;
    },
    [bottles, store, refresh],
  );

  const saveHistory = useCallback(
    async (h: HistoryEntry) => {
      await store.upsertHistory(h);
      await refresh();
    },
    [store, refresh],
  );

  const removeHistory = useCallback(
    async (id: string) => {
      await store.deleteHistory(id);
      await refresh();
    },
    [store, refresh],
  );

  const uploadPhoto = useCallback(
    (dataUrl: string, key: string) => store.uploadPhoto(dataUrl, key),
    [store],
  );

  const priorTastings = useCallback(
    (w: { name?: string; producer?: string; vintage?: number | null }) => {
      const norm = (s?: string) => (s ?? "").trim().toLowerCase();
      return history
        .filter(
          (h) =>
            norm(h.name) === norm(w.name) &&
            norm(h.producer) === norm(w.producer),
        )
        .filter((h) => h.rating != null || (h.notes && h.notes.trim()))
        .sort((a, b) => (a.date < b.date ? 1 : -1));
    },
    [history],
  );

  const value = useMemo<CellarContextValue>(
    () => ({
      ready,
      mode: store.mode,
      bottles,
      units,
      history,
      error,
      refresh,
      saveBottle,
      removeBottle,
      bulkAddBottles,
      addUnit,
      removeUnit,
      consumeBottle,
      saveHistory,
      removeHistory,
      uploadPhoto,
      priorTastings,
    }),
    [
      ready,
      store.mode,
      bottles,
      units,
      history,
      error,
      refresh,
      saveBottle,
      removeBottle,
      bulkAddBottles,
      addUnit,
      removeUnit,
      consumeBottle,
      saveHistory,
      removeHistory,
      uploadPhoto,
      priorTastings,
    ],
  );

  return (
    <CellarContext.Provider value={value}>{children}</CellarContext.Provider>
  );
}

export function useCellar(): CellarContextValue {
  const ctx = useContext(CellarContext);
  if (!ctx) throw new Error("useCellar doit être utilisé dans <CellarProvider>");
  return ctx;
}
