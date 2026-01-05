import { PaymentsWebhookService } from "./payments.webhook.service";

describe("PaymentsWebhookService", () => {
  const prisma = {
    paymentIntent: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const gatewayFactory = {
    get: jest.fn(),
  };

  const service = new PaymentsWebhookService(prisma as any, gatewayFactory as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects webhooks without signature verification", async () => {
    gatewayFactory.get.mockReturnValue({
      name: "test",
      parseWebhook: jest.fn(),
    });

    await expect(
      service.handleWebhook({
        provider: "test",
        headers: {},
        payload: {},
        rawBody: "{}",
      }),
    ).rejects.toThrow("Webhook signature verification is required");
  });

  it("rejects invalid webhook signatures", async () => {
    gatewayFactory.get.mockReturnValue({
      name: "test",
      verifyWebhook: jest.fn().mockReturnValue(false),
      parseWebhook: jest.fn(),
    });

    await expect(
      service.handleWebhook({
        provider: "test",
        headers: {},
        payload: {},
        rawBody: "{}",
      }),
    ).rejects.toThrow("Invalid webhook signature");
  });
});
