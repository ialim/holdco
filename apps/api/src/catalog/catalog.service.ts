import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateVariantDto } from "./dto/create-variant.dto";

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

  async listProducts(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where: Record<string, unknown> = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    if (query.barcode) {
      where.variants = { some: { barcode: query.barcode } };
    } else if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" as const } },
        { sku: { contains: query.q, mode: "insensitive" as const } },
      ];
    }

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
    ]);

    return {
      data: products.map(this.mapProduct),
      meta: this.buildMeta(query, total),
    };
  }

  async createProduct(groupId: string, subsidiaryId: string, body: CreateProductDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const product = await this.prisma.product.create({
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

    return this.mapProduct(product);
  }

  async getProduct(groupId: string, subsidiaryId: string, productId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const product = await this.prisma.product.findFirst({
      where: { id: productId, groupId, subsidiaryId },
    });

    if (!product) throw new NotFoundException("Product not found");

    return this.mapProduct(product);
  }

  async listVariants(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.barcode ? { barcode: query.barcode } : {}),
    };

    const [total, variants] = await this.prisma.$transaction([
      this.prisma.variant.count({ where }),
      this.prisma.variant.findMany({ where, orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
    ]);

    return {
      data: variants.map(this.mapVariant),
      meta: this.buildMeta(query, total),
    };
  }

  async createVariant(groupId: string, subsidiaryId: string, body: CreateVariantDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const variant = await this.prisma.variant.create({
      data: {
        groupId,
        subsidiaryId,
        productId: body.product_id,
        size: body.size,
        unit: body.unit,
        barcode: body.barcode,
      },
    });

    return this.mapVariant(variant);
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
    };
  }

  private mapVariant(variant: {
    id: string;
    productId: string;
    size: string | null;
    unit: string | null;
    barcode: string | null;
  }) {
    return {
      id: variant.id,
      product_id: variant.productId,
      size: variant.size ?? undefined,
      unit: variant.unit ?? undefined,
      barcode: variant.barcode ?? undefined,
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
