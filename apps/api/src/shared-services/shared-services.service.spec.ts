import { Prisma } from "@prisma/client";
import { SharedServicesService } from "./shared-services.service";
import { ThirdPartyStatus, ThirdPartyType } from "./enums/shared-services.enums";

describe("SharedServicesService", () => {
  const groupId = "11111111-1111-1111-1111-111111111111";

  const prisma = {
    externalClient: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const service = new SharedServicesService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects creating a third party with a credit limit but no currency", async () => {
    await expect(
      service.createThirdParty(groupId, {
        name: "Vendor A",
        type: ThirdPartyType.VENDOR,
        credit_limit: 50000,
      }),
    ).rejects.toThrow("Credit currency is required when credit limit is provided");
  });

  it("rejects empty third-party updates", async () => {
    prisma.externalClient.findFirst.mockResolvedValue({
      id: "22222222-2222-2222-2222-222222222222",
      groupId,
      creditCurrency: null,
    });

    await expect(service.updateThirdParty(groupId, "22222222-2222-2222-2222-222222222222", {})).rejects.toThrow(
      "No updates provided",
    );
  });

  it("rejects credit limit updates without currency", async () => {
    prisma.externalClient.findFirst.mockResolvedValue({
      id: "33333333-3333-3333-3333-333333333333",
      groupId,
      creditCurrency: null,
    });

    await expect(
      service.updateThirdParty(groupId, "33333333-3333-3333-3333-333333333333", {
        credit_limit: 10000,
      }),
    ).rejects.toThrow("Credit currency is required when credit limit is provided");
  });

  it("updates third-party fields", async () => {
    prisma.externalClient.findFirst.mockResolvedValue({
      id: "44444444-4444-4444-4444-444444444444",
      groupId,
      creditCurrency: "NGN",
    });
    prisma.externalClient.update.mockResolvedValue({
      id: "44444444-4444-4444-4444-444444444444",
      name: "Vendor B",
      type: "vendor",
      email: "vendor@example.com",
      phone: "08000000000",
      status: "active",
      creditLimit: new Prisma.Decimal(15000),
      creditCurrency: "NGN",
      paymentTermDays: 30,
      negotiationNotes: "Annual review",
      lastNegotiatedAt: new Date("2025-01-01T10:00:00.000Z"),
      lastNegotiatedBy: "ops@alims.test",
    });

    const result = await service.updateThirdParty(groupId, "44444444-4444-4444-4444-444444444444", {
      name: "Vendor B",
      type: ThirdPartyType.VENDOR,
      email: "vendor@example.com",
      phone: "08000000000",
      credit_limit: 15000,
      credit_currency: "NGN",
      payment_term_days: 30,
      negotiation_notes: "Annual review",
      last_negotiated_at: "2025-01-01T10:00:00.000Z",
      last_negotiated_by: "ops@alims.test",
      status: ThirdPartyStatus.ACTIVE,
    });

    expect(prisma.externalClient.update).toHaveBeenCalledTimes(1);
    const call = prisma.externalClient.update.mock.calls[0][0];
    expect(call.data).toMatchObject({
      name: "Vendor B",
      type: "vendor",
      email: "vendor@example.com",
      phone: "08000000000",
      creditLimit: 15000,
      creditCurrency: "NGN",
      paymentTermDays: 30,
      negotiationNotes: "Annual review",
      lastNegotiatedBy: "ops@alims.test",
      status: "active",
    });
    expect(result).toMatchObject({
      id: "44444444-4444-4444-4444-444444444444",
      name: "Vendor B",
      type: "vendor",
      credit_limit: 15000,
      credit_currency: "NGN",
      payment_term_days: 30,
      negotiation_notes: "Annual review",
      last_negotiated_by: "ops@alims.test",
      status: "active",
    });
  });
});
