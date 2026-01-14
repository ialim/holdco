"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type TenantContextState = {
  groupId: string;
  subsidiaryId: string;
  locationId?: string;
  channel: string;
};

type TenantContextValue = {
  tenant: TenantContextState;
  setTenant: (tenant: TenantContextState) => void;
};

const STORAGE_KEY = "holdco.admin.tenant";
const DEFAULT_TENANT: TenantContextState = {
  groupId: "",
  subsidiaryId: "",
  locationId: "",
  channel: "admin_ops"
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function readTenantContext(): TenantContextState {
  if (typeof window === "undefined") return DEFAULT_TENANT;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_TENANT;
  try {
    const parsed = JSON.parse(raw) as TenantContextState;
    return { ...DEFAULT_TENANT, ...parsed };
  } catch {
    return DEFAULT_TENANT;
  }
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenantState] = useState<TenantContextState>(DEFAULT_TENANT);

  useEffect(() => {
    setTenantState(readTenantContext());
  }, []);

  const setTenant = (next: TenantContextState) => {
    setTenantState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  const value = useMemo(() => ({ tenant, setTenant }), [tenant]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
}
