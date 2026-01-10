# Retool App 1: Catalog Admin Layout

This layout describes the page structure, components, and query wiring for the Catalog Admin app. It assumes the global helpers in `docs/retool-admin-ops.md` and query checklist in `docs/retool-admin-ops-apps.md`.

## Page structure
- Header
  - Breadcrumb: Admin / Catalog
  - Tenant summary pill (group + subsidiary + location)
  - Search input bound to `searchGlobal.value` (optional)
- Tabs (single page with tabs)
  - Brands
  - Suppliers
  - Categories
  - Products
  - Variants
  - Facets
  - Facet Values (only visible when a facet is selected)

## Wireframe (ASCII)
```
+----------------------------------------------------------------------------------+
| Admin / Catalog     [Group/Subsidiary/Location]     [Global Search]              |
+----------------------------------------------------------------------------------+
| Tabs: [Brands] [Suppliers] [Categories] [Products] [Variants] [Facets] [Facet Values] |
+----------------------------------------------------------------------------------+
| Table + Search + Create Button pattern per tab                                   |
|  [Search...] [Create]                                                           |
|  +--------------------------------------------------------------------------+    |
|  | Table (list view)                                                        |    |
|  +--------------------------------------------------------------------------+    |
|  Drawer: Create/Edit form                                                     |
+----------------------------------------------------------------------------------+
```

## Component map (IDs -> queries)
- `searchBrands` -> re-run `qListBrands`
- `searchSuppliers` -> re-run `qListSuppliers`
- `searchCategories` -> re-run `qListCategories`
- `searchProducts` -> re-run `qListProducts`
- `searchVariants` -> re-run `qListVariants`
- `searchFacets` -> re-run `qListFacets`
- `tableBrands` -> data: `qListBrands`
- `tableSuppliers` -> data: `qListSuppliers`
- `tableCategories` -> data: `qListCategories`
- `tableProducts` -> data: `qListProducts`, row select -> `qGetProduct`
- `tableVariants` -> data: `qListVariants`
- `tableFacets` -> data: `qListFacets`, row select -> `qListFacetValues`
- `tableFacetValues` -> data: `qListFacetValues`
- `drawerBrand` submit -> `qCreateBrand`
- `drawerSupplier` submit -> `qCreateSupplier`
- `drawerCategory` submit -> `qCreateCategory` or `qUpdateCategory`
- `drawerProduct` submit -> `qCreateProduct` or `qUpdateProduct`
- `drawerVariant` submit -> `qCreateVariant` or `qUpdateVariant`
- `drawerFacet` submit -> `qCreateFacet`
- `drawerFacetValue` submit -> `qCreateFacetValue`

## Shared components
- Search input per tab (e.g., `searchBrands`, `searchSuppliers`).
- Table with pagination controls (limit/offset from table state).
- Primary action button: "Create".
- Drawer form for create/update.
- Toasts for success/error.

## Query wiring (naming convention)
- List queries: `qListBrands`, `qListSuppliers`, `qListCategories`, `qListProducts`, `qListVariants`, `qListFacets`, `qListFacetValues`.
- Create queries: `qCreateBrand`, `qCreateSupplier`, `qCreateCategory`, `qCreateProduct`, `qCreateVariant`, `qCreateFacet`, `qCreateFacetValue`.
- Update queries: `qUpdateCategory`, `qUpdateProduct`, `qUpdateVariant` (no update endpoints for brand/supplier).

Each query should set headers to `{{buildHeaders.value}}`. All create/update requests must set:
- `Idempotency-Key: {{newIdempotencyKey.value}}`

## Tab layout and wiring

### Brands tab
- Components:
  - Search input: `searchBrands`
  - Button: `btnCreateBrand`
  - Table: `tableBrands`
  - Drawer: `drawerBrand`
- Wiring:
  - `qListBrands` runs on page load and when `searchBrands` changes.
  - `btnCreateBrand` opens `drawerBrand`.
  - `drawerBrand` submit -> `qCreateBrand` -> on success: close drawer + re-run `qListBrands`.

### Suppliers tab
- Components:
  - Search input: `searchSuppliers`
  - Button: `btnCreateSupplier`
  - Table: `tableSuppliers`
  - Drawer: `drawerSupplier`
- Wiring:
  - `qListSuppliers` runs on load and on `searchSuppliers` change.
  - `btnCreateSupplier` opens `drawerSupplier`.
  - `drawerSupplier` submit -> `qCreateSupplier` -> refresh `qListSuppliers`.

### Categories tab
- Components:
  - Search input: `searchCategories`
  - Button: `btnCreateCategory`
  - Table: `tableCategories`
  - Drawer: `drawerCategory`
  - JSON editors: `jsonCategoryProductFilters`, `jsonCategoryVariantFilters`
- Wiring:
  - `qListCategories` runs on load and on `searchCategories` change.
  - `btnCreateCategory` opens `drawerCategory`.
  - `drawerCategory` submit -> `qCreateCategory` or `qUpdateCategory` -> refresh `qListCategories`.
  - Category filters are OR groups; use the JSON editor to edit arrays of `{ all: [{ key, value }] }`.

### Products tab
- Components:
  - Search input: `searchProducts`
  - Button: `btnCreateProduct`
  - Table: `tableProducts`
  - Drawer: `drawerProduct`
  - Detail panel: `panelProductDetails` (optional)
- Wiring:
  - `qListProducts` runs on load and on `searchProducts` change.
  - `tableProducts` row select -> `qGetProduct` (optional) -> populate detail panel.
  - `btnCreateProduct` opens `drawerProduct` (create).
  - `drawerProduct` edit mode uses selected product data, submit -> `qUpdateProduct`.
  - On success: close drawer + re-run `qListProducts`.

### Variants tab
- Components:
  - Search input: `searchVariants`
  - Button: `btnCreateVariant`
  - Table: `tableVariants`
  - Drawer: `drawerVariant`
  - Product select: `selectProductForVariants` (filters variants by product_id)
- Wiring:
  - `qListVariants` runs on load and on `searchVariants` change.
  - If `selectProductForVariants` set, include `product_id` param.
  - `drawerVariant` submit -> `qCreateVariant` or `qUpdateVariant`.

### Facets tab
- Components:
  - Search input: `searchFacets`
  - Button: `btnCreateFacet`
  - Table: `tableFacets`
  - Drawer: `drawerFacet`
- Wiring:
  - `qListFacets` runs on load and on `searchFacets` change.
  - `btnCreateFacet` opens `drawerFacet`.
  - `drawerFacet` submit -> `qCreateFacet` -> refresh `qListFacets`.

### Facet Values tab
- Components:
  - Table: `tableFacetValues`
  - Button: `btnCreateFacetValue`
  - Drawer: `drawerFacetValue`
- Wiring:
  - Visible when a facet is selected in `tableFacets`.
  - `qListFacetValues` uses selected facet id.
  - `btnCreateFacetValue` opens `drawerFacetValue`.
  - `drawerFacetValue` submit -> `qCreateFacetValue` -> refresh `qListFacetValues`.

## Validation rules (summary)
- Brand: `name` required, min length 2.
- Supplier: `name` required; `contact_name`, `contact_phone` optional.
- Category: `code` and `name` required; `status` optional; `sort_order` optional integer; `product_filters`/`variant_filters` optional arrays of groups.
- Product: `sku` min 3, `name` min 2; optional `brand_id`, `sex`, `concentration`, `type`.
- Variant: `product_id` required; `size`, `unit`, `barcode` optional.
- Facet: `key` and `name` min 2; optional `scope` and `data_type`.
- Facet value: `value` required.

## Recommended defaults
- `limit`: 50, `offset`: 0.
- `status` filters default to blank (all).
- `scope` default to `product` for facets unless specified.
