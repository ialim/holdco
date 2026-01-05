const { loadConfig } = require("../config");

async function request({ method, path, body, idempotencyKey, extraHeaders }) {
  if (typeof fetch !== "function") {
    throw new Error("fetch is not available in this runtime");
  }

  const config = loadConfig();
  const headers = {
    Authorization: `Bearer ${config.jwt}`,
    "X-Group-Id": config.groupId,
    "X-Subsidiary-Id": config.subsidiaryId,
    "X-Location-Id": config.locationId,
    "X-Channel": config.channel,
    "Content-Type": "application/json",
    ...extraHeaders
  };

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return { ok: response.ok, status: response.status, data };
}

module.exports = { request };
