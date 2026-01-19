"use client";

import { Box, Collapse, List, ListItemButton, Typography } from "@mui/material";
import {
  AccountBalanceOutlined,
  ExpandLess,
  ExpandMore,
  HandshakeOutlined,
  Inventory2Outlined,
  LayersOutlined,
  LocalMallOutlined,
  ReceiptOutlined
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
  const canViewCatalog =
    permissionList.includes("*") ||
    permissionList.includes("catalog.product.read") ||
    permissionList.includes("catalog.variant.read");
  const canViewResellers =
    permissionList.includes("*") ||
    permissionList.includes("credit.reseller.read") ||
    permissionList.includes("credit.reseller.write");
  const canViewCreditAccounts =
    permissionList.includes("*") ||
    permissionList.includes("credit.account.read") ||
    permissionList.includes("credit.account.write");
  const canManageRepayments =
    permissionList.includes("*") ||
    permissionList.includes("credit.repayment.write");
  const canViewCreditReport =
    permissionList.includes("*") ||
    permissionList.includes("reports.credit");
  const canViewWholesaleOrders =
    permissionList.includes("*") ||
    permissionList.includes("orders.read") ||
    permissionList.includes("orders.write") ||
    permissionList.includes("orders.fulfill");
  const canViewWholesaleSection =
    canViewResellers ||
    canViewCreditAccounts ||
    canManageRepayments ||
    canViewCreditReport ||
    canViewWholesaleOrders;

  return (
    <Box sx={{ paddingTop: 1 }}>
      {canViewCatalog && (
        <CollapsibleSection title="Catalog" defaultOpen>
          <MenuItemLink to="/products" primaryText="Products" leftIcon={<Inventory2Outlined />} />
          <MenuItemLink to="/variants" primaryText="Variants" leftIcon={<LayersOutlined />} />
        </CollapsibleSection>
      )}

      {canViewWholesaleSection && (
        <CollapsibleSection title="Reseller & Wholesale" defaultOpen>
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
    </Box>
  );
}
