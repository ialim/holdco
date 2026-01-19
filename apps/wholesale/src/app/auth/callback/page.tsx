"use client";

import { useEffect, useState } from "react";
import { clearOidcState, exchangeCodeForTokens, getOidcConfig, getOidcState } from "../../../lib/oidc";
import { setAuthTokens } from "../../../lib/auth-storage";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Completing sign-in...");

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      const errorDescription = params.get("error_description");
      if (error) {
        setStatus(`${error}: ${errorDescription || "Authentication failed."}`);
        clearOidcState();
        return;
      }

      const code = params.get("code");
      const state = params.get("state");
      const stored = getOidcState();
      if (!code || !state || !stored?.verifier || stored.state !== state) {
        setStatus("Invalid or missing OIDC state.");
        clearOidcState();
        return;
      }

      try {
        const tokenResponse = await exchangeCodeForTokens(code, stored.verifier);
        setAuthTokens({
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          idToken: tokenResponse.id_token,
          expiresAt: Date.now() + (tokenResponse.expires_in || 0) * 1000
        });
        clearOidcState();
        setStatus("Sign-in complete. Redirecting...");
        const redirect = getOidcConfig().loginRedirect || "/";
        window.location.replace(redirect);
      } catch (err) {
        const message = err?.message || String(err);
        setStatus(`Token exchange failed: ${message}`);
        clearOidcState();
      }
    };

    void run();
  }, []);

  return (
    <main style={{ padding: 32, fontFamily: "Segoe UI, sans-serif" }}>
      <h1>HoldCo Admin</h1>
      <p>{status}</p>
    </main>
  );
}
