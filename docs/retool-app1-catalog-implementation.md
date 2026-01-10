# Retool App 1: Catalog Admin Implementation Steps

This is a step-by-step build guide for Catalog Admin. It complements:
- Layout: `docs/retool-app1-catalog-layout.md`
- Checklist: `docs/retool-admin-ops-apps.md`

## Prerequisites
- Global helpers and headers from `docs/retool-admin-ops.md`.
- Catalog permissions per `docs/rbac-policies.md`.

## 1) App setup
1. Create a new Retool app: "Catalog Admin".
2. Add global state keys if missing: `groupId`, `subsidiaryId`, `locationId`, `channel`, `jwt`.
3. Build tabs: Brands, Suppliers, Categories, Products, Variants, Facets, Facet Values.

## 2) Queries
All queries use the REST resource and headers from `{{buildHeaders.value}}`.
All write queries include `Idempotency-Key: {{newIdempotencyKey.value}}`.

### Brands
`qListBrands` (GET `/brands`)
- Params: `limit`, `offset`, `q`.

`qCreateBrand` (POST `/brands`)
- Body:
```json
{ "name": "{{inputBrandName.value}}" }
```

### Suppliers
`qListSuppliers` (GET `/suppliers`)
- Params: `limit`, `offset`, `q`.

`qCreateSupplier` (POST `/suppliers`)
- Body:
```json
{
  "name": "{{inputSupplierName.value}}",
  "contact_name": "{{inputSupplierContactName.value}}",
  "contact_phone": "{{inputSupplierContactPhone.value}}"
}
```

### Categories
`qListCategories` (GET `/categories`)
- Params: `limit`, `offset`, `q`, `status`.

`qCreateCategory` (POST `/categories`)
- Body:
```json
{
  "code": "{{inputCategoryCode.value}}",
  "name": "{{inputCategoryName.value}}",
  "description": "{{inputCategoryDescription.value}}",
  "status": "{{selectCategoryStatus.value}}",
  "sort_order": {{inputCategorySortOrder.value}},
  "product_filters": {{jsonCategoryProductFilters.value}},
  "variant_filters": {{jsonCategoryVariantFilters.value}}
}
```

`qUpdateCategory` (PATCH `/categories/{{tableCategories.selectedRow.id}}`)
- Body uses the same fields as create; send only changed fields.

Example filter payloads:
```json
[
  { "all": [{ "key": "sex", "value": "male" }] },
  { "all": [{ "key": "brand", "value": "armaf" }, { "key": "concentration", "value": "eau de parfum" }] }
]
```

### Products
`qListProducts` (GET `/products`)
- Params: `limit`, `offset`, `q`.

`qGetProduct` (GET `/products/{{tableProducts.selectedRow.id}}`) (optional detail panel).

`qCreateProduct` (POST `/products`)
- Body:
```json
{
  "sku": "{{inputProductSku.value}}",
  "name": "{{inputProductName.value}}",
  "brand_id": "{{selectProductBrand.value}}",
  "sex": "{{inputProductSex.value}}",
  "concentration": "{{inputProductConcentration.value}}",
  "type": "{{inputProductType.value}}",
  "facets": {{tableProductFacets.data || []}}
}
```

`qUpdateProduct` (PATCH `/products/{{tableProducts.selectedRow.id}}`)
- Body uses the same fields as create; send only changed fields.

### Variants
`qListVariants` (GET `/variants`)
- Params: `limit`, `offset`, `q`, optional `product_id`.

`qCreateVariant` (POST `/variants`)
- Body:
```json
{
  "product_id": "{{selectVariantProduct.value}}",
  "size": "{{inputVariantSize.value}}",
  "unit": "{{inputVariantUnit.value}}",
  "barcode": "{{inputVariantBarcode.value}}",
  "facets": {{tableVariantFacets.data || []}}
}
```

`qUpdateVariant` (PATCH `/variants/{{tableVariants.selectedRow.id}}`)
- Body uses the same fields as create; send only changed fields.

### Facets
`qListFacets` (GET `/facets`)
- Params: `limit`, `offset`, `q`.

`qCreateFacet` (POST `/facets`)
- Body:
```json
{
  "key": "{{inputFacetKey.value}}",
  "name": "{{inputFacetName.value}}",
  "scope": "{{selectFacetScope.value}}",
  "data_type": "text"
}
```

### Facet Values
`qListFacetValues` (GET `/facets/{{tableFacets.selectedRow.id}}/values`)
- Params: `limit`, `offset`.

`qCreateFacetValue` (POST `/facets/{{tableFacets.selectedRow.id}}/values`)
- Body:
```json
{ "value": "{{inputFacetValue.value}}" }
```

## 3) Component wiring
- Search inputs re-run list queries.
- `tableProducts` row select -> `qGetProduct` (optional).
- `tableFacets` row select -> `qListFacetValues`.
- Drawer submit -> create/update query -> refresh list + close drawer.

## 4) QA smoke tests
- Create a brand and supplier.
- Create a category with a product or variant filter and confirm it appears in `/categories`.
- Create a product with facets and update it.
- Create a variant with facets and update it.
- Create a facet definition and add facet values.
