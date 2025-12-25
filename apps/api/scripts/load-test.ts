import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { sign } from "jsonwebtoken";
import { performance } from "perf_hooks";
import { resolve } from "path";

type Endpoint = {
  name: string;
  method: "GET" | "POST";
  path: string;
  requiresAuth: boolean;
  headers?: Record<string, string>;
};

type StatsBucket = {
  total: number;
  ok: number;
  fail: number;
  durations: number[];
};

function projectRoot() {
  return resolve(__dirname, "..");
}

function buildBaseUrl() {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

function parseNumber(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function percentile(values: number[], pct: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[rank];
}

async function runWorker(params: {
  id: number;
  endAt: number;
  endpoints: Endpoint[];
  baseUrl: string;
  authHeaders: Record<string, string>;
  delayMs: number;
  stats: Map<string, StatsBucket>;
  overallDurations: number[];
}) {
  const { id, endAt, endpoints, baseUrl, authHeaders, delayMs, stats, overallDurations } = params;

  while (Date.now() < endAt) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const headers = endpoint.requiresAuth ? { ...authHeaders, ...endpoint.headers } : endpoint.headers ?? {};
    const url = `${baseUrl}${endpoint.path}`;
    const started = performance.now();

    try {
      const res = await fetch(url, { method: endpoint.method, headers });
      await res.arrayBuffer();
      const duration = performance.now() - started;
      const bucket = stats.get(endpoint.name);
      if (bucket) {
        bucket.total += 1;
        if (res.ok) {
          bucket.ok += 1;
          bucket.durations.push(duration);
          overallDurations.push(duration);
        } else {
          bucket.fail += 1;
        }
      }
    } catch (error) {
      const duration = performance.now() - started;
      const bucket = stats.get(endpoint.name);
      if (bucket) {
        bucket.total += 1;
        bucket.fail += 1;
      }
      console.error(`worker-${id} ${endpoint.name} failed: ${String(error)}`);
    }

    if (delayMs > 0) {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
    }
  }
}

async function main() {
  loadEnv({ path: resolve(projectRoot(), ".env") });

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set in apps/api/.env");

  const durationSeconds = parseNumber("DURATION_SECONDS", 15);
  const concurrency = parseNumber("CONCURRENCY", 5);
  const delayMs = parseNumber("REQUEST_DELAY_MS", 0);

  if (concurrency < 1) throw new Error("CONCURRENCY must be at least 1");
  if (durationSeconds < 1) throw new Error("DURATION_SECONDS must be at least 1");

  const prisma = new PrismaClient();

  try {
    const group = await prisma.tenantGroup.findFirst({ orderBy: { createdAt: "asc" } });
    if (!group) throw new Error("No tenant group found. Run `npm --prefix apps/api run prisma:seed`.");

    const subsidiary = await prisma.subsidiary.findFirst({
      where: { groupId: group.id },
      orderBy: { createdAt: "asc" },
    });
    if (!subsidiary) throw new Error("No subsidiary found. Run `npm --prefix apps/api run prisma:seed`.");

    const token = sign({ sub: "00000000-0000-0000-0000-000000000000", permissions: ["*"] }, secret);
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      "x-group-id": group.id,
      "x-subsidiary-id": subsidiary.id,
    };

    const endpoints: Endpoint[] = [
      { name: "health", method: "GET", path: "/v1/health", requiresAuth: false },
      { name: "orders.list", method: "GET", path: "/v1/orders?limit=20", requiresAuth: true },
      { name: "products.list", method: "GET", path: "/v1/products?limit=20", requiresAuth: true },
      { name: "stock-levels.list", method: "GET", path: "/v1/stock-levels?limit=20", requiresAuth: true },
    ];

    const stats = new Map<string, StatsBucket>();
    for (const endpoint of endpoints) {
      stats.set(endpoint.name, { total: 0, ok: 0, fail: 0, durations: [] });
    }

    const overallDurations: number[] = [];
    const baseUrl = buildBaseUrl();
    const endAt = Date.now() + durationSeconds * 1000;

    const workers = Array.from({ length: concurrency }, (_, index) =>
      runWorker({
        id: index + 1,
        endAt,
        endpoints,
        baseUrl,
        authHeaders,
        delayMs,
        stats,
        overallDurations,
      }),
    );

    await Promise.all(workers);

    const totals = Array.from(stats.values()).reduce(
      (acc, bucket) => {
        acc.total += bucket.total;
        acc.ok += bucket.ok;
        acc.fail += bucket.fail;
        return acc;
      },
      { total: 0, ok: 0, fail: 0 },
    );

    console.log("LOAD_TEST_SUMMARY");
    console.log(`duration_seconds=${durationSeconds}`);
    console.log(`concurrency=${concurrency}`);
    console.log(`delay_ms=${delayMs}`);
    console.log(`requests=${totals.total}`);
    console.log(`success=${totals.ok}`);
    console.log(`failures=${totals.fail}`);

    if (overallDurations.length) {
      console.log(`latency_ms_p50=${percentile(overallDurations, 50).toFixed(1)}`);
      console.log(`latency_ms_p95=${percentile(overallDurations, 95).toFixed(1)}`);
      console.log(`latency_ms_p99=${percentile(overallDurations, 99).toFixed(1)}`);
    }

    for (const [name, bucket] of stats) {
      console.log(`endpoint.${name}=${bucket.ok}/${bucket.total} ok`);
    }

    if (totals.fail > 0) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("LOAD_TEST_FAILED", error);
  process.exitCode = 1;
});
