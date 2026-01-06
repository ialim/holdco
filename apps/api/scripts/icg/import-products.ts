import { PrismaClient } from "@prisma/client";
import { parseArgs } from "./lib/args";
import { loadConfig } from "./lib/config";
import { normalize, parseCsv } from "./lib/csv";
import { findExternalIdMap, getExternalSystemId, upsertExternalIdMap } from "./lib/external-ids";
import { applyProductFacets, FacetInput, parseFacetColumn } from "./lib/facets";

type ProductRow = {
  product_code?: string;
  name?: string;
  brand_code?: string;
  brand_name?: string;
  sex?: string;
  concentration?: string;
  type?: string;
  status?: string;
  facets?: string;
};

async function ensureBrand(params: {
  prisma: PrismaClient;
  groupId: string;
  externalSystemId: string;
  brandCode?: string;
  brandName?: string;
}): Promise<string | undefined> {
  const externalId = normalize(params.brandCode || "");
  const name = normalize(params.brandName || params.brandCode || "");
  if (!externalId && !name) return undefined;

  if (externalId) {
    const mapped = await findExternalIdMap({
      prisma: params.prisma,
      externalSystemId: params.externalSystemId,
      entityType: "brand",
      externalId,
    });
    if (mapped) return mapped.entityId;
  }

  if (!name) return undefined;

  const existing = await params.prisma.brand.findFirst({
    where: { groupId: params.groupId, name },
  });

  const brand = existing
    ? await params.prisma.brand.update({
        where: { id: existing.id },
        data: { status: "active" },
      })
    : await params.prisma.brand.create({
        data: { groupId: params.groupId, name, status: "active" },
      });

  if (externalId) {
    await upsertExternalIdMap({
      prisma: params.prisma,
      externalSystemId: params.externalSystemId,
      entityType: "brand",
      externalId,
      entityId: brand.id,
    });
  }

  return brand.id;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.filePath) throw new Error("Missing --file for products import");

  const config = loadConfig(args.configPath);
  const prisma = new PrismaClient();
  const externalSystemId = await getExternalSystemId(prisma, config.externalSystemName ?? "ICG");
  const defaultSubsidiaryId = config.defaultSubsidiaryId ?? undefined;

  const rows = parseCsv<ProductRow>(args.filePath);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const sku = normalize(row.product_code);
    const name = normalize(row.name);
    if (!sku || !name) {
      skipped += 1;
      continue;
    }

    const brandName = normalize(row.brand_name || row.brand_code);
    const status = normalize(row.status) || "active";
    const sex = normalize(row.sex) || undefined;
    const concentration = normalize(row.concentration) || undefined;
    const type = normalize(row.type) || undefined;
    const facets = parseFacetColumn(row.facets);
    const brandId = args.dryRun
      ? undefined
      : await ensureBrand({
          prisma,
          groupId: config.groupId,
          externalSystemId,
          brandCode: row.brand_code,
          brandName: row.brand_name,
        });

    if (args.dryRun) {
      continue;
    }

    const existingMap = await findExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "product",
      externalId: sku,
    });

    let productId: string;

    if (existingMap) {
      const updatedProduct = await prisma.product.update({
        where: { id: existingMap.entityId },
        data: {
          name,
          status,
          brandId,
          sex,
          concentration,
          type,
          subsidiaryId: defaultSubsidiaryId,
        },
      });
      productId = updatedProduct.id;
      updated += 1;
    } else {
      const existingProduct = await prisma.product.findFirst({
        where: { groupId: config.groupId, sku },
      });
      if (existingProduct) {
        const updatedProduct = await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            name,
            status,
            brandId,
            sex,
            concentration,
            type,
            subsidiaryId: defaultSubsidiaryId,
          },
        });
        productId = updatedProduct.id;
        updated += 1;
      } else {
        const createdProduct = await prisma.product.create({
          data: {
            groupId: config.groupId,
            subsidiaryId: defaultSubsidiaryId,
            sku,
            name,
            status,
            brandId,
            sex,
            concentration,
            type,
          },
        });
        productId = createdProduct.id;
        created += 1;
      }
    }

    const derivedFacets: FacetInput[] = [];
    if (brandName) derivedFacets.push({ key: "brand", value: brandName });
    if (concentration) derivedFacets.push({ key: "concentration", value: concentration });

    await applyProductFacets({
      prisma,
      groupId: config.groupId,
      productId,
      facets,
      derived: derivedFacets,
    });

    await upsertExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "product",
      externalId: sku,
      entityId: productId,
    });
  }

  console.log(`Products import complete. created=${created} updated=${updated} skipped=${skipped}`);
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
