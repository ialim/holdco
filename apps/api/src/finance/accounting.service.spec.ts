import { AccountingService } from "./accounting.service";

describe("AccountingService", () => {
  const groupId = "11111111-1111-1111-1111-111111111111";
  const subsidiaryId = "22222222-2222-2222-2222-222222222222";
  const fiscalPeriodId = "33333333-3333-3333-3333-333333333333";
  const accountA = "44444444-4444-4444-4444-444444444444";
  const accountB = "55555555-5555-5555-5555-555555555555";

  const prisma = {
    fiscalPeriod: {
      findFirst: jest.fn(),
    },
    journalEntry: {
      create: jest.fn(),
    },
  };

  const service = new AccountingService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a balanced journal entry", async () => {
    prisma.fiscalPeriod.findFirst.mockResolvedValue({
      id: fiscalPeriodId,
      status: "open",
    });
    prisma.journalEntry.create.mockResolvedValue({
      id: "66666666-6666-6666-6666-666666666666",
      fiscalPeriodId,
      reference: "JE-001",
      status: "draft",
      postedAt: null,
    });

    const result = await service.createJournalEntry(groupId, subsidiaryId, {
      fiscal_period_id: fiscalPeriodId,
      reference: "JE-001",
      memo: "Month-end accrual",
      lines: [
        { account_id: accountA, debit: 1500 },
        { account_id: accountB, credit: 1500 },
      ],
    });

    expect(prisma.journalEntry.create).toHaveBeenCalledTimes(1);
    const call = prisma.journalEntry.create.mock.calls[0][0];
    expect(call.data).toMatchObject({
      groupId,
      subsidiaryId,
      fiscalPeriodId,
    });
    expect(call.data.lines.create).toHaveLength(2);
    expect(result).toEqual({
      id: "66666666-6666-6666-6666-666666666666",
      fiscal_period_id: fiscalPeriodId,
      reference: "JE-001",
      status: "draft",
      posted_at: undefined,
    });
  });

  it("rejects unbalanced journal entries", async () => {
    prisma.fiscalPeriod.findFirst.mockResolvedValue({
      id: fiscalPeriodId,
      status: "open",
    });

    await expect(
      service.createJournalEntry(groupId, subsidiaryId, {
        fiscal_period_id: fiscalPeriodId,
        lines: [
          { account_id: accountA, debit: 100 },
          { account_id: accountB, credit: 80 },
        ],
      }),
    ).rejects.toThrow("Journal entry must balance debits and credits");

    expect(prisma.journalEntry.create).not.toHaveBeenCalled();
  });

  it("blocks journal entries in locked periods", async () => {
    prisma.fiscalPeriod.findFirst.mockResolvedValue({
      id: fiscalPeriodId,
      status: "locked",
    });

    await expect(
      service.createJournalEntry(groupId, subsidiaryId, {
        fiscal_period_id: fiscalPeriodId,
        lines: [{ account_id: accountA, debit: 50, credit: 50 }],
      }),
    ).rejects.toThrow("Fiscal period is locked");

    expect(prisma.journalEntry.create).not.toHaveBeenCalled();
  });
});
