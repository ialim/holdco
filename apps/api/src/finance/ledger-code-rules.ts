import { BadRequestException } from "@nestjs/common";

const REPORTING_ONLY_LEDGER_CODES = new Set(["4000"]);

export function assertPostingCodeAllowed(code: string) {
  if (REPORTING_ONLY_LEDGER_CODES.has(code)) {
    throw new BadRequestException(`Ledger account ${code} is reporting-only. Use REV_SALES for postings.`);
  }
}
