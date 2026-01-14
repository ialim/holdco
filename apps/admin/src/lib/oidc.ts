const STATE_KEY = "holdco.admin.oidc";

export type OidcState = {
  state: string;
  verifier: string;
};

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(length = 48) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => charset[byte % charset.length])
    .join("");
}

async function pkceChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

export function getOidcConfig() {
  const issuer = process.env.NEXT_PUBLIC_AUTH_ISSUER || "";
  const clientId = process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || "";
  const redirectUri =
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_URI ||
    (typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "");
  const loginRedirect =
    process.env.NEXT_PUBLIC_AUTH_LOGIN_REDIRECT_URI ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const logoutRedirect =
    process.env.NEXT_PUBLIC_AUTH_POST_LOGOUT_REDIRECT_URI ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const authorizationEndpoint = `${issuer}/protocol/openid-connect/auth`;
  const tokenEndpoint = `${issuer}/protocol/openid-connect/token`;
  const logoutEndpoint = `${issuer}/protocol/openid-connect/logout`;
  return {
    issuer,
    clientId,
    redirectUri,
    loginRedirect,
    logoutRedirect,
    authorizationEndpoint,
    tokenEndpoint,
    logoutEndpoint,
  };
}

export function setOidcState(value) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STATE_KEY, JSON.stringify(value));
}

export function getOidcState() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearOidcState() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STATE_KEY);
}

export async function startOidcLogin() {
  const { authorizationEndpoint, clientId, redirectUri } = getOidcConfig();
  if (!authorizationEndpoint || !clientId) {
    throw new Error("OIDC configuration missing (issuer or client id).");
  }
  const verifier = randomString(64);
  const state = randomString(32);
  const challenge = await pkceChallenge(verifier);
  setOidcState({ state, verifier });

  const url = new URL(authorizationEndpoint);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  window.location.assign(url.toString());
}

export async function exchangeCodeForTokens(code, verifier) {
  const { tokenEndpoint, clientId, redirectUri } = getOidcConfig();
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("client_id", clientId);
  body.set("redirect_uri", redirectUri);
  body.set("code_verifier", verifier);

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Token exchange failed");
  }
  return response.json();
}

export async function refreshTokens(refreshToken) {
  const { tokenEndpoint, clientId } = getOidcConfig();
  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);
  body.set("client_id", clientId);

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Token refresh failed");
  }
  return response.json();
}

export function buildLogoutUrl(idToken) {
  const { logoutEndpoint, logoutRedirect, clientId } = getOidcConfig();
  const url = new URL(logoutEndpoint);
  if (idToken) {
    url.searchParams.set("id_token_hint", idToken);
  }
  if (clientId) {
    url.searchParams.set("client_id", clientId);
  }
  url.searchParams.set("post_logout_redirect_uri", logoutRedirect);
  return url.toString();
}
