const { getDb } = require("./db");

function setCache(key, payload) {
  const database = getDb();
  const now = new Date().toISOString();
  const value = JSON.stringify(payload ?? null);
  database
    .prepare(
      `INSERT INTO cache_items (key, payload, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    )
    .run(key, value, now);
  return { key, payload, updated_at: now };
}

function getCache(key) {
  const database = getDb();
  const row = database.prepare("SELECT payload, updated_at FROM cache_items WHERE key = ?").get(key);
  if (!row) return null;
  return {
    key,
    payload: row.payload ? JSON.parse(row.payload) : null,
    updated_at: row.updated_at,
  };
}

function deleteCache(key) {
  const database = getDb();
  database.prepare("DELETE FROM cache_items WHERE key = ?").run(key);
}

module.exports = { setCache, getCache, deleteCache };
