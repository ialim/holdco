import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";

export function parseCsv<T = Record<string, string>>(filePath: string): T[] {
  const raw = readFileSync(filePath, "utf8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}

export function normalize(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

export function parseNumber(value: unknown): number | undefined {
  const raw = normalize(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseIntSafe(value: unknown): number | undefined {
  const parsed = parseNumber(value);
  if (parsed == null) return undefined;
  return Math.trunc(parsed);
}

export function parseDate(value: unknown): Date | undefined {
  const raw = normalize(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseDecimal(value: unknown): string | undefined {
  const raw = normalize(value);
  if (!raw) return undefined;
  return raw;
}
