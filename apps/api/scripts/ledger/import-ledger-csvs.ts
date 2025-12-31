import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync, readdirSync } from "fs";
import { basename, resolve } from "path";

type Args = {
  groupId?: string;
  dir?: string;
  dryRun: boolean;
};

const prisma = new PrismaClient();

function projectRoot() {
  return resolve(__dirname, "../..");
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--group-id") {
      args.groupId = argv[i + 1];
      i += 1;
    } else if (arg === "--dir") {
      args.dir = argv[i + 1];
      i += 1;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    }
  }
  return args;
}

function canonicalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\blimited\b/g, "ltd")
    .replace(/\band\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");
}

function resolveNormalizedDir(argsDir?: string) {
  if (argsDir) return resolve(process.cwd(), argsDir);
  return resolve(projectRoot(), "..", "..", "chart-of-account", "normalized");
}

function parseCsvRows(filePath: string) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const rows: { code: string; name: string; type: string }[] = [];
  for (const line of lines.slice(1)) {
    const parts = line.split(",");
    if (parts.length < 3) continue;
    const code = parts[0]?.trim();
    const type = parts[parts.length - 1]?.trim();
    const name = parts.slice(1, -1).join(",").trim();
    if (!code || !name || !type) continue;
    rows.push({ code, name, type });
  }

  return rows;
}

async function resolveGroupId(args: Args) {
  if (args.groupId) return args.groupId;
  const groups = await prisma.tenantGroup.findMany({ select: { id: true, name: true } });
  if (!groups.length) {
    throw new Error("No tenant groups found. Seed the database first.");
  }
  if (groups.length > 1) {
    const names = groups.map((group) => `${group.name} (${group.id})`).join(", ");
    throw new Error(`Multiple tenant groups found. Pass --group-id. Available: ${names}`);
  }
  return groups[0].id;
}

async function run() {
  loadEnv({ path: resolve(projectRoot(), ".env") });

  const args = parseArgs(process.argv.slice(2));
  const dirPath = resolveNormalizedDir(args.dir);
  if (!existsSync(dirPath)) {
    throw new Error(`Normalized COA folder not found: ${dirPath}`);
  }

  const groupId = await resolveGroupId(args);
  const subsidiaries = await prisma.subsidiary.findMany({
    where: { groupId, status: "active" },
    select: { id: true, name: true },
  });

  if (!subsidiaries.length) {
    throw new Error("No subsidiaries found for the selected group.");
  }

  const subsidiariesByKey = new Map(
    subsidiaries.map((subsidiary) => [canonicalizeName(subsidiary.name), subsidiary]),
  );

  const files = readdirSync(dirPath)
    .filter((name) => name.toLowerCase().endsWith(".csv"))
    .map((name) => resolve(dirPath, name));

  if (!files.length) {
    throw new Error(`No CSV files found in ${dirPath}`);
  }

  let totalInserted = 0;
  let totalUpdated = 0;
  const unmatchedFiles: string[] = [];

  for (const filePath of files) {
    const fileName = basename(filePath);
    const base = basename(filePath, ".csv").replace(/_COA$/i, "").replace(/_/g, " ");
    const key = canonicalizeName(base);
    const subsidiary = subsidiariesByKey.get(key);

    if (!subsidiary) {
      unmatchedFiles.push(fileName);
      continue;
    }

    const rows = parseCsvRows(filePath);
    let inserted = 0;
    let updated = 0;

    for (const account of rows) {
      const exists = await prisma.ledgerAccount.findUnique({
        where: { companyId_code: { companyId: subsidiary.id, code: account.code } },
        select: { id: true },
      });

      if (!args.dryRun) {
        await prisma.ledgerAccount.upsert({
          where: { companyId_code: { companyId: subsidiary.id, code: account.code } },
          update: { name: account.name, type: account.type },
          create: {
            companyId: subsidiary.id,
            code: account.code,
            name: account.name,
            type: account.type,
          },
        });
      }

      if (exists) {
        updated += 1;
      } else {
        inserted += 1;
      }
    }

    totalInserted += inserted;
    totalUpdated += updated;

    console.log(
      `ledger-import ${subsidiary.name} rows=${rows.length} inserted=${inserted} updated=${updated} dryRun=${args.dryRun}`,
    );
  }

  if (unmatchedFiles.length) {
    throw new Error(`No subsidiary match for files: ${unmatchedFiles.join(", ")}`);
  }

  console.log(`ledger-import totals inserted=${totalInserted} updated=${totalUpdated} dryRun=${args.dryRun}`);
}

run()
  .catch((error) => {
    console.error("LEDGER_IMPORT_FAILED", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
