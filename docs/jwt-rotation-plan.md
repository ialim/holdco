# JWT Secret Rotation Plan

This document defines how to rotate `JWT_SECRET` safely without breaking active sessions.

## Goals
- Prevent long-lived exposure if a secret leaks.
- Maintain availability during rotation.
- Provide an auditable rotation procedure.

## Rotation approach
Use a **primary/secondary** secret strategy:
- **Primary** (`JWT_SECRET`) signs new tokens.
- **Secondary** (`JWT_SECRET_PREVIOUS`) verifies tokens during a transition window.

Verification logic should accept either secret; signing always uses the primary.

## Standard rotation steps
1) **Prepare**
   - Generate a new strong secret (32+ bytes).
   - Choose a cutover window.
2) **Deploy**
   - Set `JWT_SECRET` to the new value.
   - Set `JWT_SECRET_PREVIOUS` to the old value.
   - Deploy and verify auth flows.
3) **Transition window**
   - Keep both secrets active for at least the maximum token TTL.
   - Monitor auth failure rates and error logs.
4) **Finalize**
   - Remove `JWT_SECRET_PREVIOUS` once old tokens expire.
   - Confirm no elevated auth errors.
5) **Document**
   - Record date/time, operator, and any incident notes.

## Validation checklist
- New logins issue tokens signed by the new secret.
- Existing tokens (signed by old secret) still validate during transition.
- Unauthorized requests remain blocked.
- Metrics/alerts show no spike in auth errors.

## Frequency
- Routine: quarterly (or per compliance policy).
- Immediate: after any suspected leak.

## Notes
- Keep secrets out of logs and tickets.
- If using multiple app instances, deploy rotation consistently across all instances.
