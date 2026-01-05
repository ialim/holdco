const { contextBridge } = require("electron");
const path = require("node:path");

let api = null;
let preloadError = null;

try {
  const queue = require(path.join(__dirname, "offline", "queue"));
  const idempotency = require(path.join(__dirname, "offline", "idempotency"));
  const client = require(path.join(__dirname, "api", "client"));
  const config = require(path.join(__dirname, "config"));

  api = {
    request: client.request,
    enqueueOperation: queue.enqueueOperation,
    flushQueue: queue.flushQueue,
    readQueue: queue.readQueue,
    buildIdempotencyKey: idempotency.buildIdempotencyKey,
    getConfig: config.loadConfig,
    saveConfig: config.saveConfig
  };
} catch (error) {
  preloadError = error;
}

contextBridge.exposeInMainWorld("pos", {
  ...(api ?? {}),
  error: preloadError ? String(preloadError.message || preloadError) : null
});
