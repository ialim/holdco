"use client";

import { Box, Collapse, List, ListItemButton, Typography } from "@mui/material";
import {
  AccountBalanceOutlined,
  BusinessCenterOutlined,
  CalendarMonthOutlined,
  CategoryOutlined,
  CorporateFareOutlined,
  SecurityOutlined,
  GroupOutlined,
  ExpandLess,
  ExpandMore,
  FileDownloadOutlined,
  FilterListOutlined,
  HandshakeOutlined,
  HistoryOutlined,
  Inventory2Outlined,
  LayersOutlined,
  LibraryBooksOutlined,
  LocalOfferOutlined,
  LocalShippingOutlined,
  LocalMallOutlined,
  LocationOnOutlined,
  PaymentsOutlined,
  PointOfSaleOutlined,
  PlaylistAddOutlined,
  ReceiptOutlined,
  ReceiptLongOutlined,
  ScheduleOutlined,
  SellOutlined,
  SyncAltOutlined,
  SwapHorizOutlined,
  WarehouseOutlined,
  TuneOutlined
} from "@mui/icons-material";
import { MenuItemLink, usePermissions } from "react-admin";
import { useState } from "react";

function CollapsibleSection({
  title,
  children,
  defaultOpen = true
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Box>
      <ListItemButton
        onClick={() => setOpen((prev) => !prev)}
        sx={{ marginX: 1, marginY: 1, borderRadius: 2 }}
        aria-expanded={open}
      >
        <Typography variant="caption" sx={{ letterSpacing: "0.24em", textTransform: "uppercase", color: "#6D665C" }}>
          {title}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List sx={{ paddingTop: 0 }}>{children}</List>
      </Collapse>
    </Box>
  );
}

export function AppMenu() {
  const { permissions } = usePermissions();
  const permissionList = Array.isArray(permissions) ? permissions.map(String) : [];
  const normalized = permissionList.map((value) => value.toUpperCase());
  const canManageRbac =
    permissionList.includes("*") ||
    permissionList.includes("rbac.roles.manage") ||
    normalized.includes("SUPER_ADMIN") ||
    normalized.includes("HOLDCO_ADMIN") ||
    normalized.includes("GROUP_ADMIN") ||
    normalized.includes("RBAC_ADMIN");
  const canViewAudit =
    canManageRbac ||
    permissionList.includes("*") ||
    permissionList.includes("audit.logs.read") ||
    normalized.includes("AUDITOR");
  const canManagePaymentsConfig =
    canManageRbac ||
    permissionList.includes("*") ||
    permissionList.includes("payments.config.manage");
  const canViewSecuritySection = canManageRbac || canViewAudit;
  const canViewResellers =
    canManageRbac ||
    permissionList.includes("*") ||
    permissionList.includes("credit.reseller.read") ||
    permissionList.includes("credit.reseller.write");
  const canViewCreditAccounts =
    canManageRbac ||
    permissionList.includes("*") ||
    permissionList.includes("credit.account.read") ||
    permissionList.includes("credit.account.write");
  const canManageRepayments =
    canManageRbac ||
    permissionList.includes("*") ||
    permissionList.includes("credit.repayment.write");
  const canViewCreditReport =
    canManageRbac ||
    permissionList.includes("*") ||
    permissionList.includes("reports.credit");
  const canViewWholesaleOrders =
    canManageRbac ||
    permissionList.includes("*") ||
    permissionList.includes("orders.read") ||
    permissionList.includes("orders.write") ||
    permissionList.includes("orders.fulfill");
  const canViewLogistics =
    canManageRbac ||
    permissionList.includes("*") ||
    permissionList.includes("logistics.shipment.read") ||
    permissionList.includes("logistics.shipment.write");
  const canViewWholesaleSection =
    canViewResellers ||
    canViewCreditAccounts ||
    canManageRepayments ||
    canViewCreditReport ||
    canViewWholesaleOrders;
  const canManageProcurement =
    canManageRbac ||
    permissionList.includes("*") ||
    permissionList.includes("procurement.request.manage") ||
    permissionList.includes("procurement.order.manage") ||
    permissionList.includes("procurement.imports.manage") ||
    permissionList.includes("procurement.payments.manage") ||
    permissionList.includes("shared_services.third_party.read") ||
    permissionList.includes("shared_services.third_party.write");

  return (
    <Box sx={{ paddingTop: 1 }}>
      <CollapsibleSection title="Catalog" defaultOpen>
        <MenuItemLink to="/brands" primaryText="Brands" leftIcon={<LocalOfferOutlined />} />
        <MenuItemLink to="/suppliers" primaryText="Suppliers" leftIcon={<LocalShippingOutlined />} />
        <MenuItemLink to="/categories" primaryText="Categories" leftIcon={<CategoryOutlined />} />
        <MenuItemLink to="/products" primaryText="Products" leftIcon={<Inventory2Outlined />} />
        <MenuItemLink to="/variants" primaryText="Variants" leftIcon={<LayersOutlined />} />
        <MenuItemLink to="/assortments" primaryText="Assortments" leftIcon={<SyncAltOutlined />} />
        <MenuItemLink to="/facets" primaryText="Facets" leftIcon={<FilterListOutlined />} />
        <MenuItemLink to="/facet-values" primaryText="Facet Values" leftIcon={<TuneOutlined />} />
      </CollapsibleSection>

      <CollapsibleSection title="Pricing" defaultOpen={false}>
        <MenuItemLink to="/price-lists" primaryText="Price Lists" leftIcon={<SellOutlined />} />
        <MenuItemLink to="/price-rules" primaryText="Price Rules" leftIcon={<ReceiptOutlined />} />
        <MenuItemLink to="/promotions" primaryText="Promotions" leftIcon={<LocalOfferOutlined />} />
      </CollapsibleSection>

      <CollapsibleSection title="Orders" defaultOpen>
        <MenuItemLink to="/orders" primaryText="Orders & Payments" leftIcon={<ReceiptLongOutlined />} />
      </CollapsibleSection>

      {canViewWholesaleSection && (
        <CollapsibleSection title="Reseller & Wholesale" defaultOpen={false}>
          {canViewResellers && (
            <MenuItemLink to="/resellers" primaryText="Resellers" leftIcon={<HandshakeOutlined />} />
          )}
          {canViewCreditAccounts && (
            <MenuItemLink to="/credit-accounts" primaryText="Credit Accounts" leftIcon={<AccountBalanceOutlined />} />
          )}
          {canViewCreditReport && (
            <MenuItemLink to="/credit-report" primaryText="Credit Report" leftIcon={<ReceiptOutlined />} />
          )}
          {canManageRepayments && (
            <MenuItemLink to="/repayments/create" primaryText="Record Repayment" leftIcon={<ReceiptOutlined />} />
          )}
          {canViewWholesaleOrders && (
            <MenuItemLink to="/wholesale-orders" primaryText="Wholesale Orders" leftIcon={<LocalMallOutlined />} />
          )}
        </CollapsibleSection>
      )}

      {canManagePaymentsConfig && (
        <CollapsibleSection title="Payments" defaultOpen={false}>
          <MenuItemLink to="/payments/providers" primaryText="Provider Configs" leftIcon={<PaymentsOutlined />} />
        </CollapsibleSection>
      )}

      {canViewSecuritySection && (
        <CollapsibleSection title="Security" defaultOpen={false}>
          {canManageRbac && (
            <>
              <MenuItemLink to="/users" primaryText="IdP Users" leftIcon={<SecurityOutlined />} />
              <MenuItemLink to="/roles" primaryText="IdP Roles" leftIcon={<SecurityOutlined />} />
            </>
          )}
          {canViewAudit && (
            <MenuItemLink to="/audit-logs" primaryText="Audit Logs" leftIcon={<HistoryOutlined />} />
          )}
        </CollapsibleSection>
      )}

      {canManageRbac && (
        <CollapsibleSection title="App Access" defaultOpen={false}>
          <MenuItemLink to="/app-users" primaryText="App Users" leftIcon={<GroupOutlined />} />
          <MenuItemLink to="/app-roles" primaryText="App Roles" leftIcon={<GroupOutlined />} />
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Tenancy" defaultOpen={false}>
        <MenuItemLink to="/tenant-groups" primaryText="Groups" leftIcon={<CorporateFareOutlined />} />
        <MenuItemLink to="/subsidiaries" primaryText="Subsidiaries" leftIcon={<CorporateFareOutlined />} />
        <MenuItemLink to="/locations" primaryText="Locations" leftIcon={<LocationOnOutlined />} />
      </CollapsibleSection>

      <CollapsibleSection title="POS" defaultOpen>
        <MenuItemLink to="/pos/devices" primaryText="Devices" leftIcon={<PointOfSaleOutlined />} />
        <MenuItemLink to="/pos/shifts" primaryText="Shifts" leftIcon={<ScheduleOutlined />} />
      </CollapsibleSection>

      {canManageProcurement && (
        <CollapsibleSection title="Procurement" defaultOpen={false}>
          <MenuItemLink to="/procurement/purchase-requests" primaryText="Purchase Requests" leftIcon={<ReceiptOutlined />} />
          <MenuItemLink to="/procurement/purchase-orders" primaryText="Purchase Orders" leftIcon={<LocalMallOutlined />} />
          <MenuItemLink to="/procurement/import-shipments" primaryText="Import Shipments" leftIcon={<LocalShippingOutlined />} />
          <MenuItemLink to="/third-parties" primaryText="Vendors" leftIcon={<HandshakeOutlined />} />
          <MenuItemLink to="/procurement/supplier-invoices" primaryText="Supplier Invoices" leftIcon={<ReceiptOutlined />} />
          <MenuItemLink to="/procurement/supplier-payments" primaryText="Supplier Payments" leftIcon={<PaymentsOutlined />} />
        </CollapsibleSection>
      )}

      {canViewLogistics && (
        <CollapsibleSection title="Logistics" defaultOpen={false}>
          <MenuItemLink to="/logistics/shipments" primaryText="Shipments" leftIcon={<LocalShippingOutlined />} />
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Warehouse" defaultOpen={false}>
        <MenuItemLink to="/stock-levels" primaryText="Stock Levels" leftIcon={<WarehouseOutlined />} />
        <MenuItemLink to="/stock-adjustments" primaryText="Stock Adjustments" leftIcon={<PlaylistAddOutlined />} />
        <MenuItemLink to="/stock-reservations" primaryText="Stock Reservations" leftIcon={<PlaylistAddOutlined />} />
        <MenuItemLink to="/stock-transfers" primaryText="Stock Transfers" leftIcon={<SwapHorizOutlined />} />
      </CollapsibleSection>

      <CollapsibleSection title="Finance" defaultOpen={false}>
        <MenuItemLink to="/finance/accounts" primaryText="Chart of Accounts" leftIcon={<AccountBalanceOutlined />} />
        <MenuItemLink to="/finance/cost-centers" primaryText="Cost Centers" leftIcon={<BusinessCenterOutlined />} />
        <MenuItemLink to="/finance/fiscal-periods" primaryText="Fiscal Periods" leftIcon={<CalendarMonthOutlined />} />
        <MenuItemLink to="/finance/journal-entries" primaryText="Journal Entries" leftIcon={<LibraryBooksOutlined />} />
        <MenuItemLink to="/finance/intercompany-agreements" primaryText="Intercompany Agreements" leftIcon={<HandshakeOutlined />} />
        <MenuItemLink to="/finance/exports" primaryText="Exports" leftIcon={<FileDownloadOutlined />} />
      </CollapsibleSection>
    </Box>
  );
}
