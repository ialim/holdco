import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import SftpClient from "ssh2-sftp-client";

import { FinanceExportsService } from "../../src/finance/finance-exports.service";
import { FinanceExportQueryDto } from "../../src/finance/dto/finance-export-query.dto";
import { PrismaService } from "../../src/prisma/prisma.service";

type ExportType = "journals" | "invoices" | "credit-notes" | "intercompany" | "payments";

type SftpConfig = {
  enabled?: boolean;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  privateKeyPath?: string;
  remoteDir?: string;
};

type ScheduleConfig = {
  intervalMinutes?: number;
};

type ExportConfig = {
  groupId?: string;
  subsidiaryId?: string;
  format?: "json" | "csv";
  period?: string;
  fiscalPeriodId?: string;
  invoiceType?: string;
  startDate?: string;
  endDate?: string;
  exports?: ExportType[];
  outputDir?: string;
  sftp?: SftpConfig;
  schedule?: ScheduleConfig;
};

type CliOptions = {
  configPath: string;
  once: boolean;
  validate: boolean;
  dryRun: boolean;
};

type ExportFile = {
  filePath: string;
  fileName: string;
};

function projectRoot() {
  return resolve(__dirname, "..", "..");
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    configPath: join(projectRoot(), "scripts", "erp", "config.json"),
    once: false,
    validate: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--config" && argv[i + 1]) {
      options.configPath = resolve(argv[i + 1]);
      i += 1;
      continue;
    }
    if (current === "--once") {
      options.once = true;
      continue;
    }
    if (current === "--validate") {
      options.validate = true;
      continue;
    }
    if (current === "--dry-run") {
      options.dryRun = true;
    }
  }

  return options;
}

async function loadConfig(configPath: string): Promise<ExportConfig> {
  if (!existsSync(configPath)) {
    throw new Error(`Missing config file: ${configPath}`);
  }
  const raw = await readFile(configPath, "utf8");
  return JSON.parse(raw) as ExportConfig;
}

function buildQuery(config: ExportConfig): FinanceExportQueryDto {
  const query: FinanceExportQueryDto = {};

  if (config.format) query.format = config.format;
  if (config.period) query.period = config.period;
  if (config.fiscalPeriodId) query.fiscal_period_id = config.fiscalPeriodId;
  if (config.invoiceType) query.invoice_type = config.invoiceType;
  if (config.startDate) query.start_date = config.startDate;
  if (config.endDate) query.end_date = config.endDate;

  return query;
}

function resolveOutputDir(config: ExportConfig) {
  if (config.outputDir) return resolve(config.outputDir);
  return join(projectRoot(), "scripts", "erp", "output");
}

function resolveExports(config: ExportConfig): ExportType[] {
  return config.exports && config.exports.length
    ? config.exports
    : ["journals", "invoices", "credit-notes", "intercompany", "payments"];
}

async function resolveTenantIds(prisma: PrismaService, config: ExportConfig) {
  let groupId = config.groupId;
  if (!groupId) {
    const group = await prisma.tenantGroup.findFirst({ orderBy: { createdAt: "asc" } });
    groupId = group?.id;
  }

  if (!groupId) {
    throw new Error("Missing groupId (set in config.json or seed the database).");
  }

  let subsidiaryId = config.subsidiaryId;
  if (!subsidiaryId) {
    const subsidiary = await prisma.subsidiary.findFirst({
      where: { groupId },
      orderBy: { createdAt: "asc" },
    });
    subsidiaryId = subsidiary?.id;
  }

  if (!subsidiaryId) {
    throw new Error("Missing subsidiaryId (set in config.json or seed the database).");
  }

  return { groupId, subsidiaryId };
}

async function runExports(
  service: FinanceExportsService,
  tenant: { groupId: string; subsidiaryId: string },
  config: ExportConfig,
  dryRun: boolean,
) {
  const query = buildQuery(config);
  const outputDir = resolveOutputDir(config);
  const exportsToRun = resolveExports(config);
  const files: ExportFile[] = [];

  if (!dryRun) {
    await mkdir(outputDir, { recursive: true });
  }

  for (const exportType of exportsToRun) {
    let result: Record<string, any>;
    if (exportType === "journals") {
      result = await service.exportJournalEntries(tenant.groupId, tenant.subsidiaryId, query);
    } else if (exportType === "invoices") {
      result = await service.exportInvoices(tenant.groupId, tenant.subsidiaryId, query);
    } else if (exportType === "credit-notes") {
      result = await service.exportCreditNotes(tenant.groupId, tenant.subsidiaryId, query);
    } else if (exportType === "intercompany") {
      result = await service.exportIntercompanyInvoices(tenant.groupId, tenant.subsidiaryId, query);
    } else if (exportType === "payments") {
      result = await service.exportPayments(tenant.groupId, tenant.subsidiaryId, query);
    } else {
      continue;
    }

    const format = result.format === "csv" ? "csv" : "json";
    const dateSuffix = new Date().toISOString().slice(0, 10);
    const baseName = result.file_name ?? `${exportType}-${dateSuffix}.${format}`;
    const fileName = baseName.endsWith(`.${format}`) ? baseName : `${baseName}.${format}`;
    const filePath = join(outputDir, fileName);

    if (!dryRun) {
      if (format === "csv") {
        await writeFile(filePath, result.content ?? "", "utf8");
      } else {
        await writeFile(filePath, JSON.stringify(result.data ?? [], null, 2), "utf8");
      }
    }

    files.push({ filePath, fileName });
    console.log(`[export] ${exportType}: rows=${result.meta?.row_count ?? 0} -> ${filePath}`);
  }

  return files;
}

async function uploadToSftp(files: ExportFile[], config?: SftpConfig) {
  if (!config?.enabled) return;
  if (!config.host || !config.username) {
    throw new Error("SFTP enabled but host/username is missing.");
  }

  const client = new SftpClient();
  const privateKey = config.privateKeyPath ? await readFile(config.privateKeyPath, "utf8") : undefined;

  await client.connect({
    host: config.host,
    port: config.port ?? 22,
    username: config.username,
    password: config.password,
    privateKey,
  });

  const remoteDir = config.remoteDir ?? "/";
  const normalizedRemoteDir = remoteDir.endsWith("/") ? remoteDir.slice(0, -1) : remoteDir;

  for (const file of files) {
    const remotePath = `${normalizedRemoteDir}/${file.fileName}`;
    await client.put(file.filePath, remotePath);
    console.log(`[sftp] uploaded ${file.fileName} -> ${remotePath}`);
  }

  await client.end();
}

async function validateTemplates(
  service: FinanceExportsService,
  tenant: { groupId: string; subsidiaryId: string },
  config: ExportConfig,
) {
  const query = buildQuery(config);
  const templateDir = join(projectRoot(), "scripts", "erp", "templates");
  const templates: Record<ExportType, string> = {
    "journals": "journal_entries.template.csv",
    "invoices": "invoices.template.csv",
    "credit-notes": "credit_notes.template.csv",
    "intercompany": "intercompany_invoices.template.csv",
    "payments": "payments.template.csv",
  };

  const results: Record<string, boolean> = {};

  for (const [exportType, fileName] of Object.entries(templates) as [ExportType, string][]) {
    let result: Record<string, any>;
    if (exportType === "journals") {
      result = await service.exportJournalEntries(tenant.groupId, tenant.subsidiaryId, query);
    } else if (exportType === "invoices") {
      result = await service.exportInvoices(tenant.groupId, tenant.subsidiaryId, query);
    } else if (exportType === "credit-notes") {
      result = await service.exportCreditNotes(tenant.groupId, tenant.subsidiaryId, query);
    } else if (exportType === "intercompany") {
      result = await service.exportIntercompanyInvoices(tenant.groupId, tenant.subsidiaryId, query);
    } else {
      result = await service.exportPayments(tenant.groupId, tenant.subsidiaryId, query);
    }

    const templatePath = join(templateDir, fileName);
    if (!existsSync(templatePath)) {
      results[exportType] = false;
      console.log(`[validate] missing template: ${templatePath}`);
      continue;
    }

    const header = (await readFile(templatePath, "utf8")).split(/\r?\n/)[0]?.trim() ?? "";
    const templateColumns = header ? header.split(",") : [];
    const exportColumns = (result.columns ?? []) as string[];
    const match = templateColumns.join("|") === exportColumns.join("|");
    results[exportType] = match;
    console.log(`[validate] ${exportType}: ${match ? "ok" : "mismatch"}`);
  }

  const allOk = Object.values(results).every(Boolean);
  if (!allOk) {
    throw new Error("Template validation failed for one or more exports.");
  }
}

async function runOnce(options: CliOptions, config: ExportConfig, prisma: PrismaService) {
  const service = new FinanceExportsService(prisma);
  const tenant = await resolveTenantIds(prisma, config);

  if (options.validate) {
    await validateTemplates(service, tenant, config);
  }

  const files = await runExports(service, tenant, config, options.dryRun);

  if (!options.dryRun) {
    await uploadToSftp(files, config.sftp);
  }
}

async function run() {
  loadEnv({ path: join(projectRoot(), ".env") });
  const options = parseArgs(process.argv.slice(2));
  const config = await loadConfig(options.configPath);
  const prisma = new PrismaService();
  await prisma.$connect();

  const intervalMinutes = Number(process.env.ERP_EXPORT_INTERVAL_MINUTES ?? config.schedule?.intervalMinutes ?? 0);
  const shouldLoop = !options.once && intervalMinutes > 0;

  let running = false;
  const execOnce = async () => {
    if (running) {
      console.log("[schedule] previous run still in progress, skipping this interval.");
      return;
    }
    running = true;
    try {
      await runOnce(options, config, prisma);
    } finally {
      running = false;
    }
  };

  if (shouldLoop) {
    await execOnce();
    const intervalMs = intervalMinutes * 60 * 1000;
    console.log(`[schedule] running every ${intervalMinutes} minutes`);
    setInterval(execOnce, intervalMs);
  } else {
    await execOnce();
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
