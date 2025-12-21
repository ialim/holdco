import { PrismaClient } from "@prisma/client";
import { parseArgs } from "./lib/args";
import { loadConfig } from "./lib/config";
import { normalize, parseCsv, parseIntSafe } from "./lib/csv";
import { findExternalIdMap, getExternalSystemId } from "./lib/external-ids";
import { loadStoreLocationMap } from "./lib/store-location-map";

type InventoryRow = {
  store_id?: string;
  product_code?: string;
  variant_barcode?: string;
  qty?: string;
};

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.filePath) throw new Error("Missing --file for inventory import");

  const config = loadConfig(args.configPath);
  if (!config.storeLocationMapFile) {
    throw new Error("config.json is missing storeLocationMapFile for inventory import");
  }

  const prisma = new PrismaClient();
  const externalSystemId = await getExternalSystemId(prisma, config.externalSystemName ?? "ICG");
  const storeMap = loadStoreLocationMap(config.storeLocationMapFile);

  const rows = parseCsv<InventoryRow>(args.filePath);
  let upserts = 0;
  let skipped = 0;

  for (const row of rows) {
    const storeId = normalize(row.store_id);
    const sku = normalize(row.product_code);
    if (!storeId || !sku) {
      skipped += 1;
      continue;
    }

    const mapping = storeMap.get(storeId);
    if (!mapping) {
      console.warn(`Skipping inventory for store ${storeId}; mapping not found.`);
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
      console.warn(`Skipping inventory for product ${sku}; product not found.`);
      skipped += 1;
      continue;
    }

    const barcode = normalize(row.variant_barcode);
    const variant = barcode
      ? await prisma.variant.findFirst({ where: { groupId: config.groupId, barcode } })
      : null;

    const qty = parseIntSafe(row.qty) ?? 0;

    if (args.dryRun) {
      continue;
    }

    const subsidiaryId = mapping.subsidiaryId ?? config.defaultSubsidiaryId;
    if (!subsidiaryId) {
      console.warn(`Skipping inventory for store ${storeId}; subsidiaryId missing.`);
      skipped += 1;
      continue;
    }

    const variantId = variant?.id ?? null;
    const existingLevel = await prisma.stockLevel.findFirst({
      where: {
        groupId: config.groupId,
        subsidiaryId,
        locationId: mapping.locationId,
        productId: product.id,
        variantId,
      },
    });

    if (existingLevel) {
      await prisma.stockLevel.update({
        where: { id: existingLevel.id },
        data: { onHand: qty, reserved: 0 },
      });
    } else {
      await prisma.stockLevel.create({
        data: {
          groupId: config.groupId,
          subsidiaryId,
          locationId: mapping.locationId,
          productId: product.id,
          variantId: variant?.id ?? undefined,
          onHand: qty,
          reserved: 0,
        },
      });
    }

    upserts += 1;
  }

  console.log(`Inventory import complete. upserts=${upserts} skipped=${skipped}`);
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
