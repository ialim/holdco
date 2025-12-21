import { PrismaClient } from "@prisma/client";
import { parseArgs } from "./lib/args";
import { loadConfig } from "./lib/config";
import { normalize, parseCsv, parseDate, parseDecimal } from "./lib/csv";
import { findExternalIdMap, getExternalSystemId, upsertExternalIdMap } from "./lib/external-ids";

type PaymentRow = {
  receipt_no?: string;
  amount?: string;
  currency?: string;
  status?: string;
  provider?: string;
  reference?: string;
  payment_date?: string;
};

function buildExternalId(row: PaymentRow): string | undefined {
  const reference = normalize(row.reference);
  if (reference) return reference;
  const receiptNo = normalize(row.receipt_no);
  const amount = normalize(row.amount);
  const paymentDate = normalize(row.payment_date);
  if (!receiptNo || !amount) return undefined;
  return `${receiptNo}:${amount}:${paymentDate}`;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.filePath) throw new Error("Missing --file for payments import");

  const config = loadConfig(args.configPath);
  const prisma = new PrismaClient();
  const externalSystemId = await getExternalSystemId(prisma, config.externalSystemName ?? "ICG");

  const rows = parseCsv<PaymentRow>(args.filePath);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const receiptNo = normalize(row.receipt_no);
    if (!receiptNo) {
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
      console.warn(`Skipping payment for receipt ${receiptNo}; order not found.`);
      skipped += 1;
      continue;
    }

    const amount = parseDecimal(row.amount);
    if (!amount) {
      skipped += 1;
      continue;
    }

    const externalId = buildExternalId(row);
    if (!externalId) {
      skipped += 1;
      continue;
    }

    const currency = normalize(row.currency) || order.currency || config.defaultCurrency;
    const status = normalize(row.status) || "captured";
    const provider = normalize(row.provider) || undefined;
    const reference = normalize(row.reference) || undefined;
    const paymentDate = parseDate(row.payment_date);

    if (args.dryRun) {
      continue;
    }

    const existingMap = await findExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "payment_intent",
      externalId,
    });

    let paymentId: string;

    if (existingMap) {
      const updatedPayment = await prisma.paymentIntent.update({
        where: { id: existingMap.entityId },
        data: {
          orderId: order.id,
          amount,
          currency,
          status,
          provider,
          reference,
          createdAt: paymentDate,
        },
      });
      paymentId = updatedPayment.id;
      updated += 1;
    } else {
      const createdPayment = await prisma.paymentIntent.create({
        data: {
          groupId: order.groupId,
          subsidiaryId: order.subsidiaryId,
          orderId: order.id,
          amount,
          currency,
          status,
          provider,
          reference,
          createdAt: paymentDate,
        },
      });
      paymentId = createdPayment.id;
      created += 1;
    }

    await upsertExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "payment_intent",
      externalId,
      entityId: paymentId,
    });
  }

  console.log(`Payments import complete. created=${created} updated=${updated} skipped=${skipped}`);
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
