import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SubsidiaryRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { CreateFacetDefinitionDto } from "./dto/create-facet-definition.dto";
import { CreateFacetValueDto } from "./dto/create-facet-value.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateVariantDto } from "./dto/create-variant.dto";
import { ListCategoryQueryDto } from "./dto/list-category-query.dto";
import { PublishVariantAssortmentDto } from "./dto/publish-variant-assortment.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateVariantDto } from "./dto/update-variant.dto";
import { WithdrawVariantAssortmentDto } from "./dto/withdraw-variant-assortment.dto";
import { FacetInputDto } from "./dto/facet-input.dto";
import { CategoryFilterGroupDto } from "./dto/category-filter.dto";

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

type CategoryFilter = {
  key: string;
  value: string;
};

type CategoryFilterGroup = {
  all: CategoryFilter[];
};

type NormalizedCategoryFilter = {
  normalizedKey: string;
  normalizedValue: string;
};

type NormalizedCategoryFilterGroup = {
  all: NormalizedCategoryFilter[];
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
      data: brands.map((brand) => this.mapBrand(brand)),
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
      data: suppliers.map((supplier) => this.mapSupplier(supplier)),
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
      data: facets.map((facet) => this.mapFacetDefinition(facet)),
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

    const subsidiary = await this.getSubsidiary(groupId, subsidiaryId);

    const where: Prisma.ProductWhereInput = {
      groupId,
      ...(query.status ? { status: query.status } : {}),
    };

    const andFilters: Prisma.ProductWhereInput[] = [];
    if (this.isTradingSubsidiary(subsidiary)) {
      andFilters.push({ OR: [{ subsidiaryId }, { subsidiaryId: null }] });
    } else {
      andFilters.push({
        variants: {
          some: {
            assortments: { some: { subsidiaryId, status: "active" } },
          },
        },
      });
    }

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
      data: products.map((product) => this.mapProduct(product)),
      meta: this.buildMeta(query, total),
    };
  }

  async listCategories(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where: Prisma.CategoryWhereInput = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" as const } },
              { code: { contains: query.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, categories] = await this.prisma.$transaction([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        skip: query.offset ?? 0,
        take: query.limit ?? 100,
      }),
    ]);

    return {
      data: categories.map((category) => this.mapCategory(category)),
      meta: this.buildMeta(query, total),
    };
  }

  async createCategory(groupId: string, subsidiaryId: string, body: CreateCategoryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const productFilters = this.prepareCategoryFilters(body.product_filters);
    const variantFilters = this.prepareCategoryFilters(body.variant_filters);

    const category = await this.prisma.category.create({
      data: {
        groupId,
        subsidiaryId,
        code: body.code.trim(),
        name: body.name.trim(),
        description: body.description?.trim() || undefined,
        status: body.status ?? "active",
        sortOrder: body.sort_order ?? 0,
        productFilters,
        variantFilters,
      },
    });

    return this.mapCategory(category);
  }

  async getCategory(groupId: string, subsidiaryId: string, categoryId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, groupId, subsidiaryId },
    });
    if (!category) throw new NotFoundException("Category not found");
    return this.mapCategory(category);
  }

  async updateCategory(groupId: string, subsidiaryId: string, categoryId: string, body: UpdateCategoryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const existing = await this.prisma.category.findFirst({
      where: { id: categoryId, groupId, subsidiaryId },
    });
    if (!existing) throw new NotFoundException("Category not found");

    const productFilters =
      body.product_filters !== undefined ? this.prepareCategoryFilters(body.product_filters) : undefined;
    const variantFilters =
      body.variant_filters !== undefined ? this.prepareCategoryFilters(body.variant_filters) : undefined;

    const category = await this.prisma.category.update({
      where: { id: existing.id },
      data: {
        code: body.code?.trim(),
        name: body.name?.trim(),
        description: body.description?.trim(),
        status: body.status,
        sortOrder: body.sort_order,
        productFilters,
        variantFilters,
      },
    });

    return this.mapCategory(category);
  }

  async listCategoryProductsById(
    groupId: string,
    subsidiaryId: string,
    categoryId: string,
    query: ListQueryDto,
  ) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, groupId, subsidiaryId, status: "active" },
    });
    if (!category) throw new NotFoundException("Category not found");

    const subsidiary = await this.getSubsidiary(groupId, subsidiaryId);
    const where: Prisma.ProductWhereInput = {
      groupId,
      ...(query.status ? { status: query.status } : {}),
    };

    const andFilters: Prisma.ProductWhereInput[] = [];
    if (this.isTradingSubsidiary(subsidiary)) {
      andFilters.push({ OR: [{ subsidiaryId }, { subsidiaryId: null }] });
    } else {
      andFilters.push({
        variants: {
          some: {
            assortments: { some: { subsidiaryId, status: "active" } },
          },
        },
      });
    }

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

    const categoryOr = this.buildCategoryProductOr(category);
    if (categoryOr.length) {
      andFilters.push({ OR: categoryOr });
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
      data: products.map((product) => this.mapProduct(product)),
      meta: this.buildMeta(query, total),
    };
  }

  async listCategoryProducts(groupId: string, subsidiaryId: string, query: ListCategoryQueryDto) {
    const facets = this.buildCategoryFacets(query);
    const { facet_key, facet_value, ...rest } = query;
    const listQuery: ListQueryDto = { ...rest, facets };
    return this.listProducts(groupId, subsidiaryId, listQuery);
  }

  async listProductVariantsById(
    groupId: string,
    subsidiaryId: string,
    productId: string,
    query: ListQueryDto,
  ) {
    const listQuery: ListQueryDto = { ...query, product_id: productId };
    return this.listVariants(groupId, subsidiaryId, listQuery);
  }

  async createProduct(groupId: string, subsidiaryId: string, body: CreateProductDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const trading = await this.assertTradingSubsidiary(groupId, subsidiaryId);

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
          subsidiaryId: trading.id,
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

    const subsidiary = await this.getSubsidiary(groupId, subsidiaryId);
    const where: Prisma.ProductWhereInput = { id: productId, groupId };
    if (this.isTradingSubsidiary(subsidiary)) {
      where.AND = [{ OR: [{ subsidiaryId }, { subsidiaryId: null }] }];
    } else {
      where.AND = [
        {
          variants: {
            some: {
              assortments: { some: { subsidiaryId, status: "active" } },
            },
          },
        },
      ];
    }

    const product = await this.prisma.product.findFirst({
      where,
      include: { facets: { include: { facetValue: { include: { facet: true } } } } },
    });

    if (!product) throw new NotFoundException("Product not found");

    return this.mapProduct(product);
  }

  async updateProduct(groupId: string, subsidiaryId: string, productId: string, body: UpdateProductDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const trading = await this.assertTradingSubsidiary(groupId, subsidiaryId);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.product.findFirst({
        where: { id: productId, groupId, OR: [{ subsidiaryId: trading.id }, { subsidiaryId: null }] },
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

    const subsidiary = await this.getSubsidiary(groupId, subsidiaryId);

    const where: Prisma.VariantWhereInput = {
      groupId,
      ...(query.barcode ? { barcode: query.barcode } : {}),
    };

    const andFilters: Prisma.VariantWhereInput[] = [];
      if (this.isTradingSubsidiary(subsidiary)) {
        andFilters.push({ OR: [{ subsidiaryId }, { subsidiaryId: null }] });
      } else {
        andFilters.push({ assortments: { some: { subsidiaryId, status: "active" } } });
      }
      if (query.product_id) {
        andFilters.push({ productId: query.product_id });
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
      data: variants.map((variant) => this.mapVariant(variant)),
      meta: this.buildMeta(query, total),
    };
  }

  async getVariant(groupId: string, subsidiaryId: string, variantId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const subsidiary = await this.getSubsidiary(groupId, subsidiaryId);
    const where: Prisma.VariantWhereInput = { id: variantId, groupId };
    if (this.isTradingSubsidiary(subsidiary)) {
      where.AND = [{ OR: [{ subsidiaryId }, { subsidiaryId: null }] }];
    } else {
      where.AND = [
        {
          assortments: { some: { subsidiaryId, status: "active" } },
        },
      ];
    }

    const variant = await this.prisma.variant.findFirst({
      where,
      include: { facets: { include: { facetValue: { include: { facet: true } } } } },
    });

    if (!variant) throw new NotFoundException("Variant not found");

    return this.mapVariant(variant);
  }

  async listCategoryVariantsById(
    groupId: string,
    subsidiaryId: string,
    categoryId: string,
    query: ListQueryDto,
  ) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, groupId, subsidiaryId, status: "active" },
    });
    if (!category) throw new NotFoundException("Category not found");

    const subsidiary = await this.getSubsidiary(groupId, subsidiaryId);
    const where: Prisma.VariantWhereInput = {
      groupId,
    };

    const andFilters: Prisma.VariantWhereInput[] = [];
    if (this.isTradingSubsidiary(subsidiary)) {
      andFilters.push({ OR: [{ subsidiaryId }, { subsidiaryId: null }] });
    } else {
      andFilters.push({
        assortments: { some: { subsidiaryId, status: "active" } },
      });
    }

    if (query.product_id) {
      andFilters.push({ productId: query.product_id });
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

    const categoryOr = this.buildCategoryVariantOr(category);
    if (categoryOr.length) {
      andFilters.push({ OR: categoryOr });
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
      data: variants.map((variant) => this.mapVariant(variant)),
      meta: this.buildMeta(query, total),
    };
  }

  async listCategoryVariants(groupId: string, subsidiaryId: string, query: ListCategoryQueryDto) {
    const facets = this.buildCategoryFacets(query);
    const { facet_key, facet_value, ...rest } = query;
    const listQuery: ListQueryDto = { ...rest, facets };
    return this.listVariants(groupId, subsidiaryId, listQuery);
  }

  async createVariant(groupId: string, subsidiaryId: string, body: CreateVariantDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const trading = await this.assertTradingSubsidiary(groupId, subsidiaryId);

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: body.product_id, groupId, OR: [{ subsidiaryId: trading.id }, { subsidiaryId: null }] },
      });
      if (!product) throw new BadRequestException("Product not found");

      const variant = await tx.variant.create({
        data: {
          groupId,
          subsidiaryId: trading.id,
          productId: product.id,
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

    const trading = await this.assertTradingSubsidiary(groupId, subsidiaryId);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.variant.findFirst({
        where: { id: variantId, groupId, OR: [{ subsidiaryId: trading.id }, { subsidiaryId: null }] },
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

  async publishVariantAssortment(groupId: string, subsidiaryId: string, body: PublishVariantAssortmentDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const trading = await this.assertTradingSubsidiary(groupId, subsidiaryId);
    const target = await this.prisma.subsidiary.findFirst({
      where: { id: body.subsidiary_id, groupId },
      select: { id: true },
    });
    if (!target) throw new BadRequestException("Target subsidiary not found");

    const variantIds = Array.from(new Set(body.variant_ids));
    const variants = await this.prisma.variant.findMany({
      where: {
        id: { in: variantIds },
        groupId,
        OR: [{ subsidiaryId: trading.id }, { subsidiaryId: null }],
        product: { OR: [{ subsidiaryId: trading.id }, { subsidiaryId: null }] },
      },
      select: { id: true },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException("One or more variants are not owned by the trading subsidiary");
    }

    await this.prisma.variantAssortment.createMany({
      data: variantIds.map((variantId) => ({
        groupId,
        subsidiaryId: target.id,
        variantId,
        sourceSubsidiaryId: trading.id,
        status: "active",
      })),
      skipDuplicates: true,
    });

    const updated = await this.prisma.variantAssortment.updateMany({
      where: { groupId, subsidiaryId: target.id, variantId: { in: variantIds } },
      data: { status: "active", sourceSubsidiaryId: trading.id },
    });

    return {
      subsidiary_id: target.id,
      variant_ids: variantIds,
      status: "active",
      updated: updated.count,
    };
  }

  async withdrawVariantAssortment(groupId: string, subsidiaryId: string, body: WithdrawVariantAssortmentDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    await this.assertTradingSubsidiary(groupId, subsidiaryId);
    const target = await this.prisma.subsidiary.findFirst({
      where: { id: body.subsidiary_id, groupId },
      select: { id: true },
    });
    if (!target) throw new BadRequestException("Target subsidiary not found");

    const variantIds = Array.from(new Set(body.variant_ids));
    const updated = await this.prisma.variantAssortment.updateMany({
      where: { groupId, subsidiaryId: target.id, variantId: { in: variantIds } },
      data: { status: "inactive" },
    });

    return {
      subsidiary_id: target.id,
      variant_ids: variantIds,
      status: "inactive",
      updated: updated.count,
    };
  }

  private async getSubsidiary(groupId: string, subsidiaryId: string) {
    const subsidiary = await this.prisma.subsidiary.findFirst({
      where: { id: subsidiaryId, groupId },
      select: { id: true, role: true },
    });
    if (!subsidiary) throw new BadRequestException("Subsidiary not found");
    return subsidiary;
  }

  private isTradingSubsidiary(subsidiary: { role: SubsidiaryRole | null }) {
    return subsidiary.role === SubsidiaryRole.PROCUREMENT_TRADING;
  }

  private async assertTradingSubsidiary(groupId: string, subsidiaryId: string) {
    const subsidiary = await this.getSubsidiary(groupId, subsidiaryId);
    if (!this.isTradingSubsidiary(subsidiary)) {
      throw new BadRequestException("Only the procurement/trading subsidiary can perform this action");
    }
    return subsidiary;
  }

  private normalizeFacetKey(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, "_");
  }

  private normalizeFacetValue(value: string) {
    return value.trim().toLowerCase();
  }

  private prepareCategoryFilters(filters?: CategoryFilterGroupDto[]) {
    if (!filters) return undefined;
    const cleaned = filters
      .map((group) => ({
        all: (group.all || [])
          .map((filter) => ({
            key: filter.key.trim(),
            value: filter.value.trim(),
          }))
          .filter((filter) => filter.key && filter.value),
      }))
      .filter((group) => group.all.length);

    if (!cleaned.length) return Prisma.DbNull;
    return cleaned;
  }

  private parseCategoryFilters(filters: Prisma.JsonValue | null | undefined): CategoryFilterGroup[] {
    if (!filters || !Array.isArray(filters)) return [];
    return filters
      .map((group) => {
        if (!group || typeof group !== "object") return null;
        const anyGroup = group as { all?: unknown };
        const items = Array.isArray(anyGroup.all) ? anyGroup.all : [];
        const parsed = items
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const record = item as { key?: unknown; value?: unknown };
            if (typeof record.key !== "string" || typeof record.value !== "string") return null;
            return { key: record.key, value: record.value };
          })
          .filter(Boolean) as CategoryFilter[];

        if (!parsed.length) return null;
        return { all: parsed };
      })
      .filter(Boolean) as CategoryFilterGroup[];
  }

  private normalizeCategoryFilters(filters: CategoryFilterGroup[]): NormalizedCategoryFilterGroup[] {
    return filters
      .map((group) => ({
        all: group.all
          .map((filter) => ({
            normalizedKey: this.normalizeFacetKey(filter.key),
            normalizedValue: this.normalizeFacetValue(filter.value),
          }))
          .filter((filter) => filter.normalizedKey && filter.normalizedValue),
      }))
      .filter((group) => group.all.length);
  }

  private buildCategoryProductOr(category: { productFilters: Prisma.JsonValue | null; variantFilters: Prisma.JsonValue | null }) {
    const productGroups = this.normalizeCategoryFilters(this.parseCategoryFilters(category.productFilters));
    const variantGroups = this.normalizeCategoryFilters(this.parseCategoryFilters(category.variantFilters));
    const useVariant = !productGroups.length && variantGroups.length;
    const groups = useVariant ? variantGroups : productGroups;

    if (!groups.length) return [];

    if (useVariant) {
      return groups.map((group) => ({
        variants: {
          some: {
            AND: group.all.map((filter) => ({
              facets: {
                some: {
                  facetValue: {
                    normalizedValue: filter.normalizedValue,
                    facet: { key: filter.normalizedKey },
                  },
                },
              },
            })),
          },
        },
      }));
    }

    return groups.map((group) => ({
      AND: group.all.map((filter) => ({
        facets: {
          some: {
            facetValue: {
              normalizedValue: filter.normalizedValue,
              facet: { key: filter.normalizedKey },
            },
          },
        },
      })),
    }));
  }

  private buildCategoryVariantOr(category: { productFilters: Prisma.JsonValue | null; variantFilters: Prisma.JsonValue | null }) {
    const variantGroups = this.normalizeCategoryFilters(this.parseCategoryFilters(category.variantFilters));
    const productGroups = this.normalizeCategoryFilters(this.parseCategoryFilters(category.productFilters));
    const useProduct = !variantGroups.length && productGroups.length;
    const groups = useProduct ? productGroups : variantGroups;

    if (!groups.length) return [];

    if (useProduct) {
      return groups.map((group) => ({
        product: {
          AND: group.all.map((filter) => ({
            facets: {
              some: {
                facetValue: {
                  normalizedValue: filter.normalizedValue,
                  facet: { key: filter.normalizedKey },
                },
              },
            },
          })),
        },
      }));
    }

    return groups.map((group) => ({
      AND: group.all.map((filter) => ({
        facets: {
          some: {
            facetValue: {
              normalizedValue: filter.normalizedValue,
              facet: { key: filter.normalizedKey },
            },
          },
        },
      })),
    }));
  }

  private mapCategory(category: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    status: string;
    sortOrder: number;
    productFilters: Prisma.JsonValue | null;
    variantFilters: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: category.id,
      code: category.code,
      name: category.name,
      description: category.description ?? undefined,
      status: category.status,
      sort_order: category.sortOrder,
      product_filters: category.productFilters ?? undefined,
      variant_filters: category.variantFilters ?? undefined,
      created_at: category.createdAt.toISOString(),
      updated_at: category.updatedAt.toISOString(),
    };
  }

  private buildCategoryFacets(query: ListCategoryQueryDto) {
    const base = `${query.facet_key}=${query.facet_value}`;
    if (query.facets) return `${base}|${query.facets}`;
    return base;
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
    const definitions = await this.resolveFacetDefinitions(tx, groupId, keys, "product", new Set(["brand", "concentration", "sex"]));

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
    const definitions = await this.resolveFacetDefinitions(tx, groupId, keys, "variant", new Set(["size", "packaging"]));

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
