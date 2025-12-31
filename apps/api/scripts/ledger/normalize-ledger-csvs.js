const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../../../..");
const inputDir = path.join(repoRoot, "chart-of-account");
const outputDir = path.join(inputDir, "normalized");
const standardPath = path.join(
  repoRoot,
  "ledger-setup-package",
  "src",
  "modules",
  "ledger-setup",
  "StandardPostingAccounts.ts",
);

function loadStandardAccounts(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const pattern = /\{\s*code:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*type:\s*"([^"]+)"\s*\}/g;
  const accounts = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    accounts.push({ code: match[1], name: match[2], type: match[3] });
  }
  if (!accounts.length) {
    throw new Error(`No standard accounts found in ${filePath}`);
  }
  return accounts;
}

function getCsvFiles(dirPath) {
  return fs
    .readdirSync(dirPath)
    .filter((name) => name.toLowerCase().endsWith(".csv"))
    .map((name) => path.join(dirPath, name))
    .filter((filePath) => !filePath.includes(`${path.sep}normalized${path.sep}`));
}

function parseExistingCodes(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return new Set();
  return new Set(
    lines
      .slice(1)
      .map((line) => line.split(",")[0]?.trim())
      .filter((code) => code),
  );
}

function writeNormalizedCsv(outputPath, accounts) {
  const header = "Account Code,Account Name,Account Type";
  const rows = accounts.map((account) => `${account.code},${account.name},${account.type}`);
  const csv = [header, ...rows].join("\n");
  fs.writeFileSync(outputPath, csv, "utf8");
}

function run() {
  if (!fs.existsSync(inputDir)) {
    throw new Error(`Input folder not found: ${inputDir}`);
  }
  if (!fs.existsSync(standardPath)) {
    throw new Error(`StandardPostingAccounts not found: ${standardPath}`);
  }

  const accounts = loadStandardAccounts(standardPath);
  fs.mkdirSync(outputDir, { recursive: true });

  const files = getCsvFiles(inputDir);
  if (!files.length) {
    throw new Error(`No CSV files found in ${inputDir}`);
  }

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const outputPath = path.join(outputDir, fileName);
    const existingCodes = parseExistingCodes(filePath);
    writeNormalizedCsv(outputPath, accounts);
    const extras = Array.from(existingCodes).filter(
      (code) => !accounts.find((account) => account.code === code),
    );
    if (extras.length) {
      console.log(`Notice: ${fileName} had extra codes not in standard list: ${extras.join(", ")}`);
    }
  }

  console.log(`Normalized CSVs written to ${outputDir}`);
}

run();
