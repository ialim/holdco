import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { STANDARD_LEDGER_ACCOUNTS } from "./StandardPostingAccounts";

@Injectable()
export class LedgerSetupService {
  constructor(private readonly prisma: PrismaService) {}

  async seedStandardAccounts(groupId: string, subsidiaryId: string | null) {
    const companies = await this.prisma.subsidiary.findMany({
      where: {
        groupId,
        ...(subsidiaryId ? { id: subsidiaryId } : {}),
        status: "active",
      },
      select: { id: true, name: true },
    });

    let totalInserted = 0;
    let totalUpdated = 0;

    for (const c of companies) {
      for (const account of STANDARD_LEDGER_ACCOUNTS) {
        const exists = await this.prisma.ledgerAccount.findUnique({
          where: { companyId_code: { companyId: c.id, code: account.code } },
          select: { id: true },
        });

        await this.prisma.ledgerAccount.upsert({
          where: { companyId_code: { companyId: c.id, code: account.code } },
          update: { name: account.name, type: account.type },
          create: {
            companyId: c.id,
            code: account.code,
            name: account.name,
            type: account.type,
          },
        });

        if (exists) {
          totalUpdated += 1;
        } else {
          totalInserted += 1;
        }
      }
    }

    return {
      ok: true,
      companiesSeeded: companies.length,
      accountsInserted: totalInserted,
      accountsUpdated: totalUpdated,
      note: "Idempotent: existing codes were updated to match the standard list.",
    };
  }
}
