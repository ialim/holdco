const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { request } = require("../api/client");

const queuePath = path.join(__dirname, "..", "..", "queue.json");

function readQueue() {
  if (!fs.existsSync(queuePath)) {
    return [];
  }

  const raw = fs.readFileSync(queuePath, "utf8");
  return raw ? JSON.parse(raw) : [];
}

function writeQueue(entries) {
  fs.writeFileSync(queuePath, JSON.stringify(entries, null, 2));
}

function enqueueOperation(operation) {
  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...operation
  };

  const queue = readQueue();
  queue.push(entry);
  writeQueue(queue);
  return entry;
}

async function flushQueue() {
  const queue = readQueue();
  const remaining = [];
  let processed = 0;

  for (const entry of queue) {
    try {
      const response = await request({
        method: entry.method,
        path: entry.path,
        body: entry.body,
        idempotencyKey: entry.idempotencyKey,
        extraHeaders: entry.extraHeaders
      });

      if (response.ok || response.status === 409) {
        processed += 1;
      } else {
        remaining.push(entry);
      }
    } catch (error) {
      remaining.push(entry);
    }
  }

  writeQueue(remaining);
  return { processed, remaining: remaining.length };
}

module.exports = { enqueueOperation, flushQueue, readQueue };
