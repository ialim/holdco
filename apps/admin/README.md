# HoldCo Admin UI

Custom Admin/Ops UI scaffold (Next.js + React-Admin) with OIDC-ready auth and tenancy context headers.

## Prereqs
- Node 18+.
- API running on `http://localhost:3000`.
- Keycloak (or compatible OIDC provider) configured for a public client.

## Env vars
Create `apps/admin/.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/v1
NEXT_PUBLIC_AUTH_ISSUER=https://id.example.com/realms/holdco
NEXT_PUBLIC_AUTH_CLIENT_ID=holdco-admin
NEXT_PUBLIC_AUTH_REDIRECT_URI=http://localhost:3001/auth/callback
NEXT_PUBLIC_AUTH_POST_LOGOUT_REDIRECT_URI=http://localhost:3001
```

## Run
```
npm --prefix apps/admin install
npm --prefix apps/admin run dev
```

The app runs on `http://localhost:3001` by default.

## Notes
- Ensure your Keycloak client allows PKCE and has CORS enabled for `http://localhost:3001`.
