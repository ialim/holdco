import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";
import { sign } from "jsonwebtoken";

type ArgMap = Record<string, string | undefined>;

function projectRoot() {
  return resolve(__dirname, "..", "..");
}

function parseArgs(argv: string[]) {
  return argv.reduce<ArgMap>((acc, value, index) => {
    if (value.startsWith("--")) {
      acc[value.slice(2)] = argv[index + 1];
    }
    return acc;
  }, {});
}

function readConfig(path: string) {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8");
  return raw ? JSON.parse(raw) : {};
}

function normalizeBaseUrl(base: string) {
  const trimmed = base.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

async function requestJson(name: string, url: string, options: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (error) {
    throw new Error(`Request failed for ${name}. Is the API running? ${String(error)}`);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${name} failed (${res.status}): ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  loadEnv({ path: resolve(projectRoot(), ".env") });

  const args = parseArgs(process.argv.slice(2));
  const configPath = args["config"] ?? resolve(projectRoot(), "..", "pos", "config.json");
  const posConfig = readConfig(configPath);

  const baseUrl = normalizeBaseUrl(
    args["api-base-url"] ?? process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`,
  );

  const groupId = args["group-id"] ?? process.env.GROUP_ID ?? posConfig.groupId;
  const subsidiaryId = args["subsidiary-id"] ?? process.env.SUBSIDIARY_ID ?? posConfig.subsidiaryId;
  const locationId = args["location-id"] ?? process.env.LOCATION_ID ?? posConfig.locationId;
  const deviceId = args["device-id"] ?? process.env.DEVICE_ID ?? posConfig.deviceId;
  const deviceName = args["device-name"] ?? process.env.DEVICE_NAME ?? `Retail POS ${deviceId ?? ""}`.trim();
  const status = (args["status"] ?? process.env.DEVICE_STATUS ?? "active").toLowerCase();
  const channel = (args["channel"] ?? process.env.POS_ADMIN_CHANNEL ?? "admin_ops").toLowerCase();

  if (!groupId || !subsidiaryId || !locationId || !deviceId) {
    throw new Error("Missing required params: groupId, subsidiaryId, locationId, deviceId.");
  }

  const adminToken = process.env.ADMIN_TOKEN;
  const secret = process.env.JWT_SECRET;
  if (!adminToken && !secret) {
    throw new Error("Set ADMIN_TOKEN or JWT_SECRET in apps/api/.env");
  }

  const token =
    adminToken ??
    sign({ sub: "admin-ops-script", permissions: ["pos.devices.manage", "pos.devices.read"] }, secret!, { expiresIn: "15m" });

  const headers = {
    Authorization: `Bearer ${token}`,
    "X-Group-Id": groupId,
    "X-Subsidiary-Id": subsidiaryId,
    "X-Channel": channel,
    "Content-Type": "application/json",
  };

  const payload = {
    device_id: deviceId,
    location_id: locationId,
    name: deviceName || undefined,
    status,
  };

  const response = await requestJson("pos.devices.upsert", `${baseUrl}/pos/devices`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  console.log(JSON.stringify(response, null, 2));
}

main().catch((error) => {
  console.error("PROVISION_POS_DEVICE_FAILED", error);
  process.exitCode = 1;
});
