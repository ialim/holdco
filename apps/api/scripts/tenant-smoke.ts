import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { Prisma, PrismaClient } from "@prisma/client";
import { sign } from "jsonwebtoken";

type CreatedIds = {
  productId?: string;
  orderId?: string;
  invoiceId?: string;
};

function projectRoot() {
  return resolve(__dirname, "..");
}

function buildBaseUrl() {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

async function hit(
  name: string,
  url: string,
  options: RequestInit,
  expectedStatus?: number,
) {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (error) {
    throw new Error(`Request failed for ${name}. Is the API running? ${String(error)}`);
  }

  const text = await res.text();
  console.log(`${name}: ${res.status}`);
  if (res.status >= 400) {
    console.log(`${name}.body: ${text}`);
  }

  if (expectedStatus !== undefined && res.status !== expectedStatus) {
    throw new Error(`${name} expected ${expectedStatus} but got ${res.status}`);
  }

  return res;
}

async function cleanup(prisma: PrismaClient, ids: CreatedIds) {
  if (!ids.invoiceId) return;

  await prisma.ledgerEntry.deleteMany({
    where: { sourceType: "INVOICE", sourceRef: ids.invoiceId },
  });
  await prisma.invoiceLine.deleteMany({ where: { invoiceId: ids.invoiceId } });
  await prisma.payment.deleteMany({ where: { invoiceId: ids.invoiceId } });
  await prisma.invoice.delete({ where: { id: ids.invoiceId } });

  if (ids.orderId) {
    await prisma.orderItem.deleteMany({ where: { orderId: ids.orderId } });
    await prisma.order.delete({ where: { id: ids.orderId } });
  }

  if (ids.productId) {
    await prisma.product.delete({ where: { id: ids.productId } });
  }
}

async function main() {
  loadEnv({ path: resolve(projectRoot(), ".env") });

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set in apps/api/.env");

  const prisma = new PrismaClient();
  const created: CreatedIds = {};

  try {
    const group = await prisma.tenantGroup.findFirst({ orderBy: { createdAt: "asc" } });
    if (!group) throw new Error("No tenant group found. Run `npm --prefix apps/api run prisma:seed`.");

    const subsidiaries = await prisma.subsidiary.findMany({
      where: { groupId: group.id },
      orderBy: { createdAt: "asc" },
      take: 2,
    });
    if (subsidiaries.length < 2) {
      throw new Error("Need at least two subsidiaries in the group for the smoke test.");
    }

    const [seller, buyer] = subsidiaries;
    const suffix = Date.now();

    const product = await prisma.product.create({
      data: {
        groupId: group.id,
        subsidiaryId: seller.id,
        sku: `SMOKE-${suffix}`,
        name: `Smoke Test Product ${suffix}`,
      },
    });
    created.productId = product.id;

    const order = await prisma.order.create({
      data: {
        groupId: group.id,
        subsidiaryId: seller.id,
        orderNo: `SMOKE-ORD-${suffix}`,
        totalAmount: new Prisma.Decimal("100.00"),
        currency: "NGN",
        items: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              unitPrice: new Prisma.Decimal("100.00"),
              totalPrice: new Prisma.Decimal("100.00"),
            },
          ],
        },
      },
      include: { items: true },
    });
    created.orderId = order.id;

    const now = new Date();
    const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const dueDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceType: "INTERCOMPANY",
        status: "DRAFT",
        sellerCompanyId: seller.id,
        buyerCompanyId: buyer.id,
        period,
        issueDate: now,
        dueDate,
        subtotal: new Prisma.Decimal("100.00"),
        vatAmount: new Prisma.Decimal("7.50"),
        totalAmount: new Prisma.Decimal("107.50"),
      },
    });
    created.invoiceId = invoice.id;

    const token = sign({ sub: "tenant-smoke", permissions: ["*"] }, secret);
    const authHeader = { Authorization: `Bearer ${token}` };
    const baseUrl = buildBaseUrl();
    const wrongGroupId = "00000000-0000-0000-0000-000000000000";

    await hit(
      "orders.get.correct",
      `${baseUrl}/v1/orders/${order.id}`,
      { headers: { ...authHeader, "x-group-id": group.id, "x-subsidiary-id": seller.id } },
      200,
    );

    await hit(
      "orders.get.wrongGroup",
      `${baseUrl}/v1/orders/${order.id}`,
      { headers: { ...authHeader, "x-group-id": wrongGroupId, "x-subsidiary-id": seller.id } },
      404,
    );

    await hit(
      "orders.fulfill.wrongGroup",
      `${baseUrl}/v1/orders/${order.id}/fulfill`,
      {
        method: "POST",
        headers: { ...authHeader, "x-group-id": wrongGroupId, "x-subsidiary-id": seller.id },
      },
      404,
    );

    await hit(
      "finance.issue.wrongGroup",
      `${baseUrl}/v1/finance/invoices/${invoice.id}/issue`,
      { method: "POST", headers: { ...authHeader, "x-group-id": wrongGroupId } },
      404,
    );

    await hit(
      "finance.issue.correct",
      `${baseUrl}/v1/finance/invoices/${invoice.id}/issue`,
      { method: "POST", headers: { ...authHeader, "x-group-id": group.id } },
      201,
    );
  } finally {
    await cleanup(prisma, created);
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("SMOKE_TEST_FAILED", error);
  process.exitCode = 1;
});
