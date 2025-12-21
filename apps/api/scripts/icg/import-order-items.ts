import { PrismaClient } from "@prisma/client";
import { parseArgs } from "./lib/args";
import { loadConfig } from "./lib/config";
import { normalize, parseCsv, parseDecimal, parseIntSafe } from "./lib/csv";
import { findExternalIdMap, getExternalSystemId, upsertExternalIdMap } from "./lib/external-ids";

type OrderItemRow = {
  receipt_no?: string;
  line_no?: string;
  product_code?: string;
  variant_barcode?: string;
  quantity?: string;
  unit_price?: string;
  total_price?: string;
};

function buildExternalId(row: OrderItemRow): string | undefined {
  const receiptNo = normalize(row.receipt_no);
  const lineNo = normalize(row.line_no);
  if (!receiptNo) return undefined;
  if (lineNo) return `${receiptNo}:${lineNo}`;
  const sku = normalize(row.product_code);
  const barcode = normalize(row.variant_barcode);
  return `${receiptNo}:${sku}:${barcode}`;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.filePath) throw new Error("Missing --file for order items import");

  const config = loadConfig(args.configPath);
  const prisma = new PrismaClient();
  const externalSystemId = await getExternalSystemId(prisma, config.externalSystemName ?? "ICG");

  const rows = parseCsv<OrderItemRow>(args.filePath);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const receiptNo = normalize(row.receipt_no);
    const sku = normalize(row.product_code);
    if (!receiptNo || !sku) {
      skipped += 1;
      continue;
    }

    const orderMap = await findExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "order",
      externalId: receiptNo,
    });

    const order = orderMap
      ? await prisma.order.findUnique({ where: { id: orderMap.entityId } })
      : await prisma.order.findFirst({ where: { groupId: config.groupId, orderNo: receiptNo } });

    if (!order) {
      console.warn(`Skipping order item for receipt ${receiptNo}; order not found.`);
      skipped += 1;
      continue;
    }

    const productMap = await findExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "product",
      externalId: sku,
    });

    const product = productMap
      ? await prisma.product.findUnique({ where: { id: productMap.entityId } })
      : await prisma.product.findFirst({ where: { groupId: config.groupId, sku } });

    if (!product) {
      console.warn(`Skipping order item for receipt ${receiptNo}; product ${sku} not found.`);
      skipped += 1;
      continue;
    }

    const barcode = normalize(row.variant_barcode);
    const variant = barcode
      ? await prisma.variant.findFirst({ where: { groupId: config.groupId, barcode } })
      : null;

    const quantity = parseIntSafe(row.quantity) ?? 1;
    const unitPrice = parseDecimal(row.unit_price);
    if (!unitPrice) {
      skipped += 1;
      continue;
    }

    const totalPrice = parseDecimal(row.total_price) ?? (Number(unitPrice) * quantity).toFixed(2);
    const externalId = buildExternalId(row);
    if (!externalId) {
      skipped += 1;
      continue;
    }

    if (args.dryRun) {
      continue;
    }

    const existingMap = await findExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "order_item",
      externalId,
    });

    let itemId: string;

    if (existingMap) {
      const updatedItem = await prisma.orderItem.update({
        where: { id: existingMap.entityId },
        data: {
          orderId: order.id,
          productId: product.id,
          variantId: variant?.id ?? undefined,
          quantity,
          unitPrice,
          totalPrice,
        },
      });
      itemId = updatedItem.id;
      updated += 1;
    } else {
      const createdItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          variantId: variant?.id ?? undefined,
          quantity,
          unitPrice,
          totalPrice,
        },
      });
      itemId = createdItem.id;
      created += 1;
    }

    await upsertExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "order_item",
      externalId,
      entityId: itemId,
    });
  }

  console.log(`Order items import complete. created=${created} updated=${updated} skipped=${skipped}`);
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
