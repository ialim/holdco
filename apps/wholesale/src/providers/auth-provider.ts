import type { AuthProvider } from "react-admin";
import { clearAuthTokens, getAuthTokens, setAuthTokens } from "../lib/auth-storage";
import { decodeJwt } from "../lib/jwt";
import { buildLogoutUrl, refreshTokens, startOidcLogin } from "../lib/oidc";

export const authProvider: AuthProvider = {
  login: async () => {
    await startOidcLogin();
    return Promise.resolve();
  },
  logout: async () => {
    const tokens = getAuthTokens();
    clearAuthTokens();
    if (typeof window !== "undefined" && tokens?.idToken) {
      window.location.href = buildLogoutUrl(tokens.idToken);
    }
    return Promise.resolve();
  },
  checkAuth: async () => {
    const tokens = getAuthTokens();
    if (!tokens?.accessToken) {
      return Promise.reject();
    }
    if (tokens.expiresAt && tokens.expiresAt <= Date.now()) {
      if (!tokens.refreshToken) {
        clearAuthTokens();
        return Promise.reject();
      }
      try {
        const refreshed = await refreshTokens(tokens.refreshToken);
        setAuthTokens({
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token || tokens.refreshToken,
          idToken: refreshed.id_token || tokens.idToken,
          expiresAt: Date.now() + (refreshed.expires_in || 0) * 1000
        });
        return Promise.resolve();
      } catch {
        clearAuthTokens();
        return Promise.reject();
      }
    }
    return Promise.resolve();
  },
  checkError: async (error) => {
    if (error?.status === 401 || error?.status === 403) {
      clearAuthTokens();
      return Promise.reject();
    }
    return Promise.resolve();
  },
  getPermissions: async () => {
    const tokens = getAuthTokens();
    const payload = tokens?.accessToken ? decodeJwt(tokens.accessToken) : null;
    if (!payload) return [];
    const clientId = process.env.NEXT_PUBLIC_AUTH_CLIENT_ID;
    const clientRoles =
      clientId && payload.resource_access && payload.resource_access[clientId]
        ? payload.resource_access[clientId].roles
        : undefined;
    const permissions =
      payload.permissions ||
      payload.roles ||
      payload.realm_access?.roles ||
      clientRoles ||
      [];
    return Array.isArray(permissions) ? permissions : [];
  },
  getIdentity: async () => {
    const tokens = getAuthTokens();
    const payload = tokens?.accessToken ? decodeJwt(tokens.accessToken) : null;
    if (!payload) {
      return { id: "anonymous", fullName: "Anonymous" };
    }
    return {
      id: payload.sub || payload.user_id || "unknown",
      fullName: payload.name || payload.email || payload.preferred_username || "User",
      avatar: payload.picture
    };
  }
};
