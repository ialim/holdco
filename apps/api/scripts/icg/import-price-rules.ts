import { PrismaClient } from "@prisma/client";
import { parseArgs } from "./lib/args";
import { loadConfig } from "./lib/config";
import { normalize, parseCsv, parseDecimal, parseIntSafe } from "./lib/csv";
import { findExternalIdMap, getExternalSystemId } from "./lib/external-ids";

type PriceRuleRow = {
  list_name?: string;
  product_code?: string;
  variant_barcode?: string;
  price?: string;
  min_qty?: string;
};

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.filePath) throw new Error("Missing --file for price rules import");

  const config = loadConfig(args.configPath);
  const prisma = new PrismaClient();
  const externalSystemId = await getExternalSystemId(prisma, config.externalSystemName ?? "ICG");

  const rows = parseCsv<PriceRuleRow>(args.filePath);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const listName = normalize(row.list_name);
    const sku = normalize(row.product_code);
    if (!listName || !sku) {
      skipped += 1;
      continue;
    }

    const priceListMap = await findExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "price_list",
      externalId: listName,
    });

    const priceList = priceListMap
      ? await prisma.priceList.findUnique({ where: { id: priceListMap.entityId } })
      : await prisma.priceList.findFirst({ where: { groupId: config.groupId, name: listName } });

    if (!priceList) {
      console.warn(`Skipping price rule for list ${listName}; price list not found.`);
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
      console.warn(`Skipping price rule for product ${sku}; product not found.`);
      skipped += 1;
      continue;
    }

    const variantBarcode = normalize(row.variant_barcode);
    const variant = variantBarcode
      ? await prisma.variant.findFirst({ where: { groupId: config.groupId, barcode: variantBarcode } })
      : null;

    const price = parseDecimal(row.price);
    if (!price) {
      skipped += 1;
      continue;
    }

    const minQty = parseIntSafe(row.min_qty) ?? 1;

    if (args.dryRun) {
      continue;
    }

    const existingRule = await prisma.priceRule.findFirst({
      where: {
        groupId: config.groupId,
        priceListId: priceList.id,
        productId: product.id,
        variantId: variant?.id ?? null,
        minQty,
      },
    });

    if (existingRule) {
      await prisma.priceRule.update({
        where: { id: existingRule.id },
        data: {
          price,
        },
      });
      updated += 1;
    } else {
      await prisma.priceRule.create({
        data: {
          groupId: config.groupId,
          priceListId: priceList.id,
          productId: product.id,
          variantId: variant?.id ?? undefined,
          minQty,
          price,
        },
      });
      created += 1;
    }
  }

  console.log(`Price rules import complete. created=${created} updated=${updated} skipped=${skipped}`);
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
