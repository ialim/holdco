import { PrismaClient } from "@prisma/client";
import { parseArgs } from "./lib/args";
import { loadConfig } from "./lib/config";
import { normalize, parseCsv } from "./lib/csv";
import { findExternalIdMap, getExternalSystemId, upsertExternalIdMap } from "./lib/external-ids";

type BrandRow = {
  brand_code?: string;
  brand_name?: string;
  status?: string;
};

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.filePath) throw new Error("Missing --file for brands import");

  const config = loadConfig(args.configPath);
  const prisma = new PrismaClient();
  const externalSystemId = await getExternalSystemId(prisma, config.externalSystemName ?? "ICG");

  const rows = parseCsv<BrandRow>(args.filePath);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const externalId = normalize(row.brand_code || row.brand_name);
    const name = normalize(row.brand_name || row.brand_code);
    if (!externalId || !name) {
      skipped += 1;
      continue;
    }

    const status = normalize(row.status) || "active";

    if (args.dryRun) {
      continue;
    }

    const existingMap = await findExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "brand",
      externalId,
    });

    let brandId: string;

    if (existingMap) {
      const updatedBrand = await prisma.brand.update({
        where: { id: existingMap.entityId },
        data: { name, status },
      });
      brandId = updatedBrand.id;
      updated += 1;
    } else {
      const existingBrand = await prisma.brand.findFirst({
        where: { groupId: config.groupId, name },
      });
      if (existingBrand) {
        await prisma.brand.update({
          where: { id: existingBrand.id },
          data: { status },
        });
        brandId = existingBrand.id;
        updated += 1;
      } else {
        const createdBrand = await prisma.brand.create({
          data: { groupId: config.groupId, name, status },
        });
        brandId = createdBrand.id;
        created += 1;
      }
    }

    await upsertExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "brand",
      externalId,
      entityId: brandId,
    });
  }

  console.log(`Brands import complete. created=${created} updated=${updated} skipped=${skipped}`);
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
