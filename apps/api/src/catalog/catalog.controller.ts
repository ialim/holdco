import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { CreateFacetDefinitionDto } from "./dto/create-facet-definition.dto";
import { CreateFacetValueDto } from "./dto/create-facet-value.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { CreateVariantDto } from "./dto/create-variant.dto";
import { ListCategoryQueryDto } from "./dto/list-category-query.dto";
import { PublishVariantAssortmentDto } from "./dto/publish-variant-assortment.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { UpdateVariantDto } from "./dto/update-variant.dto";
import { WithdrawVariantAssortmentDto } from "./dto/withdraw-variant-assortment.dto";
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

  @Permissions("catalog.facet.read")
  @Get("facets")
  listFacetDefinitions(@Headers("x-group-id") groupId: string, @Query() query: ListQueryDto) {
    return this.catalogService.listFacetDefinitions(groupId, query);
  }

  @Permissions("catalog.facet.write")
  @Post("facets")
  createFacetDefinition(@Headers("x-group-id") groupId: string, @Body() body: CreateFacetDefinitionDto) {
    return this.catalogService.createFacetDefinition(groupId, body);
  }

  @Permissions("catalog.facet.read")
  @Get("facets/:facet_id/values")
  listFacetValues(
    @Headers("x-group-id") groupId: string,
    @Param("facet_id", new ParseUUIDPipe()) facetId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.catalogService.listFacetValues(groupId, facetId, query);
  }

  @Permissions("catalog.facet.write")
  @Post("facets/:facet_id/values")
  createFacetValue(
    @Headers("x-group-id") groupId: string,
    @Param("facet_id", new ParseUUIDPipe()) facetId: string,
    @Body() body: CreateFacetValueDto,
  ) {
    return this.catalogService.createFacetValue(groupId, facetId, body);
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

  @Permissions("catalog.category.read")
  @Get("categories")
  listCategories(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.catalogService.listCategories(groupId, subsidiaryId, query);
  }

  @Permissions("catalog.category.write")
  @Post("categories")
  createCategory(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateCategoryDto,
  ) {
    return this.catalogService.createCategory(groupId, subsidiaryId, body);
  }

  @Permissions("catalog.category.read")
  @Get("categories/:category_id")
  getCategory(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("category_id", new ParseUUIDPipe()) categoryId: string,
  ) {
    return this.catalogService.getCategory(groupId, subsidiaryId, categoryId);
  }

  @Permissions("catalog.category.write")
  @Patch("categories/:category_id")
  updateCategory(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("category_id", new ParseUUIDPipe()) categoryId: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.catalogService.updateCategory(groupId, subsidiaryId, categoryId, body);
  }

  @Permissions("catalog.product.read")
  @Get("categories/:category_id/products")
  listCategoryProductsById(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("category_id", new ParseUUIDPipe()) categoryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.catalogService.listCategoryProductsById(groupId, subsidiaryId, categoryId, query);
  }

  @Permissions("catalog.variant.read")
  @Get("categories/:category_id/variants")
  listCategoryVariantsById(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("category_id", new ParseUUIDPipe()) categoryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.catalogService.listCategoryVariantsById(groupId, subsidiaryId, categoryId, query);
  }

  @Permissions("catalog.product.read")
  @Get("categories/products")
  listCategoryProducts(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListCategoryQueryDto,
  ) {
    return this.catalogService.listCategoryProducts(groupId, subsidiaryId, query);
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

  @Permissions("catalog.product.write")
  @Patch("products/:product_id")
  updateProduct(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("product_id", new ParseUUIDPipe()) productId: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(groupId, subsidiaryId, productId, body);
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

  @Permissions("catalog.variant.read")
  @Get("categories/variants")
  listCategoryVariants(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListCategoryQueryDto,
  ) {
    return this.catalogService.listCategoryVariants(groupId, subsidiaryId, query);
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

  @Permissions("catalog.variant.write")
  @Patch("variants/:variant_id")
  updateVariant(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("variant_id", new ParseUUIDPipe()) variantId: string,
    @Body() body: UpdateVariantDto,
  ) {
    return this.catalogService.updateVariant(groupId, subsidiaryId, variantId, body);
  }

  @Permissions("catalog.variant.write")
  @Post("variants/assortments")
  publishVariantAssortment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: PublishVariantAssortmentDto,
  ) {
    return this.catalogService.publishVariantAssortment(groupId, subsidiaryId, body);
  }

  @Permissions("catalog.variant.write")
  @Post("variants/assortments/withdraw")
  withdrawVariantAssortment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: WithdrawVariantAssortmentDto,
  ) {
    return this.catalogService.withdrawVariantAssortment(groupId, subsidiaryId, body);
  }
}
