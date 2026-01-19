"use client";

import { AppBar, Layout, type AppBarProps, type LayoutProps, TitlePortal } from "react-admin";
import { Box, Typography } from "@mui/material";
import { AppMenu } from "./AppMenu";
import { TenantSelector } from "./TenantSelector";
import { useEffect, useRef } from "react";

function AdminAppBar(props: AppBarProps) {
  const appBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!appBarRef.current) return;
    const setHeightVar = () => {
      const measured = appBarRef.current?.getBoundingClientRect().height ?? 0;
      const height = Math.max(measured, 96);
      document.documentElement.style.setProperty("--appbar-height", `${height}px`);
    };
    setHeightVar();
    const observer = new ResizeObserver(setHeightVar);
    observer.observe(appBarRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={appBarRef}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 2
      }}
    >
      <AppBar
        {...props}
        color="transparent"
        elevation={2}
        position="static"
        sx={{
          color: "#1C1B18",
          backgroundColor: "rgba(255, 253, 250, 0.98)",
          borderBottom: "1px solid #E3DED3",
          backdropFilter: "blur(10px)",
          transition: "background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2, paddingY: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="h6" sx={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
            HoldCo
          </Typography>
          <Typography variant="caption" sx={{ letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Wholesale Ops
          </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TitlePortal />
          </Box>
          <Box sx={{ flex: 1 }} />
          <TenantSelector />
        </Box>
      </AppBar>
    </Box>
  );
}

export function AppLayout(props: LayoutProps) {
  return <Layout {...props} appBar={AdminAppBar} menu={AppMenu} />;
}
