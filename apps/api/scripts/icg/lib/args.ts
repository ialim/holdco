import { resolve } from "path";

export type CliArgs = {
  configPath: string;
  filePath?: string;
  dirPath?: string;
  dryRun: boolean;
};

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    configPath: resolve(process.cwd(), "scripts/icg/config.json"),
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--config" && argv[i + 1]) {
      args.configPath = resolve(process.cwd(), argv[i + 1]);
      i += 1;
      continue;
    }
    if (current === "--file" && argv[i + 1]) {
      args.filePath = resolve(process.cwd(), argv[i + 1]);
      i += 1;
      continue;
    }
    if (current === "--dir" && argv[i + 1]) {
      args.dirPath = resolve(process.cwd(), argv[i + 1]);
      i += 1;
      continue;
    }
    if (current === "--dry-run") {
      args.dryRun = true;
    }
  }

  return args;
}
