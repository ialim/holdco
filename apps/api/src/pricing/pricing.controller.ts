import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreatePriceListDto } from "./dto/create-price-list.dto";
import { CreatePriceRuleDto } from "./dto/create-price-rule.dto";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { PricingService } from "./pricing.service";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Permissions("pricing.price_list.read")
  @Get("price-lists")
  listPriceLists(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.pricingService.listPriceLists(groupId, subsidiaryId, query);
  }

  @Permissions("pricing.price_list.write")
  @Post("price-lists")
  createPriceList(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreatePriceListDto,
  ) {
    return this.pricingService.createPriceList(groupId, subsidiaryId, body);
  }

  @Permissions("pricing.price_list.read")
  @Get("price-lists/:price_list_id")
  getPriceList(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("price_list_id", new ParseUUIDPipe()) priceListId: string,
  ) {
    return this.pricingService.getPriceList(groupId, subsidiaryId, priceListId);
  }

  @Permissions("pricing.price_rule.read")
  @Get("price-rules")
  listPriceRules(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.pricingService.listPriceRules(groupId, subsidiaryId, query);
  }

  @Permissions("pricing.price_rule.write")
  @Post("price-rules")
  createPriceRule(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreatePriceRuleDto,
  ) {
    return this.pricingService.createPriceRule(groupId, subsidiaryId, body);
  }

  @Permissions("pricing.promotion.read")
  @Get("promotions")
  listPromotions(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.pricingService.listPromotions(groupId, subsidiaryId, query);
  }

  @Permissions("pricing.promotion.write")
  @Post("promotions")
  createPromotion(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreatePromotionDto,
  ) {
    return this.pricingService.createPromotion(groupId, subsidiaryId, body);
  }
}
