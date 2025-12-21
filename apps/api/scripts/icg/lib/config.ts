import { readFileSync } from "fs";

export type MigrationConfig = {
  groupId: string;
  defaultCurrency: string;
  channel?: string;
  externalSystemName?: string;
  storeLocationMapFile?: string;
  defaultSubsidiaryId?: string;
};

export function loadConfig(path: string): MigrationConfig {
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as MigrationConfig;
  if (!parsed.groupId) {
    throw new Error("config.json is missing required field: groupId");
  }
  if (!parsed.defaultCurrency) {
    throw new Error("config.json is missing required field: defaultCurrency");
  }
  return parsed;
}
