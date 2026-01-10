const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "..", "..", "data");
const dbPath = path.join(dataDir, "pos.sqlite");
let db = null;

function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS offline_queue (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      body TEXT,
      idempotency_key TEXT,
      extra_headers TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE INDEX IF NOT EXISTS idx_offline_queue_created ON offline_queue(created_at);
    CREATE TABLE IF NOT EXISTS cache_items (
      key TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function getDb() {
  if (db) return db;
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  return db;
}

function setMeta(key, value) {
  const database = getDb();
  const payload = JSON.stringify(value ?? null);
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO meta (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(key, payload, now);
  return { key, value, updated_at: now };
}

function getMeta(key) {
  const database = getDb();
  const row = database.prepare("SELECT value, updated_at FROM meta WHERE key = ?").get(key);
  if (!row) return null;
  return {
    value: row.value ? JSON.parse(row.value) : null,
    updated_at: row.updated_at,
  };
}

module.exports = { getDb, setMeta, getMeta, dbPath };
