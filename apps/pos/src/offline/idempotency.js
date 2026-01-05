const crypto = require("node:crypto");

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    const entries = keys.map((key) => `"${key}":${stableStringify(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function buildIdempotencyKey(scope, payload) {
  const source = `${scope}:${stableStringify(payload)}`;
  return crypto.createHash("sha256").update(source).digest("hex");
}

module.exports = { buildIdempotencyKey };
