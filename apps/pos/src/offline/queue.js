const crypto = require("node:crypto");
const { request } = require("../api/client");
const { getDb, setMeta, getMeta } = require("./db");

function serialize(value) {
  return value === undefined ? null : JSON.stringify(value);
}

function deserialize(value) {
  if (!value) return undefined;
  return JSON.parse(value);
}

function enqueueOperation(operation) {
  const database = getDb();
  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    method: operation.method,
    path: operation.path,
    body: operation.body ?? null,
    idempotencyKey: operation.idempotencyKey ?? null,
    extraHeaders: operation.extraHeaders ?? null
  };

  database
    .prepare(
      `INSERT INTO offline_queue (
        id, created_at, method, path, body, idempotency_key, extra_headers, attempts, last_error, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, 'pending')`,
    )
    .run(
      entry.id,
      entry.createdAt,
      entry.method,
      entry.path,
      serialize(entry.body),
      entry.idempotencyKey,
      serialize(entry.extraHeaders),
    );

  return entry;
}

function readQueue(limit = 200) {
  const database = getDb();
  const rows = database
    .prepare(
      `SELECT id, created_at, method, path, body, idempotency_key, extra_headers, attempts, last_error, status
       FROM offline_queue
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .all(limit);

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    method: row.method,
    path: row.path,
    body: deserialize(row.body),
    idempotencyKey: row.idempotency_key,
    extraHeaders: deserialize(row.extra_headers),
    attempts: row.attempts,
    lastError: row.last_error,
    status: row.status
  }));
}

function getQueueMeta() {
  const meta = getMeta("queue.last_flush");
  if (!meta) return null;
  return {
    ...meta.value,
    updated_at: meta.updated_at
  };
}

async function flushQueue() {
  const database = getDb();
  const rows = database
    .prepare(
      `SELECT id, method, path, body, idempotency_key, extra_headers, attempts
       FROM offline_queue
       ORDER BY created_at ASC`,
    )
    .all();

  let processed = 0;
  let remaining = 0;

  for (const row of rows) {
    try {
      const response = await request({
        method: row.method,
        path: row.path,
        body: deserialize(row.body),
        idempotencyKey: row.idempotency_key || undefined,
        extraHeaders: deserialize(row.extra_headers)
      });

      if (response.ok || response.status === 409) {
        database.prepare("DELETE FROM offline_queue WHERE id = ?").run(row.id);
        processed += 1;
      } else {
        remaining += 1;
        database
          .prepare("UPDATE offline_queue SET attempts = ?, last_error = ?, status = ? WHERE id = ?")
          .run(row.attempts + 1, `HTTP ${response.status}`, "pending", row.id);
      }
    } catch (error) {
      remaining += 1;
      const message = error?.message || String(error);
      database
        .prepare("UPDATE offline_queue SET attempts = ?, last_error = ?, status = ? WHERE id = ?")
        .run(row.attempts + 1, message, "pending", row.id);
    }
  }

  const meta = {
    at: new Date().toISOString(),
    processed,
    remaining
  };
  setMeta("queue.last_flush", meta);
  return meta;
}

module.exports = { enqueueOperation, flushQueue, readQueue, getQueueMeta };
