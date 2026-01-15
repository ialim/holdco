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
  Inventory2Outlined,
  LayersOutlined,
  LibraryBooksOutlined,
  LocalOfferOutlined,
  LocalShippingOutlined,
  LocalMallOutlined,
  LocationOnOutlined,
  PointOfSaleOutlined,
  ReceiptOutlined,
  ReceiptLongOutlined,
  ScheduleOutlined,
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

  return (
    <Box sx={{ paddingTop: 1 }}>
      <CollapsibleSection title="Catalog" defaultOpen>
        <MenuItemLink to="/brands" primaryText="Brands" leftIcon={<LocalOfferOutlined />} />
        <MenuItemLink to="/suppliers" primaryText="Suppliers" leftIcon={<LocalShippingOutlined />} />
        <MenuItemLink to="/categories" primaryText="Categories" leftIcon={<CategoryOutlined />} />
        <MenuItemLink to="/products" primaryText="Products" leftIcon={<Inventory2Outlined />} />
        <MenuItemLink to="/variants" primaryText="Variants" leftIcon={<LayersOutlined />} />
        <MenuItemLink to="/facets" primaryText="Facets" leftIcon={<FilterListOutlined />} />
        <MenuItemLink to="/facet-values" primaryText="Facet Values" leftIcon={<TuneOutlined />} />
      </CollapsibleSection>

      <CollapsibleSection title="Orders" defaultOpen>
        <MenuItemLink to="/orders" primaryText="Orders & Payments" leftIcon={<ReceiptLongOutlined />} />
      </CollapsibleSection>

      {canManageRbac && (
        <CollapsibleSection title="Security" defaultOpen={false}>
          <MenuItemLink to="/users" primaryText="IdP Users" leftIcon={<SecurityOutlined />} />
          <MenuItemLink to="/roles" primaryText="IdP Roles" leftIcon={<SecurityOutlined />} />
        </CollapsibleSection>
      )}

      {canManageRbac && (
        <CollapsibleSection title="App Access" defaultOpen={false}>
          <MenuItemLink to="/app-users" primaryText="App Users" leftIcon={<GroupOutlined />} />
          <MenuItemLink to="/app-roles" primaryText="App Roles" leftIcon={<GroupOutlined />} />
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Tenancy" defaultOpen={false}>
        <MenuItemLink to="/subsidiaries" primaryText="Subsidiaries" leftIcon={<CorporateFareOutlined />} />
        <MenuItemLink to="/locations" primaryText="Locations" leftIcon={<LocationOnOutlined />} />
      </CollapsibleSection>

      <CollapsibleSection title="POS" defaultOpen>
        <MenuItemLink to="/pos/devices" primaryText="Devices" leftIcon={<PointOfSaleOutlined />} />
        <MenuItemLink to="/pos/shifts" primaryText="Shifts" leftIcon={<ScheduleOutlined />} />
      </CollapsibleSection>

      <CollapsibleSection title="Procurement" defaultOpen={false}>
        <MenuItemLink to="/procurement/purchase-requests" primaryText="Purchase Requests" leftIcon={<ReceiptOutlined />} />
        <MenuItemLink to="/procurement/purchase-orders" primaryText="Purchase Orders" leftIcon={<LocalMallOutlined />} />
        <MenuItemLink to="/procurement/import-shipments" primaryText="Import Shipments" leftIcon={<LocalShippingOutlined />} />
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
