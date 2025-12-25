import { PrismaClient } from "@prisma/client";
import { normalize } from "./csv";

export type FacetInput = {
  key: string;
  value: string;
};

type NormalizedFacetInput = {
  key: string;
  normalizedKey: string;
  value: string;
  normalizedValue: string;
};

export function parseFacetColumn(raw?: string): FacetInput[] {
  const trimmed = normalize(raw);
  if (!trimmed) return [];

  const tokens = trimmed.split("|").map((token) => token.trim()).filter(Boolean);
  const results: FacetInput[] = [];

  for (const token of tokens) {
    const parts = token.split("=");
    if (parts.length < 2) {
      throw new Error(`Invalid facet entry "${token}". Expected key=value.`);
    }
    const key = parts.shift()?.trim() ?? "";
    const value = parts.join("=").trim();
    if (!key || !value) {
      throw new Error(`Invalid facet entry "${token}". Expected key=value.`);
    }
    results.push({ key, value });
  }

  return results;
}

function normalizeFacetKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeFacetValue(value: string) {
  return value.trim().toLowerCase();
}

function humanizeKey(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeFacetInputs(inputs: FacetInput[]) {
  const results: NormalizedFacetInput[] = [];
  const seen = new Set<string>();

  for (const input of inputs) {
    const rawKey = input.key?.trim();
    const rawValue = input.value?.trim();
    if (!rawKey || !rawValue) {
      throw new Error("Facet key and value are required.");
    }

    const normalizedKey = normalizeFacetKey(rawKey);
    const normalizedValue = normalizeFacetValue(rawValue);
    const dedupeKey = `${normalizedKey}:${normalizedValue}`;
    if (seen.has(dedupeKey)) continue;

    seen.add(dedupeKey);
    results.push({
      key: normalizedKey,
      normalizedKey,
      value: rawValue,
      normalizedValue,
    });
  }

  return results;
}

function mergeFacetInputs(explicit: FacetInput[], derived: FacetInput[]) {
  const normalizedExplicit = explicit.length ? normalizeFacetInputs(explicit) : [];
  const explicitKeys = new Set(normalizedExplicit.map((item) => item.normalizedKey));
  const filteredDerived = derived.filter((item) => !explicitKeys.has(normalizeFacetKey(item.key)));
  const normalizedDerived = filteredDerived.length ? normalizeFacetInputs(filteredDerived) : [];
  return [...normalizedExplicit, ...normalizedDerived];
}

async function ensureFacetDefinition(
  prisma: PrismaClient,
  groupId: string,
  key: string,
  scope: "product" | "variant",
) {
  const normalizedKey = normalizeFacetKey(key);
  const existing = await prisma.facetDefinition.findUnique({
    where: { groupId_key: { groupId, key: normalizedKey } },
  });

  if (existing) {
    if (existing.scope !== scope) {
      throw new Error(`Facet ${normalizedKey} already exists with scope ${existing.scope}.`);
    }
    if (existing.status !== "active") {
      await prisma.facetDefinition.update({
        where: { id: existing.id },
        data: { status: "active" },
      });
    }
    return existing;
  }

  return prisma.facetDefinition.create({
    data: {
      groupId,
      key: normalizedKey,
      name: humanizeKey(normalizedKey),
      scope,
      dataType: "text",
      status: "active",
    },
  });
}

async function upsertFacetValue(
  prisma: PrismaClient,
  groupId: string,
  facetId: string,
  value: string,
) {
  const normalizedValue = normalizeFacetValue(value);
  return prisma.facetValue.upsert({
    where: { facetId_normalizedValue: { facetId, normalizedValue } },
    update: { value },
    create: {
      groupId,
      facetId,
      value,
      normalizedValue,
    },
  });
}

export async function applyProductFacets(params: {
  prisma: PrismaClient;
  groupId: string;
  productId: string;
  facets: FacetInput[];
  derived: FacetInput[];
}) {
  const inputs = mergeFacetInputs(params.facets, params.derived);
  if (!inputs.length) return;

  const keys = Array.from(new Set(inputs.map((item) => item.normalizedKey)));
  const definitions = new Map<string, { id: string; key: string }>();

  for (const key of keys) {
    const definition = await ensureFacetDefinition(params.prisma, params.groupId, key, "product");
    definitions.set(definition.key, definition);
  }

  const facetIds = Array.from(definitions.values()).map((def) => def.id);
  await params.prisma.productFacet.deleteMany({
    where: { productId: params.productId, facetValue: { facetId: { in: facetIds } } },
  });

  for (const input of inputs) {
    const definition = definitions.get(input.normalizedKey);
    if (!definition) continue;
    const facetValue = await upsertFacetValue(params.prisma, params.groupId, definition.id, input.value);
    await params.prisma.productFacet.upsert({
      where: { productId_facetValueId: { productId: params.productId, facetValueId: facetValue.id } },
      update: {},
      create: { groupId: params.groupId, productId: params.productId, facetValueId: facetValue.id },
    });
  }
}

export async function applyVariantFacets(params: {
  prisma: PrismaClient;
  groupId: string;
  variantId: string;
  facets: FacetInput[];
  derived: FacetInput[];
}) {
  const inputs = mergeFacetInputs(params.facets, params.derived);
  if (!inputs.length) return;

  const keys = Array.from(new Set(inputs.map((item) => item.normalizedKey)));
  const definitions = new Map<string, { id: string; key: string }>();

  for (const key of keys) {
    const definition = await ensureFacetDefinition(params.prisma, params.groupId, key, "variant");
    definitions.set(definition.key, definition);
  }

  const facetIds = Array.from(definitions.values()).map((def) => def.id);
  await params.prisma.variantFacet.deleteMany({
    where: { variantId: params.variantId, facetValue: { facetId: { in: facetIds } } },
  });

  for (const input of inputs) {
    const definition = definitions.get(input.normalizedKey);
    if (!definition) continue;
    const facetValue = await upsertFacetValue(params.prisma, params.groupId, definition.id, input.value);
    await params.prisma.variantFacet.upsert({
      where: { variantId_facetValueId: { variantId: params.variantId, facetValueId: facetValue.id } },
      update: {},
      create: { groupId: params.groupId, variantId: params.variantId, facetValueId: facetValue.id },
    });
  }
}
