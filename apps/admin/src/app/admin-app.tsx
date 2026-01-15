"use client";

import { Admin, Resource } from "react-admin";
import { AppLayout } from "../components/AppLayout";
import { authProvider } from "../providers/auth-provider";
import { dataProvider } from "../providers/data-provider";
import { TenantProvider } from "../providers/tenant-context";
import { adminTheme } from "./admin-theme";
import {
  BrandCreate,
  BrandList,
  CategoryCreate,
  CategoryEdit,
  CategoryList,
  FacetCreate,
  FacetList,
  FacetValueCreate,
  FacetValueList,
  ProductCreate,
  ProductEdit,
  ProductList,
  SupplierCreate,
  SupplierList,
  VariantCreate,
  VariantEdit,
  VariantList
} from "../resources/catalog";
import { OrdersList, OrderShow } from "../resources/orders";
import { DeviceCreate, DeviceEdit, DeviceList, LocationCreate, LocationList, ShiftCreate, ShiftList, ShiftShow } from "../resources/pos";
import {
  ImportShipmentCreate,
  ImportShipmentList,
  ImportShipmentShow,
  PurchaseOrderCreate,
  PurchaseOrderList,
  PurchaseRequestCreate,
  PurchaseRequestList
} from "../resources/procurement";
import { SubsidiaryCreate, SubsidiaryList } from "../resources/tenancy";
import { RolesList, UsersList } from "../resources/rbac";
import { AppRoleCreate, AppRolesList, AppUserCreate, AppUsersList } from "../resources/app-roles";
import {
  ChartOfAccountsCreate,
  ChartOfAccountsList,
  CostCentersCreate,
  CostCentersList,
  FinanceExportsPage,
  FiscalPeriodsCreate,
  FiscalPeriodsList,
  IntercompanyAgreementsList,
  JournalEntriesCreate,
  JournalEntriesList
} from "../resources/finance";

export default function AdminApp() {
  return (
    <TenantProvider>
      <Admin
        dataProvider={dataProvider}
        authProvider={authProvider}
        layout={AppLayout}
        theme={adminTheme}
        requireAuth
      >
        <Resource name="brands" list={BrandList} create={BrandCreate} />
        <Resource name="suppliers" list={SupplierList} create={SupplierCreate} />
        <Resource name="categories" list={CategoryList} create={CategoryCreate} edit={CategoryEdit} />
        <Resource name="products" list={ProductList} create={ProductCreate} edit={ProductEdit} />
        <Resource name="variants" list={VariantList} create={VariantCreate} edit={VariantEdit} />
        <Resource name="facets" list={FacetList} create={FacetCreate} />
        <Resource name="facet-values" list={FacetValueList} create={FacetValueCreate} />
        <Resource name="orders" list={OrdersList} show={OrderShow} options={{ label: "Orders & Payments" }} />
        <Resource name="users" list={UsersList} options={{ label: "Users" }} />
        <Resource name="roles" list={RolesList} options={{ label: "Roles" }} />
        <Resource name="app-users" list={AppUsersList} create={AppUserCreate} options={{ label: "App Users" }} />
        <Resource name="app-roles" list={AppRolesList} create={AppRoleCreate} options={{ label: "App Roles" }} />
        <Resource name="subsidiaries" list={SubsidiaryList} create={SubsidiaryCreate} options={{ label: "Subsidiaries" }} />
        <Resource name="locations" list={LocationList} create={LocationCreate} options={{ label: "Locations" }} />
        <Resource name="pos/devices" list={DeviceList} create={DeviceCreate} edit={DeviceEdit} options={{ label: "POS Devices" }} />
        <Resource name="pos/shifts" list={ShiftList} show={ShiftShow} create={ShiftCreate} options={{ label: "POS Shifts" }} />
        <Resource name="procurement/purchase-requests" list={PurchaseRequestList} create={PurchaseRequestCreate} options={{ label: "Purchase Requests" }} />
        <Resource name="procurement/purchase-orders" list={PurchaseOrderList} create={PurchaseOrderCreate} options={{ label: "Purchase Orders" }} />
        <Resource
          name="procurement/import-shipments"
          list={ImportShipmentList}
          show={ImportShipmentShow}
          create={ImportShipmentCreate}
          options={{ label: "Import Shipments" }}
        />
        <Resource
          name="finance/accounts"
          list={ChartOfAccountsList}
          create={ChartOfAccountsCreate}
          options={{ label: "Chart of Accounts" }}
        />
        <Resource
          name="finance/cost-centers"
          list={CostCentersList}
          create={CostCentersCreate}
          options={{ label: "Cost Centers" }}
        />
        <Resource
          name="finance/fiscal-periods"
          list={FiscalPeriodsList}
          create={FiscalPeriodsCreate}
          options={{ label: "Fiscal Periods" }}
        />
        <Resource
          name="finance/journal-entries"
          list={JournalEntriesList}
          create={JournalEntriesCreate}
          options={{ label: "Journal Entries" }}
        />
        <Resource
          name="finance/intercompany-agreements"
          list={IntercompanyAgreementsList}
          options={{ label: "Intercompany Agreements" }}
        />
        <Resource
          name="finance/exports"
          list={FinanceExportsPage}
          options={{ label: "Finance Exports" }}
        />
      </Admin>
    </TenantProvider>
  );
}
