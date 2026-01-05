import { AdaptersService } from "./adapters.service";

describe("AdaptersService", () => {
  const groupId = "11111111-1111-1111-1111-111111111111";
  const subsidiaryId = "22222222-2222-2222-2222-222222222222";

  const procurementService = {
    listImportShipments: jest.fn(),
    createImportShipment: jest.fn(),
    addImportCosts: jest.fn(),
    finalizeImportShipment: jest.fn(),
    receiveImportShipment: jest.fn(),
  };

  const service = new AdaptersService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    procurementService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates listing trading import shipments", async () => {
    procurementService.listImportShipments.mockResolvedValue({ data: [] });

    const result = await service.listTradingImportShipments({
      groupId,
      subsidiaryId,
      query: { q: "IMP" } as any,
    });

    expect(procurementService.listImportShipments).toHaveBeenCalledWith(groupId, subsidiaryId, { q: "IMP" });
    expect(result).toEqual({ data: [] });
  });

  it("delegates creating trading import shipments", async () => {
    procurementService.createImportShipment.mockResolvedValue({ id: "ship-1" });

    const result = await service.createTradingImportShipment({
      groupId,
      subsidiaryId,
      body: { reference: "IMP-001" } as any,
    });

    expect(procurementService.createImportShipment).toHaveBeenCalledWith(groupId, subsidiaryId, { reference: "IMP-001" });
    expect(result).toEqual({ id: "ship-1" });
  });

  it("delegates adding trading import costs", async () => {
    procurementService.addImportCosts.mockResolvedValue({ id: "ship-2" });

    const result = await service.addTradingImportCosts({
      groupId,
      subsidiaryId,
      shipmentId: "ship-2",
      body: { costs: [] } as any,
    });

    expect(procurementService.addImportCosts).toHaveBeenCalledWith(groupId, subsidiaryId, "ship-2", { costs: [] });
    expect(result).toEqual({ id: "ship-2" });
  });

  it("delegates finalizing trading import shipments", async () => {
    procurementService.finalizeImportShipment.mockResolvedValue({ id: "ship-3" });

    const result = await service.finalizeTradingImportShipment({
      groupId,
      subsidiaryId,
      shipmentId: "ship-3",
    });

    expect(procurementService.finalizeImportShipment).toHaveBeenCalledWith(groupId, subsidiaryId, "ship-3");
    expect(result).toEqual({ id: "ship-3" });
  });

  it("delegates receiving trading import shipments", async () => {
    procurementService.receiveImportShipment.mockResolvedValue({ id: "receipt-1" });

    const result = await service.receiveTradingImportShipment({
      groupId,
      subsidiaryId,
      shipmentId: "ship-4",
      body: { location_id: "loc-1" } as any,
    });

    expect(procurementService.receiveImportShipment).toHaveBeenCalledWith(groupId, subsidiaryId, "ship-4", {
      location_id: "loc-1",
    });
    expect(result).toEqual({ id: "receipt-1" });
  });
});
