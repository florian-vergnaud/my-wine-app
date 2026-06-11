import type { Bottle, HistoryEntry, StorageUnit } from "../types";
import { SUPABASE_ENABLED } from "../config";
import { LocalStore } from "./local";
import { SupabaseStore } from "./supabase";

/**
 * Persistence abstraction. Two implementations:
 *  - LocalStore   : browser localStorage (demo mode, no setup needed).
 *  - SupabaseStore : Postgres + Storage (production, multi-device, secure).
 * The rest of the app never imports a concrete store directly.
 */
export interface Store {
  readonly mode: "demo" | "supabase";
  listBottles(): Promise<Bottle[]>;
  upsertBottle(bottle: Bottle): Promise<Bottle>;
  deleteBottle(id: string): Promise<void>;

  listUnits(): Promise<StorageUnit[]>;
  upsertUnit(unit: StorageUnit): Promise<StorageUnit>;
  deleteUnit(id: string): Promise<void>;

  listHistory(): Promise<HistoryEntry[]>;
  upsertHistory(entry: HistoryEntry): Promise<HistoryEntry>;
  deleteHistory(id: string): Promise<void>;

  /** Stores an image (data URL) and returns a URL to display it. */
  uploadPhoto(dataUrl: string, key: string): Promise<string>;
}

export function createStore(): Store {
  return SUPABASE_ENABLED ? new SupabaseStore() : new LocalStore();
}

export type { Bottle, HistoryEntry, StorageUnit };
