import { PrismaClient } from "@prisma/client";
import { parseArgs } from "./lib/args";
import { loadConfig } from "./lib/config";
import { normalize, parseCsv } from "./lib/csv";
import { findExternalIdMap, getExternalSystemId, upsertExternalIdMap } from "./lib/external-ids";

type VariantRow = {
  product_code?: string;
  size?: string;
  unit?: string;
  type?: string;
  barcode?: string;
};

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.filePath) throw new Error("Missing --file for variants import");

  const config = loadConfig(args.configPath);
  const prisma = new PrismaClient();
  const externalSystemId = await getExternalSystemId(prisma, config.externalSystemName ?? "ICG");

  const rows = parseCsv<VariantRow>(args.filePath);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const sku = normalize(row.product_code);
    const barcode = normalize(row.barcode);
    if (!sku || !barcode) {
      skipped += 1;
      continue;
    }

    const mappedProduct = await findExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "product",
      externalId: sku,
    });
    const product = mappedProduct
      ? await prisma.product.findUnique({ where: { id: mappedProduct.entityId } })
      : await prisma.product.findFirst({ where: { groupId: config.groupId, sku } });

    if (!product) {
      console.warn(`Skipping variant barcode=${barcode} because product ${sku} was not found.`);
      skipped += 1;
      continue;
    }

    if (args.dryRun) {
      continue;
    }

    const existingMap = await findExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "variant",
      externalId: barcode,
    });

    let variantId: string;

    if (existingMap) {
      const updatedVariant = await prisma.variant.update({
        where: { id: existingMap.entityId },
        data: {
          productId: product.id,
          size: normalize(row.size) || null,
          unit: normalize(row.unit) || null,
          type: normalize(row.type) || null,
          barcode,
        },
      });
      variantId = updatedVariant.id;
      updated += 1;
    } else {
      const existingVariant = await prisma.variant.findFirst({
        where: { groupId: config.groupId, barcode },
      });
      if (existingVariant) {
        const updatedVariant = await prisma.variant.update({
          where: { id: existingVariant.id },
          data: {
            productId: product.id,
            size: normalize(row.size) || null,
            unit: normalize(row.unit) || null,
            type: normalize(row.type) || null,
          },
        });
        variantId = updatedVariant.id;
        updated += 1;
      } else {
        const createdVariant = await prisma.variant.create({
          data: {
            groupId: config.groupId,
            productId: product.id,
            size: normalize(row.size) || null,
            unit: normalize(row.unit) || null,
            type: normalize(row.type) || null,
            barcode,
          },
        });
        variantId = createdVariant.id;
        created += 1;
      }
    }

    await upsertExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "variant",
      externalId: barcode,
      entityId: variantId,
    });
  }

  console.log(`Variants import complete. created=${created} updated=${updated} skipped=${skipped}`);
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
