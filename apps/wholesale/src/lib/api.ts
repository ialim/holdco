import { getAuthTokens } from "./auth-storage";
import { readTenantContext } from "../providers/tenant-context";

export type ApiResponse<T> = {
  ok: boolean;
  status: number;
  data: T;
};

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/v1";
}

export function buildHeaders(extra?: Record<string, string>) {
  const tenant = readTenantContext();
  const tokens = getAuthTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(tenant.groupId ? { "X-Group-Id": tenant.groupId } : {}),
    ...(tenant.subsidiaryId ? { "X-Subsidiary-Id": tenant.subsidiaryId } : {}),
    ...(tenant.locationId ? { "X-Location-Id": tenant.locationId } : {}),
    "X-Channel": tenant.channel || "admin_ops",
    ...(tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
    ...(extra || {})
  };
  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
): Promise<ApiResponse<T>> {
  const method = options.method || "GET";
  const headers = buildHeaders(options.headers);
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);
  return { ok: response.ok, status: response.status, data };
}
