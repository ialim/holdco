import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { sign } from "jsonwebtoken";
import { resolve } from "path";

function projectRoot() {
  return resolve(__dirname, "..");
}

function buildBaseUrl() {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

async function hit(name: string, url: string, options: RequestInit, expectedStatus?: number) {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (error) {
    throw new Error(`Request failed for ${name}. Is the API running? ${String(error)}`);
  }

  const text = await res.text();
  console.log(`${name}: ${res.status}`);
  if (res.status >= 400) {
    console.log(`${name}.body: ${text}`);
  }

  if (expectedStatus !== undefined && res.status !== expectedStatus) {
    throw new Error(`${name} expected ${expectedStatus} but got ${res.status}`);
  }

  return res;
}

async function main() {
  loadEnv({ path: resolve(projectRoot(), ".env") });

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set in apps/api/.env");

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
    const authHeader = { Authorization: `Bearer ${token}` };
    const baseUrl = buildBaseUrl();

    await hit("health.open", `${baseUrl}/v1/health`, {}, 200);

    await hit(
      "orders.list.forbidden",
      `${baseUrl}/v1/orders?limit=1`,
      { headers: { "x-group-id": group.id, "x-subsidiary-id": subsidiary.id } },
      403,
    );

    await hit(
      "orders.list.allowed",
      `${baseUrl}/v1/orders?limit=1`,
      {
        headers: { ...authHeader, "x-group-id": group.id, "x-subsidiary-id": subsidiary.id },
      },
      200,
    );

    const metricsToken = process.env.METRICS_TOKEN;
    if (metricsToken) {
      await hit("metrics.unauthorized", `${baseUrl}/v1/metrics`, {}, 401);
      await hit(
        "metrics.authorized",
        `${baseUrl}/v1/metrics`,
        { headers: { "x-metrics-token": metricsToken } },
        200,
      );
    } else {
      await hit("metrics.open", `${baseUrl}/v1/metrics`, {}, 200);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("SECURITY_SMOKE_FAILED", error);
  process.exitCode = 1;
});
