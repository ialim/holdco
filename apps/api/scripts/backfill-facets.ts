import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { resolve } from "path";

const prisma = new PrismaClient();

function projectRoot() {
  return resolve(__dirname, "..");
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

async function ensureFacetDefinition(groupId: string, key: string, name: string, scope: "product" | "variant") {
  const normalizedKey = normalizeKey(key);
  return prisma.facetDefinition.upsert({
    where: { groupId_key: { groupId, key: normalizedKey } },
    update: { name, scope, dataType: "text", status: "active" },
    create: { groupId, key: normalizedKey, name, scope, dataType: "text", status: "active" },
  });
}

async function ensureFacetValue(groupId: string, facetId: string, value: string) {
  const trimmed = value.trim();
  const normalized = normalizeValue(trimmed);
  return prisma.facetValue.upsert({
    where: { facetId_normalizedValue: { facetId, normalizedValue: normalized } },
    update: { value: trimmed },
    create: {
      groupId,
      facetId,
      value: trimmed,
      normalizedValue: normalized,
    },
  });
}

async function main() {
  loadEnv({ path: resolve(projectRoot(), ".env") });

  const groups = await prisma.tenantGroup.findMany({ select: { id: true } });
  if (!groups.length) {
    console.log("No tenant groups found.");
    return;
  }

  for (const group of groups) {
    const brandFacet = await ensureFacetDefinition(group.id, "brand", "Brand", "product");
    const concentrationFacet = await ensureFacetDefinition(group.id, "concentration", "Concentration", "product");
    const sizeFacet = await ensureFacetDefinition(group.id, "size", "Size", "variant");

    const products = await prisma.product.findMany({
      where: { groupId: group.id },
      include: { brand: true },
    });

    let productFacetCount = 0;
    for (const product of products) {
      if (product.brand?.name) {
        const value = await ensureFacetValue(group.id, brandFacet.id, product.brand.name);
        await prisma.productFacet.upsert({
          where: { productId_facetValueId: { productId: product.id, facetValueId: value.id } },
          update: {},
          create: { groupId: group.id, productId: product.id, facetValueId: value.id },
        });
        productFacetCount += 1;
      }
      if (product.concentration) {
        const value = await ensureFacetValue(group.id, concentrationFacet.id, product.concentration);
        await prisma.productFacet.upsert({
          where: { productId_facetValueId: { productId: product.id, facetValueId: value.id } },
          update: {},
          create: { groupId: group.id, productId: product.id, facetValueId: value.id },
        });
        productFacetCount += 1;
      }
    }

    const variants = await prisma.variant.findMany({ where: { groupId: group.id } });
    let variantFacetCount = 0;
    for (const variant of variants) {
      if (!variant.size) continue;
      const value = await ensureFacetValue(group.id, sizeFacet.id, variant.size);
      await prisma.variantFacet.upsert({
        where: { variantId_facetValueId: { variantId: variant.id, facetValueId: value.id } },
        update: {},
        create: { groupId: group.id, variantId: variant.id, facetValueId: value.id },
      });
      variantFacetCount += 1;
    }

    console.log(`group=${group.id} product_facets=${productFacetCount} variant_facets=${variantFacetCount}`);
  }
}

main()
  .catch((error) => {
    console.error("FACET_BACKFILL_FAILED", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
