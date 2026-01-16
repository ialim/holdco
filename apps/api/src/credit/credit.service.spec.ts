import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CreditService } from "./credit.service";

describe("CreditService", () => {
  const groupId = "11111111-1111-1111-1111-111111111111";
  const subsidiaryId = "22222222-2222-2222-2222-222222222222";

  it("blocks credit usage when available credit is insufficient", async () => {
    const tx = {
      creditAccount: {
        findFirst: jest.fn().mockResolvedValue({
          id: "acc-1",
          resellerId: "res-1",
          limitAmount: 1000,
          usedAmount: 900,
          status: "active"
        })
      }
    };

    const prisma = {
      $transaction: jest.fn((fn: any) => fn(tx))
    } as any;

    const service = new CreditService(prisma);

    await expect(
      service.reserveCreditUsage({
        groupId,
        subsidiaryId,
        resellerId: "res-1",
        amount: 200
      })
    ).rejects.toThrow(BadRequestException);
  });

  it("allows credit override when permission is granted", async () => {
    const tx = {
      creditAccount: {
        findFirst: jest.fn().mockResolvedValue({
          id: "acc-1",
          resellerId: "res-1",
          limitAmount: 1000,
          usedAmount: 900,
          status: "active"
        }),
        update: jest.fn().mockResolvedValue({
          id: "acc-1",
          resellerId: "res-1",
          limitAmount: 1000,
          usedAmount: 1100,
          status: "active"
        })
      }
    };

    const prisma = {
      $transaction: jest.fn((fn: any) => fn(tx))
    } as any;

    const service = new CreditService(prisma);

    const result = await service.reserveCreditUsage({
      groupId,
      subsidiaryId,
      resellerId: "res-1",
      amount: 200,
      allowOverride: true
    });

    expect(tx.creditAccount.update).toHaveBeenCalledWith({
      where: { id: "acc-1" },
      data: { usedAmount: 1100 }
    });
    expect(result.used_amount).toBe(1100);
  });

  it("allocates repayments FIFO and updates used amount", async () => {
    const tx = {
      creditAccount: {
        findFirst: jest.fn().mockResolvedValue({
          id: "acc-1",
          resellerId: "res-1",
          usedAmount: 1000
        }),
        update: jest.fn().mockResolvedValue({})
      },
      repayment: {
        create: jest.fn().mockResolvedValue({
          id: "rep-1",
          creditAccountId: "acc-1",
          amount: 700,
          unappliedAmount: 700,
          paidAt: new Date("2025-01-01T00:00:00Z"),
          method: "transfer"
        }),
        update: jest.fn().mockResolvedValue({
          id: "rep-1",
          creditAccountId: "acc-1",
          amount: 700,
          unappliedAmount: 0,
          paidAt: new Date("2025-01-01T00:00:00Z"),
          method: "transfer"
        })
      },
      order: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "order-1",
            resellerId: "res-1",
            totalAmount: 600,
            paidAmount: 0,
            currency: "NGN",
            createdAt: new Date("2024-12-01T00:00:00Z")
          },
          {
            id: "order-2",
            resellerId: "res-1",
            totalAmount: 300,
            paidAmount: 0,
            currency: "NGN",
            createdAt: new Date("2024-12-02T00:00:00Z")
          }
        ]),
        update: jest.fn().mockResolvedValue({})
      },
      orderPayment: {
        create: jest.fn().mockResolvedValue({})
      },
      repaymentAllocation: {
        create: jest.fn().mockResolvedValue({})
      }
    };

    const prisma = {
      $transaction: jest.fn((fn: any) => fn(tx))
    } as any;

    const service = new CreditService(prisma);

    const result = await service.createRepayment(groupId, subsidiaryId, {
      credit_account_id: "acc-1",
      amount: 700,
      method: "transfer"
    });

    expect(tx.repaymentAllocation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ orderId: "order-1", amount: 600 })
    });
    expect(tx.repaymentAllocation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ orderId: "order-2", amount: 100 })
    });
    expect(tx.creditAccount.update).toHaveBeenCalledWith({
      where: { id: "acc-1" },
      data: { usedAmount: 300 }
    });
    expect(result.unapplied_amount).toBe(0);
  });

  it("throws when credit account is missing during repayment", async () => {
    const tx = {
      creditAccount: {
        findFirst: jest.fn().mockResolvedValue(null)
      }
    };

    const prisma = {
      $transaction: jest.fn((fn: any) => fn(tx))
    } as any;

    const service = new CreditService(prisma);

    await expect(
      service.createRepayment(groupId, subsidiaryId, {
        credit_account_id: "acc-missing",
        amount: 100
      })
    ).rejects.toThrow(NotFoundException);
  });
});
