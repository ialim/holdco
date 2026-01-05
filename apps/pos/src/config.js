const fs = require("node:fs");
const path = require("node:path");

const configPath = path.join(__dirname, "..", "config.json");
const templatePath = path.join(__dirname, "..", "config.template.json");

function getSourcePath() {
  return fs.existsSync(configPath) ? configPath : templatePath;
}

function loadConfig() {
  const raw = fs.readFileSync(getSourcePath(), "utf8");
  return JSON.parse(raw);
}

function saveConfig(patch) {
  const current = loadConfig();
  const next = { ...current, ...patch };
  fs.writeFileSync(configPath, JSON.stringify(next, null, 2));
  return next;
}

module.exports = { loadConfig, saveConfig };
