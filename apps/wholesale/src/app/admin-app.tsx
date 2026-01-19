"use client";

import { Admin, Resource } from "react-admin";
import { AppLayout } from "../components/AppLayout";
import { authProvider } from "../providers/auth-provider";
import { dataProvider } from "../providers/data-provider";
import { TenantProvider } from "../providers/tenant-context";
import { adminTheme } from "./admin-theme";
import { ProductList, VariantList } from "../resources/catalog";
import { OrderShow } from "../resources/orders";
import {
  CreditAccountCreate,
  CreditAccountList,
  CreditReportPage,
  RepaymentCreate,
  ResellerCreate,
  ResellerList,
  ResellerShow,
  WholesaleOrderCreate,
  WholesaleOrderList
} from "../resources/wholesale";

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
        <Resource name="products" list={ProductList} />
        <Resource name="variants" list={VariantList} />
        <Resource name="wholesale-orders" list={WholesaleOrderList} show={OrderShow} create={WholesaleOrderCreate} options={{ label: "Wholesale Orders" }} />
        <Resource name="resellers" list={ResellerList} show={ResellerShow} create={ResellerCreate} options={{ label: "Resellers" }} />
        <Resource name="credit-accounts" list={CreditAccountList} create={CreditAccountCreate} options={{ label: "Credit Accounts" }} />
        <Resource name="repayments" create={RepaymentCreate} options={{ label: "Repayments" }} />
        <Resource name="credit-report" list={CreditReportPage} options={{ label: "Credit Report" }} />
      </Admin>
    </TenantProvider>
  );
}
