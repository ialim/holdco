import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";

export type StoreLocationMap = Map<string, { locationId: string; subsidiaryId?: string }>;

export function loadStoreLocationMap(path: string): StoreLocationMap {
  const raw = readFileSync(path, "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as Array<{
    store_id: string;
    location_id: string;
    subsidiary_id?: string;
  }>;

  const map: StoreLocationMap = new Map();
  for (const row of rows) {
    if (!row.store_id || !row.location_id) continue;
    map.set(String(row.store_id).trim(), {
      locationId: String(row.location_id).trim(),
      subsidiaryId: row.subsidiary_id ? String(row.subsidiary_id).trim() : undefined,
    });
  }
  return map;
}
