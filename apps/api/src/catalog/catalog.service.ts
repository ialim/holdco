import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { CreateFacetDefinitionDto } from "./dto/create-facet-definition.dto";
import { CreateFacetValueDto } from "./dto/create-facet-value.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateVariantDto } from "./dto/create-variant.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateVariantDto } from "./dto/update-variant.dto";
import { FacetInputDto } from "./dto/facet-input.dto";

type NormalizedFacetInput = {
  key: string;
  normalizedKey: string;
  value: string;
  normalizedValue: string;
};

type FacetFilter = {
  normalizedKey: string;
  normalizedValue: string;
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listBrands(groupId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const where = {
      groupId,
      ...(query.q
        ? {
            name: {
              contains: query.q,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const [total, brands] = await this.prisma.$transaction([
      this.prisma.brand.count({ where }),
      this.prisma.brand.findMany({ where, orderBy: { name: "asc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
    ]);

    return {
      data: brands.map(this.mapBrand),
      meta: this.buildMeta(query, total),
    };
  }

  async createBrand(groupId: string, body: CreateBrandDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const brand = await this.prisma.brand.create({
      data: {
        groupId,
        name: body.name,
      },
    });

    return this.mapBrand(brand);
  }

  async listSuppliers(groupId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const where = {
      groupId,
      ...(query.q
        ? {
            name: {
              contains: query.q,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const [total, suppliers] = await this.prisma.$transaction([
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.findMany({ where, orderBy: { name: "asc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
    ]);

    return {
      data: suppliers.map(this.mapSupplier),
      meta: this.buildMeta(query, total),
    };
  }

  async createSupplier(groupId: string, body: CreateSupplierDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const supplier = await this.prisma.supplier.create({
      data: {
        groupId,
        name: body.name,
        contactName: body.contact_name,
        contactPhone: body.contact_phone,
      },
    });

    return this.mapSupplier(supplier);
  }

  async listFacetDefinitions(groupId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const where = {
      groupId,
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" as const } },
              { key: { contains: query.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, facets] = await this.prisma.$transaction([
      this.prisma.facetDefinition.count({ where }),
      this.prisma.facetDefinition.findMany({
        where,
        orderBy: { name: "asc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: facets.map(this.mapFacetDefinition),
      meta: this.buildMeta(query, total),
    };
  }

  async createFacetDefinition(groupId: string, body: CreateFacetDefinitionDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const key = this.normalizeFacetKey(body.key);
    const name = body.name.trim();

    const facet = await this.prisma.facetDefinition.create({
      data: {
        groupId,
        key,
        name,
        scope: body.scope ?? "product",
        dataType: body.data_type ?? "text",
      },
    });

    return this.mapFacetDefinition(facet);
  }

  async listFacetValues(groupId: string, facetId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const facet = await this.prisma.facetDefinition.findFirst({
      where: { id: facetId, groupId },
    });
    if (!facet) throw new NotFoundException("Facet not found");

    const where = {
      groupId,
      facetId,
      ...(query.q
        ? {
            value: {
              contains: query.q,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const [total, values] = await this.prisma.$transaction([
      this.prisma.facetValue.count({ where }),
      this.prisma.facetValue.findMany({
        where,
        orderBy: { value: "asc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: values.map((value) => this.mapFacetValue(value, facet)),
      meta: this.buildMeta(query, total),
    };
  }

  async createFacetValue(groupId: string, facetId: string, body: CreateFacetValueDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const facet = await this.prisma.facetDefinition.findFirst({
      where: { id: facetId, groupId },
    });
    if (!facet) throw new NotFoundException("Facet not found");

    const value = body.value.trim();
    const normalizedValue = this.normalizeFacetValue(value);

    const facetValue = await this.prisma.facetValue.upsert({
      where: { facetId_normalizedValue: { facetId, normalizedValue } },
      create: {
        groupId,
        facetId,
        value,
        normalizedValue,
      },
      update: {},
    });

    return this.mapFacetValue(facetValue, facet);
  }

  async listProducts(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where: Prisma.ProductWhereInput = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const andFilters: Prisma.ProductWhereInput[] = [];

    if (query.barcode) {
      andFilters.push({ variants: { some: { barcode: query.barcode } } });
    } else if (query.q) {
      andFilters.push({
        OR: [
          { name: { contains: query.q, mode: "insensitive" as const } },
          { sku: { contains: query.q, mode: "insensitive" as const } },
        ],
      });
    }

    const facetFilters = this.parseFacetFilters(query.facets);
    for (const filter of facetFilters) {
      andFilters.push({
        facets: {
          some: {
            facetValue: {
              normalizedValue: filter.normalizedValue,
              facet: { key: filter.normalizedKey },
            },
          },
        },
      });
    }

    if (andFilters.length) {
      where.AND = andFilters;
    }

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: {
          facets: { include: { facetValue: { include: { facet: true } } } },
        },
      }),
    ]);

    return {
      data: products.map(this.mapProduct),
      meta: this.buildMeta(query, total),
    };
  }

  async createProduct(groupId: string, subsidiaryId: string, body: CreateProductDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    return this.prisma.$transaction(async (tx) => {
      const brand = body.brand_id
        ? await tx.brand.findFirst({ where: { id: body.brand_id, groupId } })
        : null;

      if (body.brand_id && !brand) {
        throw new BadRequestException("Brand not found");
      }

      const product = await tx.product.create({
        data: {
          groupId,
          subsidiaryId,
          sku: body.sku,
          name: body.name,
          brandId: body.brand_id,
          sex: body.sex,
          concentration: body.concentration,
          type: body.type,
        },
      });

      const derivedFacets: FacetInputDto[] = [];
      if (brand) derivedFacets.push({ key: "brand", value: brand.name });
      if (body.concentration) derivedFacets.push({ key: "concentration", value: body.concentration });

      const facetInputs = this.mergeFacetInputs(body.facets, derivedFacets);
      await this.applyProductFacets(tx, groupId, product.id, facetInputs, "all");

      const stored = await tx.product.findUnique({
        where: { id: product.id },
        include: {
          facets: { include: { facetValue: { include: { facet: true } } } },
        },
      });

      return this.mapProduct(stored ?? product);
    });
  }

  async getProduct(groupId: string, subsidiaryId: string, productId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const product = await this.prisma.product.findFirst({
      where: { id: productId, groupId, subsidiaryId },
      include: { facets: { include: { facetValue: { include: { facet: true } } } } },
    });

    if (!product) throw new NotFoundException("Product not found");

    return this.mapProduct(product);
  }

  async updateProduct(groupId: string, subsidiaryId: string, productId: string, body: UpdateProductDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.product.findFirst({
        where: { id: productId, groupId, subsidiaryId },
      });

      if (!existing) throw new NotFoundException("Product not found");

      const brand = body.brand_id
        ? await tx.brand.findFirst({ where: { id: body.brand_id, groupId } })
        : null;

      if (body.brand_id && !brand) {
        throw new BadRequestException("Brand not found");
      }

      const data: Prisma.ProductUpdateInput = {};
      if (body.sku !== undefined) data.sku = body.sku;
      if (body.name !== undefined) data.name = body.name;
      if (body.brand_id !== undefined) {
        data.brand = { connect: { id: body.brand_id } };
      }
      if (body.sex !== undefined) data.sex = body.sex;
      if (body.concentration !== undefined) data.concentration = body.concentration;
      if (body.type !== undefined) data.type = body.type;

      if (Object.keys(data).length) {
        await tx.product.update({
          where: { id: productId },
          data,
        });
      }

      const derivedFacets: FacetInputDto[] = [];
      if (body.brand_id !== undefined && brand) {
        derivedFacets.push({ key: "brand", value: brand.name });
      }
      if (body.concentration !== undefined && body.concentration) {
        derivedFacets.push({ key: "concentration", value: body.concentration });
      }

      if (body.facets) {
        const facetInputs = this.mergeFacetInputs(body.facets, derivedFacets);
        await this.applyProductFacets(tx, groupId, productId, facetInputs, "all");
      } else if (derivedFacets.length) {
        const facetInputs = this.mergeFacetInputs([], derivedFacets);
        await this.applyProductFacets(tx, groupId, productId, facetInputs, "keys");
      }

      const stored = await tx.product.findUnique({
        where: { id: productId },
        include: {
          facets: { include: { facetValue: { include: { facet: true } } } },
        },
      });

      return stored ? this.mapProduct(stored) : this.mapProduct(existing);
    });
  }

  async listVariants(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where: Prisma.VariantWhereInput = {
      groupId,
      subsidiaryId,
      ...(query.barcode ? { barcode: query.barcode } : {}),
    };

    const andFilters: Prisma.VariantWhereInput[] = [];
    const facetFilters = this.parseFacetFilters(query.facets);
    for (const filter of facetFilters) {
      andFilters.push({
        facets: {
          some: {
            facetValue: {
              normalizedValue: filter.normalizedValue,
              facet: { key: filter.normalizedKey },
            },
          },
        },
      });
    }

    if (andFilters.length) {
      where.AND = andFilters;
    }

    const [total, variants] = await this.prisma.$transaction([
      this.prisma.variant.count({ where }),
      this.prisma.variant.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: {
          facets: { include: { facetValue: { include: { facet: true } } } },
        },
      }),
    ]);

    return {
      data: variants.map(this.mapVariant),
      meta: this.buildMeta(query, total),
    };
  }

  async createVariant(groupId: string, subsidiaryId: string, body: CreateVariantDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.variant.create({
        data: {
          groupId,
          subsidiaryId,
          productId: body.product_id,
          size: body.size,
          unit: body.unit,
          barcode: body.barcode,
        },
      });

      const derivedFacets: FacetInputDto[] = [];
      if (body.size) derivedFacets.push({ key: "size", value: body.size });

      const facetInputs = this.mergeFacetInputs(body.facets, derivedFacets);
      await this.applyVariantFacets(tx, groupId, variant.id, facetInputs, "all");

      const stored = await tx.variant.findUnique({
        where: { id: variant.id },
        include: {
          facets: { include: { facetValue: { include: { facet: true } } } },
        },
      });

      return this.mapVariant(stored ?? variant);
    });
  }

  async updateVariant(groupId: string, subsidiaryId: string, variantId: string, body: UpdateVariantDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.variant.findFirst({
        where: { id: variantId, groupId, subsidiaryId },
      });

      if (!existing) throw new NotFoundException("Variant not found");

      const data: Prisma.VariantUpdateInput = {};
      if (body.size !== undefined) data.size = body.size;
      if (body.unit !== undefined) data.unit = body.unit;
      if (body.barcode !== undefined) data.barcode = body.barcode;

      if (Object.keys(data).length) {
        await tx.variant.update({
          where: { id: variantId },
          data,
        });
      }

      const derivedFacets: FacetInputDto[] = [];
      if (body.size !== undefined && body.size) {
        derivedFacets.push({ key: "size", value: body.size });
      }

      if (body.facets) {
        const facetInputs = this.mergeFacetInputs(body.facets, derivedFacets);
        await this.applyVariantFacets(tx, groupId, variantId, facetInputs, "all");
      } else if (derivedFacets.length) {
        const facetInputs = this.mergeFacetInputs([], derivedFacets);
        await this.applyVariantFacets(tx, groupId, variantId, facetInputs, "keys");
      }

      const stored = await tx.variant.findUnique({
        where: { id: variantId },
        include: {
          facets: { include: { facetValue: { include: { facet: true } } } },
        },
      });

      return stored ? this.mapVariant(stored) : this.mapVariant(existing);
    });
  }

  private normalizeFacetKey(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, "_");
  }

  private normalizeFacetValue(value: string) {
    return value.trim().toLowerCase();
  }

  private parseFacetFilters(raw?: string): FacetFilter[] {
    if (!raw) return [];
    const tokens = raw
      .split("|")
      .flatMap((token) => token.split(","))
      .map((token) => token.trim())
      .filter(Boolean);

    const results: FacetFilter[] = [];
    const seen = new Set<string>();

    for (const token of tokens) {
      const parts = token.split("=");
      if (parts.length < 2) {
        throw new BadRequestException("Facet filters must use key=value format");
      }

      const key = parts.shift()?.trim() ?? "";
      const value = parts.join("=").trim();
      if (!key || !value) {
        throw new BadRequestException("Facet filters must use key=value format");
      }

      const normalizedKey = this.normalizeFacetKey(key);
      const normalizedValue = this.normalizeFacetValue(value);
      const dedupeKey = `${normalizedKey}:${normalizedValue}`;

      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      results.push({ normalizedKey, normalizedValue });
    }

    return results;
  }

  private normalizeFacetInputs(inputs: FacetInputDto[]): NormalizedFacetInput[] {
    const results: NormalizedFacetInput[] = [];
    const seen = new Set<string>();

    for (const input of inputs) {
      const rawKey = input.key?.trim();
      const rawValue = input.value?.trim();
      if (!rawKey || !rawValue) {
        throw new BadRequestException("Facet key and value are required");
      }

      const normalizedKey = this.normalizeFacetKey(rawKey);
      const normalizedValue = this.normalizeFacetValue(rawValue);
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

  private mergeFacetInputs(explicit?: FacetInputDto[], derived: FacetInputDto[] = []) {
    const normalizedExplicit = explicit?.length ? this.normalizeFacetInputs(explicit) : [];
    const explicitKeys = new Set(normalizedExplicit.map((item) => item.normalizedKey));
    const filteredDerived = derived.filter((item) => !explicitKeys.has(this.normalizeFacetKey(item.key)));
    const normalizedDerived = filteredDerived.length ? this.normalizeFacetInputs(filteredDerived) : [];

    return [...normalizedExplicit, ...normalizedDerived];
  }

  private async resolveFacetDefinitions(
    tx: Prisma.TransactionClient,
    groupId: string,
    keys: string[],
    scope: "product" | "variant",
    allowCreateKeys: Set<string>,
  ) {
    if (!keys.length) return new Map<string, { id: string; key: string; name: string; scope: string; status: string }>();

    const existing = await tx.facetDefinition.findMany({
      where: { groupId, key: { in: keys } },
    });
    const byKey = new Map(existing.map((item) => [item.key, item]));

    const missing = keys.filter((key) => !byKey.has(key));
    for (const key of missing) {
      if (!allowCreateKeys.has(key)) continue;
      const created = await tx.facetDefinition.create({
        data: {
          groupId,
          key,
          name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          scope,
          dataType: "text",
        },
      });
      byKey.set(created.key, created);
    }

    const unresolved = keys.filter((key) => !byKey.has(key));
    if (unresolved.length) {
      throw new BadRequestException(`Unknown facet keys: ${unresolved.join(", ")}`);
    }

    for (const facet of byKey.values()) {
      if (facet.scope !== scope) {
        throw new BadRequestException(`Facet ${facet.key} is not scoped to ${scope}`);
      }
      if (facet.status !== "active") {
        throw new BadRequestException(`Facet ${facet.key} is not active`);
      }
    }

    return byKey;
  }

  private async applyProductFacets(
    tx: Prisma.TransactionClient,
    groupId: string,
    productId: string,
    inputs: NormalizedFacetInput[],
    mode: "all" | "keys",
  ) {
    if (mode === "all") {
      await tx.productFacet.deleteMany({ where: { productId } });
    }

    if (!inputs.length) {
      return;
    }

    const keys = Array.from(new Set(inputs.map((item) => item.normalizedKey)));
    const definitions = await this.resolveFacetDefinitions(tx, groupId, keys, "product", new Set(["brand", "concentration"]));

    if (mode === "keys") {
      const facetIds = Array.from(definitions.values()).map((def) => def.id);
      await tx.productFacet.deleteMany({
        where: { productId, facetValue: { facetId: { in: facetIds } } },
      });
    }

    for (const input of inputs) {
      const definition = definitions.get(input.normalizedKey);
      if (!definition) continue;

      const facetValue = await tx.facetValue.upsert({
        where: { facetId_normalizedValue: { facetId: definition.id, normalizedValue: input.normalizedValue } },
        create: {
          groupId,
          facetId: definition.id,
          value: input.value,
          normalizedValue: input.normalizedValue,
        },
        update: {},
      });

      await tx.productFacet.upsert({
        where: { productId_facetValueId: { productId, facetValueId: facetValue.id } },
        create: {
          groupId,
          productId,
          facetValueId: facetValue.id,
        },
        update: {},
      });
    }
  }

  private async applyVariantFacets(
    tx: Prisma.TransactionClient,
    groupId: string,
    variantId: string,
    inputs: NormalizedFacetInput[],
    mode: "all" | "keys",
  ) {
    if (mode === "all") {
      await tx.variantFacet.deleteMany({ where: { variantId } });
    }

    if (!inputs.length) {
      return;
    }

    const keys = Array.from(new Set(inputs.map((item) => item.normalizedKey)));
    const definitions = await this.resolveFacetDefinitions(tx, groupId, keys, "variant", new Set(["size"]));

    if (mode === "keys") {
      const facetIds = Array.from(definitions.values()).map((def) => def.id);
      await tx.variantFacet.deleteMany({
        where: { variantId, facetValue: { facetId: { in: facetIds } } },
      });
    }

    for (const input of inputs) {
      const definition = definitions.get(input.normalizedKey);
      if (!definition) continue;

      const facetValue = await tx.facetValue.upsert({
        where: { facetId_normalizedValue: { facetId: definition.id, normalizedValue: input.normalizedValue } },
        create: {
          groupId,
          facetId: definition.id,
          value: input.value,
          normalizedValue: input.normalizedValue,
        },
        update: {},
      });

      await tx.variantFacet.upsert({
        where: { variantId_facetValueId: { variantId, facetValueId: facetValue.id } },
        create: {
          groupId,
          variantId,
          facetValueId: facetValue.id,
        },
        update: {},
      });
    }
  }

  private mapBrand(brand: { id: string; name: string; createdAt: Date }) {
    return {
      id: brand.id,
      name: brand.name,
      created_at: brand.createdAt.toISOString(),
    };
  }

  private mapSupplier(supplier: { id: string; name: string; contactName: string | null; contactPhone: string | null; createdAt: Date }) {
    return {
      id: supplier.id,
      name: supplier.name,
      contact_name: supplier.contactName ?? undefined,
      contact_phone: supplier.contactPhone ?? undefined,
      created_at: supplier.createdAt.toISOString(),
    };
  }

  private mapFacetDefinition(facet: {
    id: string;
    key: string;
    name: string;
    scope: string;
    dataType: string;
    status: string;
    createdAt: Date;
  }) {
    return {
      id: facet.id,
      key: facet.key,
      name: facet.name,
      scope: facet.scope,
      data_type: facet.dataType,
      status: facet.status,
      created_at: facet.createdAt.toISOString(),
    };
  }

  private mapFacetValue(
    value: { id: string; value: string; createdAt: Date },
    facet: { id: string; key: string; name: string },
  ) {
    return {
      id: value.id,
      facet_id: facet.id,
      key: facet.key,
      name: facet.name,
      value: value.value,
      created_at: value.createdAt.toISOString(),
    };
  }

  private mapFacetAssignments(
    facets?: { facetValue: { id: string; value: string; facet: { id: string; key: string; name: string } } }[],
  ) {
    if (!facets?.length) return undefined;
    return facets.map((item) => ({
      facet_id: item.facetValue.facet.id,
      key: item.facetValue.facet.key,
      name: item.facetValue.facet.name,
      value_id: item.facetValue.id,
      value: item.facetValue.value,
    }));
  }

  private mapProduct(product: {
    id: string;
    sku: string;
    name: string;
    brandId: string | null;
    sex: string | null;
    concentration: string | null;
    type: string | null;
    status: string;
    createdAt: Date;
    facets?: {
      facetValue: {
        id: string;
        value: string;
        facet: { id: string; key: string; name: string };
      };
    }[];
  }) {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      brand_id: product.brandId ?? undefined,
      sex: product.sex ?? undefined,
      concentration: product.concentration ?? undefined,
      type: product.type ?? undefined,
      status: product.status,
      created_at: product.createdAt.toISOString(),
      facets: this.mapFacetAssignments(product.facets),
    };
  }

  private mapVariant(variant: {
    id: string;
    productId: string;
    size: string | null;
    unit: string | null;
    barcode: string | null;
    facets?: {
      facetValue: {
        id: string;
        value: string;
        facet: { id: string; key: string; name: string };
      };
    }[];
  }) {
    return {
      id: variant.id,
      product_id: variant.productId,
      size: variant.size ?? undefined,
      unit: variant.unit ?? undefined,
      barcode: variant.barcode ?? undefined,
      facets: this.mapFacetAssignments(variant.facets),
    };
  }

  private buildMeta(query: ListQueryDto, total: number) {
    return {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      total,
    };
  }
}
