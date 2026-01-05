import { SubsidiaryRole } from "@prisma/client";
import { ProcurementService } from "./procurement.service";

describe("ProcurementService", () => {
  const groupId = "11111111-1111-1111-1111-111111111111";
  const subsidiaryId = "22222222-2222-2222-2222-222222222222";

  const prisma = {
    subsidiary: {
      findFirst: jest.fn(),
    },
    importShipment: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const service = new ProcurementService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.subsidiary.findFirst.mockResolvedValue({
      id: subsidiaryId,
      role: SubsidiaryRole.PROCUREMENT_TRADING,
    });
  });

  it("rejects duplicate import shipment lines", async () => {
    await expect(
      service.createImportShipment(groupId, subsidiaryId, {
        reference: "IMP-001",
        currency: "USD",
        fx_rate: 1,
        lines: [
          {
            product_id: "33333333-3333-3333-3333-333333333333",
            quantity: 1,
            unit_cost: 10,
          },
          {
            product_id: "33333333-3333-3333-3333-333333333333",
            quantity: 2,
            unit_cost: 12,
          },
        ],
      }),
    ).rejects.toThrow("Duplicate shipment line for product/variant");
  });

  it("rejects finalizing received import shipments", async () => {
    prisma.importShipment.findFirst.mockResolvedValue({
      id: "44444444-4444-4444-4444-444444444444",
      status: "received",
      lines: [],
      costLines: [],
    });

    await expect(service.finalizeImportShipment(groupId, subsidiaryId, "44444444-4444-4444-4444-444444444444")).rejects.toThrow(
      "Cannot finalize a received shipment",
    );
  });
});
