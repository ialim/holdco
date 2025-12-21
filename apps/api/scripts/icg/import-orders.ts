import { PrismaClient } from "@prisma/client";
import { parseArgs } from "./lib/args";
import { loadConfig } from "./lib/config";
import { normalize, parseCsv, parseDate, parseDecimal } from "./lib/csv";
import { findExternalIdMap, getExternalSystemId, upsertExternalIdMap } from "./lib/external-ids";
import { loadStoreLocationMap } from "./lib/store-location-map";

type OrderRow = {
  receipt_no?: string;
  store_id?: string;
  order_date?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_name?: string;
  total_amount?: string;
  currency?: string;
  status?: string;
  channel?: string;
};

async function resolveCustomerId(prisma: PrismaClient, groupId: string, row: OrderRow) {
  const email = normalize(row.customer_email);
  const phone = normalize(row.customer_phone);
  if (!email && !phone) return undefined;

  const existing = await prisma.customer.findFirst({
    where: {
      groupId,
      OR: [
        email ? { email } : undefined,
        phone ? { phone } : undefined,
      ].filter(Boolean) as Array<{ email?: string; phone?: string }>,
    },
  });

  if (existing) return existing.id;

  const name = normalize(row.customer_name) || email || phone || "Customer";
  const created = await prisma.customer.create({
    data: {
      groupId,
      name,
      email: email || undefined,
      phone: phone || undefined,
      status: "active",
    },
  });
  return created.id;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.filePath) throw new Error("Missing --file for orders import");

  const config = loadConfig(args.configPath);
  if (!config.storeLocationMapFile) {
    throw new Error("config.json is missing storeLocationMapFile for orders import");
  }

  const prisma = new PrismaClient();
  const externalSystemId = await getExternalSystemId(prisma, config.externalSystemName ?? "ICG");
  const storeMap = loadStoreLocationMap(config.storeLocationMapFile);

  const rows = parseCsv<OrderRow>(args.filePath);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const receiptNo = normalize(row.receipt_no);
    const storeId = normalize(row.store_id);
    if (!receiptNo || !storeId) {
      skipped += 1;
      continue;
    }

    const mapping = storeMap.get(storeId);
    if (!mapping) {
      console.warn(`Skipping order ${receiptNo}; store mapping not found.`);
      skipped += 1;
      continue;
    }

    const subsidiaryId = mapping.subsidiaryId ?? config.defaultSubsidiaryId;
    if (!subsidiaryId) {
      console.warn(`Skipping order ${receiptNo}; subsidiaryId missing.`);
      skipped += 1;
      continue;
    }

    const totalAmount = parseDecimal(row.total_amount);
    if (!totalAmount) {
      skipped += 1;
      continue;
    }

    const currency = normalize(row.currency) || config.defaultCurrency;
    const status = normalize(row.status) || "pending";
    const channel = normalize(row.channel) || config.channel;
    const orderDate = parseDate(row.order_date);
    const customerId = args.dryRun ? undefined : await resolveCustomerId(prisma, config.groupId, row);

    if (args.dryRun) {
      continue;
    }

    const existingMap = await findExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "order",
      externalId: receiptNo,
    });

    let orderId: string;

    if (existingMap) {
      const updatedOrder = await prisma.order.update({
        where: { id: existingMap.entityId },
        data: {
          locationId: mapping.locationId,
          subsidiaryId,
          channel,
          customerId,
          status,
          totalAmount,
          currency,
          createdAt: orderDate,
        },
      });
      orderId = updatedOrder.id;
      updated += 1;
    } else {
      const existingOrder = await prisma.order.findFirst({
        where: { groupId: config.groupId, orderNo: receiptNo },
      });

      if (existingOrder) {
        const updatedOrder = await prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            locationId: mapping.locationId,
            subsidiaryId,
            channel,
            customerId,
            status,
            totalAmount,
            currency,
            createdAt: orderDate,
          },
        });
        orderId = updatedOrder.id;
        updated += 1;
      } else {
        const createdOrder = await prisma.order.create({
          data: {
            groupId: config.groupId,
            subsidiaryId,
            locationId: mapping.locationId,
            channel,
            orderNo: receiptNo,
            customerId,
            status,
            totalAmount,
            currency,
            createdAt: orderDate,
          },
        });
        orderId = createdOrder.id;
        created += 1;
      }
    }

    await upsertExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "order",
      externalId: receiptNo,
      entityId: orderId,
    });
  }

  console.log(`Orders import complete. created=${created} updated=${updated} skipped=${skipped}`);
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
