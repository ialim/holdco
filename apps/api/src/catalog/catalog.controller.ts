import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { CreateVariantDto } from "./dto/create-variant.dto";
import { CatalogService } from "./catalog.service";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Permissions("catalog.brand.read")
  @Get("brands")
  listBrands(@Headers("x-group-id") groupId: string, @Query() query: ListQueryDto) {
    return this.catalogService.listBrands(groupId, query);
  }

  @Permissions("catalog.brand.write")
  @Post("brands")
  createBrand(@Headers("x-group-id") groupId: string, @Body() body: CreateBrandDto) {
    return this.catalogService.createBrand(groupId, body);
  }

  @Permissions("catalog.supplier.read")
  @Get("suppliers")
  listSuppliers(@Headers("x-group-id") groupId: string, @Query() query: ListQueryDto) {
    return this.catalogService.listSuppliers(groupId, query);
  }

  @Permissions("catalog.supplier.write")
  @Post("suppliers")
  createSupplier(@Headers("x-group-id") groupId: string, @Body() body: CreateSupplierDto) {
    return this.catalogService.createSupplier(groupId, body);
  }

  @Permissions("catalog.product.read")
  @Get("products")
  listProducts(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.catalogService.listProducts(groupId, subsidiaryId, query);
  }

  @Permissions("catalog.product.write")
  @Post("products")
  createProduct(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateProductDto,
  ) {
    return this.catalogService.createProduct(groupId, subsidiaryId, body);
  }

  @Permissions("catalog.product.read")
  @Get("products/:product_id")
  getProduct(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("product_id", new ParseUUIDPipe()) productId: string,
  ) {
    return this.catalogService.getProduct(groupId, subsidiaryId, productId);
  }

  @Permissions("catalog.variant.read")
  @Get("variants")
  listVariants(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.catalogService.listVariants(groupId, subsidiaryId, query);
  }

  @Permissions("catalog.variant.write")
  @Post("variants")
  createVariant(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateVariantDto,
  ) {
    return this.catalogService.createVariant(groupId, subsidiaryId, body);
  }
}
