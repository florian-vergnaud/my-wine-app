import type { Store } from "./index";
import type { Bottle, HistoryEntry, StorageUnit } from "../types";
import { getSupabase } from "../supabaseClient";

// --- column mapping (camelCase <-> snake_case) ----------------------------

function bottleToRow(b: Bottle, userId: string) {
  return {
    id: b.id,
    user_id: userId,
    name: b.name,
    producer: b.producer ?? null,
    winemaker: b.winemaker ?? null,
    vintage: b.vintage ?? null,
    color: b.color ?? null,
    country: b.country ?? null,
    region: b.region ?? null,
    sub_region: b.subRegion ?? null,
    appellation: b.appellation ?? null,
    grapes: b.grapes ?? null,
    cuvee: b.cuvee ?? null,
    quantity: b.quantity ?? 0,
    format: b.format ?? null,
    purchase_date: b.purchaseDate || null,
    purchase_price: b.purchasePrice ?? null,
    storage_unit_id: b.storageUnitId || null,
    location: b.location ?? null,
    drink_from: b.drinkFrom ?? null,
    drink_to: b.drinkTo ?? null,
    occasion: b.occasion ?? null,
    rating: b.rating ?? null,
    rating_scale: b.ratingScale ?? null,
    rating_count: b.ratingCount ?? null,
    rating_source: b.ratingSource ?? null,
    notes: b.notes ?? null,
    photo_url: b.photoUrl ?? null,
    created_at: b.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function rowToBottle(r: any): Bottle {
  return {
    id: r.id,
    name: r.name ?? "",
    producer: r.producer ?? undefined,
    winemaker: r.winemaker ?? undefined,
    vintage: r.vintage ?? null,
    color: r.color ?? undefined,
    country: r.country ?? undefined,
    region: r.region ?? undefined,
    subRegion: r.sub_region ?? undefined,
    appellation: r.appellation ?? undefined,
    grapes: r.grapes ?? undefined,
    cuvee: r.cuvee ?? undefined,
    quantity: r.quantity ?? 0,
    format: r.format ?? undefined,
    purchaseDate: r.purchase_date ?? undefined,
    purchasePrice: r.purchase_price ?? null,
    storageUnitId: r.storage_unit_id ?? undefined,
    location: r.location ?? undefined,
    drinkFrom: r.drink_from ?? null,
    drinkTo: r.drink_to ?? null,
    occasion: r.occasion ?? undefined,
    rating: r.rating ?? null,
    ratingScale: r.rating_scale ?? undefined,
    ratingCount: r.rating_count ?? null,
    ratingSource: r.rating_source ?? undefined,
    notes: r.notes ?? undefined,
    photoUrl: r.photo_url ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function historyToRow(h: HistoryEntry, userId: string) {
  return {
    id: h.id,
    user_id: userId,
    bottle_id: h.bottleId || null,
    name: h.name,
    producer: h.producer ?? null,
    vintage: h.vintage ?? null,
    color: h.color ?? null,
    country: h.country ?? null,
    region: h.region ?? null,
    appellation: h.appellation ?? null,
    grapes: h.grapes ?? null,
    date: h.date,
    rating: h.rating ?? null,
    notes: h.notes ?? null,
    meal: h.meal ?? null,
    photo_url: h.photoUrl ?? null,
    created_at: h.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function rowToHistory(r: any): HistoryEntry {
  return {
    id: r.id,
    bottleId: r.bottle_id ?? undefined,
    name: r.name ?? "",
    producer: r.producer ?? undefined,
    vintage: r.vintage ?? null,
    color: r.color ?? undefined,
    country: r.country ?? undefined,
    region: r.region ?? undefined,
    appellation: r.appellation ?? undefined,
    grapes: r.grapes ?? undefined,
    date: r.date,
    rating: r.rating ?? null,
    notes: r.notes ?? undefined,
    meal: r.meal ?? undefined,
    photoUrl: r.photo_url ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// --------------------------------------------------------------------------

export class SupabaseStore implements Store {
  readonly mode = "supabase" as const;

  private client() {
    const c = getSupabase();
    if (!c) throw new Error("Supabase non configuré");
    return c;
  }

  private async userId(): Promise<string> {
    const {
      data: { user },
    } = await this.client().auth.getUser();
    if (!user) throw new Error("Non authentifié");
    return user.id;
  }

  async listBottles(): Promise<Bottle[]> {
    const { data, error } = await this.client()
      .from("bottles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToBottle);
  }

  async upsertBottle(bottle: Bottle): Promise<Bottle> {
    const uid = await this.userId();
    const { data, error } = await this.client()
      .from("bottles")
      .upsert(bottleToRow(bottle, uid))
      .select()
      .single();
    if (error) throw error;
    return rowToBottle(data);
  }

  async deleteBottle(id: string): Promise<void> {
    const { error } = await this.client().from("bottles").delete().eq("id", id);
    if (error) throw error;
  }

  async listUnits(): Promise<StorageUnit[]> {
    const { data, error } = await this.client()
      .from("storage_units")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? undefined,
      createdAt: r.created_at,
    }));
  }

  async upsertUnit(unit: StorageUnit): Promise<StorageUnit> {
    const uid = await this.userId();
    const { data, error } = await this.client()
      .from("storage_units")
      .upsert({
        id: unit.id,
        user_id: uid,
        name: unit.name,
        description: unit.description ?? null,
        created_at: unit.createdAt,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      description: data.description ?? undefined,
      createdAt: data.created_at,
    };
  }

  async deleteUnit(id: string): Promise<void> {
    const { error } = await this.client()
      .from("storage_units")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  async listHistory(): Promise<HistoryEntry[]> {
    const { data, error } = await this.client()
      .from("history")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToHistory);
  }

  async upsertHistory(entry: HistoryEntry): Promise<HistoryEntry> {
    const uid = await this.userId();
    const { data, error } = await this.client()
      .from("history")
      .upsert(historyToRow(entry, uid))
      .select()
      .single();
    if (error) throw error;
    return rowToHistory(data);
  }

  async deleteHistory(id: string): Promise<void> {
    const { error } = await this.client().from("history").delete().eq("id", id);
    if (error) throw error;
  }

  async uploadPhoto(dataUrl: string, key: string): Promise<string> {
    const uid = await this.userId();
    const match = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl);
    if (!match) return dataUrl;
    const [, mime, b64] = match;
    const ext = mime.split("/")[1] || "jpg";
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${uid}/${key}.${ext}`;
    const { error } = await this.client()
      .storage.from("photos")
      .upload(path, bytes, { contentType: mime, upsert: true });
    if (error) throw error;
    const { data } = this.client().storage.from("photos").getPublicUrl(path);
    return data.publicUrl;
  }
}
