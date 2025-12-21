import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreatePriceListDto } from "./dto/create-price-list.dto";
import { CreatePriceRuleDto } from "./dto/create-price-rule.dto";
import { CreatePromotionDto } from "./dto/create-promotion.dto";

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async listPriceLists(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
    };

    const [total, priceLists] = await this.prisma.$transaction([
      this.prisma.priceList.count({ where }),
      this.prisma.priceList.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: priceLists.map(this.mapPriceList),
      meta: this.buildMeta(query, total),
    };
  }

  async createPriceList(groupId: string, subsidiaryId: string, body: CreatePriceListDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const priceList = await this.prisma.priceList.create({
      data: {
        groupId,
        subsidiaryId,
        name: body.name,
        currency: body.currency,
        channel: body.channel,
        validFrom: body.valid_from ? new Date(body.valid_from) : undefined,
        validTo: body.valid_to ? new Date(body.valid_to) : undefined,
      },
    });

    return this.mapPriceList(priceList);
  }

  async getPriceList(groupId: string, subsidiaryId: string, priceListId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const priceList = await this.prisma.priceList.findFirst({ where: { id: priceListId, groupId, subsidiaryId } });
    if (!priceList) throw new NotFoundException("Price list not found");

    return this.mapPriceList(priceList);
  }

  async listPriceRules(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.price_list_id ? { priceListId: query.price_list_id } : {}),
    };

    const [total, priceRules] = await this.prisma.$transaction([
      this.prisma.priceRule.count({ where }),
      this.prisma.priceRule.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: priceRules.map(this.mapPriceRule),
      meta: this.buildMeta(query, total),
    };
  }

  async createPriceRule(groupId: string, subsidiaryId: string, body: CreatePriceRuleDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const priceRule = await this.prisma.priceRule.create({
      data: {
        groupId,
        subsidiaryId,
        priceListId: body.price_list_id,
        productId: body.product_id,
        variantId: body.variant_id,
        minQty: body.min_qty,
        price: body.price,
      },
    });

    return this.mapPriceRule(priceRule);
  }

  async listPromotions(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
    };

    const [total, promotions] = await this.prisma.$transaction([
      this.prisma.promotion.count({ where }),
      this.prisma.promotion.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: promotions.map(this.mapPromotion),
      meta: this.buildMeta(query, total),
    };
  }

  async createPromotion(groupId: string, subsidiaryId: string, body: CreatePromotionDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const promotion = await this.prisma.promotion.create({
      data: {
        groupId,
        subsidiaryId,
        code: body.code,
        type: body.type,
        value: body.value,
        startAt: new Date(body.start_at),
        endAt: new Date(body.end_at),
      },
    });

    return this.mapPromotion(promotion);
  }

  private mapPriceList(priceList: {
    id: string;
    name: string;
    currency: string;
    channel: string | null;
    validFrom: Date | null;
    validTo: Date | null;
  }) {
    return {
      id: priceList.id,
      name: priceList.name,
      currency: priceList.currency,
      channel: priceList.channel ?? undefined,
      valid_from: priceList.validFrom ? priceList.validFrom.toISOString().slice(0, 10) : undefined,
      valid_to: priceList.validTo ? priceList.validTo.toISOString().slice(0, 10) : undefined,
    };
  }

  private mapPriceRule(priceRule: {
    id: string;
    priceListId: string;
    productId: string;
    variantId: string | null;
    minQty: number;
    price: any;
  }) {
    return {
      id: priceRule.id,
      price_list_id: priceRule.priceListId,
      product_id: priceRule.productId,
      variant_id: priceRule.variantId ?? undefined,
      min_qty: priceRule.minQty,
      price: Number(priceRule.price),
    };
  }

  private mapPromotion(promotion: {
    id: string;
    code: string;
    type: string;
    value: any;
    startAt: Date;
    endAt: Date;
  }) {
    return {
      id: promotion.id,
      code: promotion.code,
      type: promotion.type,
      value: Number(promotion.value),
      start_at: promotion.startAt.toISOString(),
      end_at: promotion.endAt.toISOString(),
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
