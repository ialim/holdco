"use client";

import { AppBar, Layout, type AppBarProps, type LayoutProps, TitlePortal } from "react-admin";
import { Box, Typography, useScrollTrigger } from "@mui/material";
import { AppMenu } from "./AppMenu";
import { TenantSelector } from "./TenantSelector";

function AdminAppBar(props: AppBarProps) {
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 12 });

  return (
    <AppBar
      {...props}
      color="transparent"
      elevation={scrolled ? 3 : 0}
      position="sticky"
      sx={{
        color: "#1C1B18",
        backgroundColor: scrolled ? "rgba(255, 253, 250, 0.94)" : "transparent",
        borderBottom: scrolled ? "1px solid #E3DED3" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        transition: "background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease"
      }}
    >
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
