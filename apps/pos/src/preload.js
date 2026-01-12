const { contextBridge } = require("electron");
const path = require("node:path");
const crypto = require("node:crypto");

const api = {};
const warnings = [];
let preloadError = null;

try {
  const config = require(path.join(__dirname, "config"));
  api.getConfig = config.loadConfig;
  api.saveConfig = config.saveConfig;
} catch (error) {
  preloadError = error;
}

try {
  const client = require(path.join(__dirname, "api", "client"));
  api.request = client.request;
} catch (error) {
  preloadError = preloadError ?? error;
}

try {
  const idempotency = require(path.join(__dirname, "offline", "idempotency"));
  api.buildIdempotencyKey = idempotency.buildIdempotencyKey;
} catch (error) {
  warnings.push(`idempotency unavailable: ${error.message || error}`);
  api.buildIdempotencyKey = (scope, payload) =>
    `${scope}:${crypto.createHash("sha1").update(JSON.stringify(payload ?? {})).digest("hex")}`;
}

try {
  const queue = require(path.join(__dirname, "offline", "queue"));
  api.enqueueOperation = queue.enqueueOperation;
  api.flushQueue = queue.flushQueue;
  api.readQueue = queue.readQueue;
  api.getQueueMeta = queue.getQueueMeta;
} catch (error) {
  warnings.push(`offline queue disabled: ${error.message || error}`);
  api.enqueueOperation = () => ({ id: `noop_${Date.now()}` });
  api.flushQueue = async () => ({ processed: 0, remaining: 0 });
  api.readQueue = () => [];
  api.getQueueMeta = () => null;
}

try {
  const cache = require(path.join(__dirname, "offline", "cache"));
  api.cacheGet = cache.getCache;
  api.cacheSet = cache.setCache;
  api.cacheDelete = cache.deleteCache;
} catch (error) {
  warnings.push(`offline cache disabled: ${error.message || error}`);
  api.cacheGet = () => null;
  api.cacheSet = () => null;
  api.cacheDelete = () => null;
}

try {
  const printer = require(path.join(__dirname, "peripherals", "receipt-printer"));
  api.printReceipt = printer.printReceipt;
  api.testPrinter = printer.testPrinter;
} catch (error) {
  warnings.push(`printer disabled: ${error.message || error}`);
  api.printReceipt = async () => ({ ok: false, error: "Printer not available" });
  api.testPrinter = async () => ({ ok: false, error: "Printer not available" });
}

contextBridge.exposeInMainWorld("pos", {
  ...api,
  error: preloadError ? String(preloadError.message || preloadError) : null,
  warning: warnings.length ? warnings.join(" | ") : null
});
