"use client";

import { AppBar, Layout, type AppBarProps, type LayoutProps, TitlePortal } from "react-admin";
import { Box, Typography } from "@mui/material";
import { AppMenu } from "./AppMenu";
import { TenantSelector } from "./TenantSelector";

function AdminAppBar(props: AppBarProps) {
  return (
    <AppBar {...props} color="transparent" elevation={0} sx={{ color: "#1C1B18" }}>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2, paddingY: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="h6" sx={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
            HoldCo
          </Typography>
          <Typography variant="caption" sx={{ letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Admin Ops
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TitlePortal />
        </Box>
        <Box sx={{ flex: 1 }} />
        <TenantSelector />
      </Box>
    </AppBar>
  );
}

export function AppLayout(props: LayoutProps) {
  return <Layout {...props} appBar={AdminAppBar} menu={AppMenu} />;
}
