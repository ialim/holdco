import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { sign } from "jsonwebtoken";

type CreatedIds = {
  locationId?: string;
  productId?: string;
  orders: string[];
  paymentIntents: string[];
  reservations: string[];
  resellerId?: string;
  creditAccountId?: string;
  repaymentId?: string;
};

function projectRoot() {
  return resolve(__dirname, "..");
}

function buildBaseUrl() {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

async function request(
  name: string,
  url: string,
  options: RequestInit,
  expectedStatus?: number,
) {
  const res = await fetch(url, options);
  const text = await res.text();
  console.log(`${name}: ${res.status}`);
  if (res.status >= 400) {
    console.log(`${name}.body: ${text}`);
  }
  if (expectedStatus !== undefined && res.status !== expectedStatus) {
    throw new Error(`${name} expected ${expectedStatus} but got ${res.status}`);
  }
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return text;
  }
}

async function cleanup(prisma: PrismaClient, created: CreatedIds) {
  if (created.repaymentId) {
    await prisma.repayment.deleteMany({ where: { id: created.repaymentId } });
  }
  if (created.creditAccountId) {
    await prisma.creditAccount.deleteMany({ where: { id: created.creditAccountId } });
  }
  if (created.resellerId) {
    await prisma.reseller.deleteMany({ where: { id: created.resellerId } });
  }
  if (created.reservations.length) {
    await prisma.stockReservation.deleteMany({ where: { id: { in: created.reservations } } });
  }
  if (created.productId) {
    await prisma.stockReservation.deleteMany({ where: { productId: created.productId } });
  }
  if (created.paymentIntents.length) {
    await prisma.refund.deleteMany({ where: { paymentIntentId: { in: created.paymentIntents } } });
    await prisma.paymentIntent.deleteMany({ where: { id: { in: created.paymentIntents } } });
  }
  if (created.orders.length) {
    await prisma.order.deleteMany({ where: { id: { in: created.orders } } });
  }
  if (created.productId && created.locationId) {
    await prisma.stockLevel.deleteMany({
      where: { productId: created.productId, locationId: created.locationId },
    });
  }
  if (created.productId) {
    await prisma.product.deleteMany({ where: { id: created.productId } });
  }
  if (created.locationId) {
    await prisma.location.deleteMany({ where: { id: created.locationId } });
  }
}

async function main() {
  loadEnv({ path: resolve(projectRoot(), ".env") });

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set in apps/api/.env");

  const prisma = new PrismaClient();
  const created: CreatedIds = {
    orders: [],
    paymentIntents: [],
    reservations: [],
  };

  try {
    const group = await prisma.tenantGroup.findFirst({ orderBy: { createdAt: "asc" } });
    if (!group) throw new Error("No tenant group found. Run `npm --prefix apps/api run prisma:seed`.");

    const subsidiary = await prisma.subsidiary.findFirst({
      where: { groupId: group.id },
      orderBy: { createdAt: "asc" },
    });
    if (!subsidiary) throw new Error("No subsidiary found for group.");

    const suffix = Date.now();
    const location = await prisma.location.create({
      data: {
        groupId: group.id,
        subsidiaryId: subsidiary.id,
        type: "store",
        name: `Adapter Smoke Store ${suffix}`,
      },
    });
    created.locationId = location.id;

    const product = await prisma.product.create({
      data: {
        groupId: group.id,
        subsidiaryId: subsidiary.id,
        sku: `SMOKE-ADAPTER-${suffix}`,
        name: `Adapter Smoke Product ${suffix}`,
      },
    });
    created.productId = product.id;

    const token = sign({ sub: "00000000-0000-0000-0000-000000000000", permissions: ["*"] }, secret);
    const auth = { Authorization: `Bearer ${token}` };
    const baseUrl = buildBaseUrl();

    const wholesale = await request(
      "wholesale.create",
      `${baseUrl}/v1/adapters/wholesale/orders`,
      {
        method: "POST",
        headers: {
          ...auth,
          "content-type": "application/json",
          "x-group-id": group.id,
          "x-subsidiary-id": subsidiary.id,
          "x-location-id": location.id,
        },
        body: JSON.stringify({
          currency: "NGN",
          items: [{ product_id: product.id, quantity: 2, unit_price: 5000 }],
        }),
      },
      201,
    );
    created.orders.push(wholesale.id);

    await request(
      "wholesale.fulfill",
      `${baseUrl}/v1/adapters/wholesale/orders/${wholesale.id}/fulfill`,
      {
        method: "POST",
        headers: {
          ...auth,
          "x-group-id": group.id,
          "x-subsidiary-id": subsidiary.id,
        },
      },
      201,
    );

    const retail = await request(
      "retail.checkout",
      `${baseUrl}/v1/adapters/retail/checkout`,
      {
        method: "POST",
        headers: {
          ...auth,
          "content-type": "application/json",
          "x-group-id": group.id,
          "x-subsidiary-id": subsidiary.id,
          "x-location-id": location.id,
        },
        body: JSON.stringify({
          order: {
            currency: "NGN",
            items: [{ product_id: product.id, quantity: 1, unit_price: 3500 }],
          },
          payment: {
            amount: 3500,
            currency: "NGN",
            provider: "manual",
            customer_email: "smoke-retail@example.com",
          },
          reserve_stock: true,
          capture_payment: true,
        }),
      },
      201,
    );
    created.orders.push(retail.order.id);
    if (retail.payment_intent?.id) created.paymentIntents.push(retail.payment_intent.id);
    if (Array.isArray(retail.reservations)) {
      created.reservations.push(...retail.reservations.map((r: any) => r.id));
    }

    const digital = await request(
      "digital.checkout",
      `${baseUrl}/v1/adapters/digital/checkout`,
      {
        method: "POST",
        headers: {
          ...auth,
          "content-type": "application/json",
          "x-group-id": group.id,
          "x-subsidiary-id": subsidiary.id,
        },
        body: JSON.stringify({
          order: {
            currency: "NGN",
            items: [{ product_id: product.id, quantity: 1, unit_price: 4200 }],
          },
          payment: {
            amount: 4200,
            currency: "NGN",
            provider: "manual",
            customer_email: "smoke-digital@example.com",
          },
          capture_payment: true,
        }),
      },
      201,
    );
    created.orders.push(digital.order.id);
    if (digital.payment_intent?.id) created.paymentIntents.push(digital.payment_intent.id);

    const onboard = await request(
      "credit.onboard",
      `${baseUrl}/v1/adapters/credit/onboard`,
      {
        method: "POST",
        headers: {
          ...auth,
          "content-type": "application/json",
          "x-group-id": group.id,
          "x-subsidiary-id": subsidiary.id,
        },
        body: JSON.stringify({
          reseller: { name: `Adapter Reseller ${suffix}`, status: "active" },
          credit: { limit_amount: 250000 },
        }),
      },
      201,
    );
    created.resellerId = onboard.reseller.id;
    created.creditAccountId = onboard.credit_account.id;

    const repayment = await request(
      "credit.repayment",
      `${baseUrl}/v1/adapters/credit/repayments`,
      {
        method: "POST",
        headers: {
          ...auth,
          "content-type": "application/json",
          "x-group-id": group.id,
          "x-subsidiary-id": subsidiary.id,
        },
        body: JSON.stringify({
          credit_account_id: onboard.credit_account.id,
          amount: 5000,
        }),
      },
      201,
    );
    created.repaymentId = repayment.id;
  } finally {
    await cleanup(prisma, created);
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("ADAPTER_SMOKE_FAILED", error);
  process.exitCode = 1;
});
