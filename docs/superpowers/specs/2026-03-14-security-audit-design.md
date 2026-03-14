# Security Audit: Code-Level Hardening

**Date:** 2026-03-14
**Scope:** Code-level security audit and hardening of the Nametag SaaS application
**Approach:** Priority-driven fix list — surgical, independent changes ordered by severity

## Context

Nametag is a personal relationships manager SaaS (nametag.one) built with Next.js, Prisma, and PostgreSQL. It stores sensitive personal data (contacts, relationships, photos) and handles payments via Stripe. It integrates with external CardDAV servers for contact sync.

The existing security posture is solid: bcrypt password hashing, JWT with token blacklist, Prisma ORM (no raw SQL), Zod input validation, rate limiting, strong CSP headers, SSRF protection on CardDAV, and Stripe webhook signature verification. This audit addresses the remaining gaps.

## Breaking Changes

Two fixes invalidate existing tokens:
- **1.4 (hash email verification tokens):** Pending verification links become invalid. Tokens expire in 24h, so impact is minimal.
- **2.1 (hash password reset tokens):** Pending reset links become invalid. Same minimal impact.

All other fixes are non-breaking.

---

## Critical Priority

### 1.1 — Remove `unsafe-inline` and `unsafe-eval` from production CSP

**Problem:** `next.config.ts` includes `unsafe-inline` and `unsafe-eval` in the CSP `script-src` directive with a TODO comment. This negates XSS protection in production.

**Fix:** Remove `unsafe-eval` unconditionally. For `unsafe-inline`, switch to nonce-based CSP if Next.js hydration requires inline scripts (see 3.1 for verification). If no inline scripts are needed, remove it outright.

**Files:** `next.config.ts`

### 1.2 — Validate PHOTO_STORAGE_PATH at startup

**Problem:** `lib/photo-storage.ts` uses the configured storage path without validating it resolves to an expected directory. A misconfigured or injected env var could allow filesystem writes anywhere.

**Fix:** At startup, resolve the path to an absolute path, verify it exists and is a directory, reject paths containing `..`. Fail fast with a clear error if validation fails.

**Files:** `lib/photo-storage.ts`

### 1.3 — Add STRIPE_WEBHOOK_SECRET to env validation schema

**Problem:** The Stripe webhook handler in `app/api/webhooks/stripe/route.ts` checks for `STRIPE_WEBHOOK_SECRET` at runtime, but `lib/env.ts` doesn't require it in SaaS mode. Missing secret causes silent 500 errors on webhook delivery.

**Fix:** Add `STRIPE_WEBHOOK_SECRET` to the Zod schema in `lib/env.ts` as required when `SAAS_MODE=true`.

**Files:** `lib/env.ts`

### 1.4 — Hash email verification tokens in database

**Problem:** Verification tokens are stored as plaintext in the database. A database breach exposes all pending tokens, allowing account takeover by verifying arbitrary accounts.

**Fix:** Generate token as before (`randomBytes(32).toString('hex')`). Store `SHA-256(token)` in the `emailVerifyToken` field. On verification, hash the incoming token and compare against the stored hash. Send the unhashed token in the email link.

**Breaking change:** Pending verification tokens become invalid. Users must request a new verification email. Impact is minimal given the 24h expiry.

**Files:** `app/api/auth/register/route.ts`, `app/api/auth/verify-email/route.ts`

---

## High Priority

### 2.1 — Hash password reset tokens in database

**Problem:** Same as 1.4 — password reset tokens stored as plaintext. Database breach allows resetting any account's password.

**Fix:** Same pattern as 1.4. Store `SHA-256(token)`, compare hashes on submission.

**Breaking change:** Pending reset links invalidated. Minimal impact — tokens expire quickly.

**Files:** Password reset route handlers (create and consume endpoints)

### 2.2 — Account lockout after repeated failed logins

**Problem:** Rate limiting exists (5 attempts / 15 min) but an attacker can wait and retry indefinitely. No per-account lockout mechanism.

**Fix:**
- Add `failedLoginAttempts` (Int, default 0) and `lockedUntil` (DateTime, nullable) fields to the User model.
- On failed login: increment `failedLoginAttempts`. After N failures (configurable, default 10), set `lockedUntil` to current time + lockout duration (configurable, default 30 min).
- On successful login: reset `failedLoginAttempts` to 0 and clear `lockedUntil`.
- On login attempt while locked: reject with "account temporarily locked" message without checking password (prevents timing attacks).
- Send email notification on lockout.

**Files:** `prisma/schema.prisma`, `lib/auth.ts`

### 2.4 — Stripe webhook idempotency

**Problem:** If Stripe retries a webhook (network timeout, 5xx), the same event could be processed twice — potentially double-crediting a subscription or creating duplicate records.

**Fix:**
- Create a `StripeEvent` model with `eventId` (unique) and `processedAt` fields.
- Before processing a webhook event, check if the event ID exists in the table. If so, return 200 and skip processing.
- After successful processing, insert the event ID.
- Optionally: add a cleanup job to prune events older than 30 days.

**Files:** `prisma/schema.prisma`, `app/api/webhooks/stripe/route.ts`

### 2.5 — Prevent email verification token reuse

**Problem:** A valid verification token can be used multiple times before expiry.

**Fix:** After successful verification, set `emailVerifyToken` and `emailVerifyExpires` to `null` in the same database update that sets `emailVerified = true`.

**Files:** `app/api/auth/verify-email/route.ts`

---

## Medium Priority

### 3.1 — Verify CSP `unsafe-inline` removal is safe

**Problem:** Removing `unsafe-inline` from CSP (fix 1.1) could break the app if Next.js emits inline scripts during hydration.

**Fix:**
- Build the production app with `unsafe-inline` removed.
- Test all pages in the browser with CSP violation reporting enabled.
- If violations occur, implement nonce-based CSP using Next.js's `nonce` support (available via `headers()` in middleware).
- This is a verification step for 1.1 — may result in nonce-based CSP instead of simple removal.

**Files:** `next.config.ts`, potentially `middleware.ts`

### 3.2 — Rate limit email verification endpoint

**Problem:** `/api/auth/verify-email` has no rate limiting. While brute-forcing a 64-character hex token is computationally infeasible, rate limiting is cheap defense-in-depth.

**Fix:** Add rate limiting config: 10 attempts / 15 min per IP. Use the existing `checkRateLimit` utility.

**Files:** `app/api/auth/verify-email/route.ts`, `lib/rate-limit.ts`

### 3.3 — DNS resolution timeout for CardDAV SSRF checks

**Problem:** `dns.promises.resolve*` in `lib/carddav/url-validation.ts` has no timeout. A slow or malicious DNS server could hang the request indefinitely, tying up server resources.

**Fix:** Wrap DNS resolution calls with `AbortSignal.timeout(5000)` to enforce a 5-second timeout. Treat timeout as a validation failure (reject the URL).

**Files:** `lib/carddav/url-validation.ts`

### 3.5 — Validate photo paths at write time

**Problem:** Extending 1.2 — even with startup validation, individual file paths should be sanitized at write time to prevent path traversal via crafted `personId` or filename.

**Fix:**
- After constructing the full file path, resolve it and verify it starts with the validated `PHOTO_STORAGE_PATH` prefix.
- Reject any path that escapes the storage directory.
- Ensure `personId` and generated filenames are alphanumeric/UUID-safe (no `/`, `..`, or null bytes).

**Files:** `lib/photo-storage.ts`

---

## Low Priority

### 4.2 — Add `Permissions-Policy` header

**Problem:** No `Permissions-Policy` header is set. If XSS occurs, the attacker could access browser features like camera, microphone, or geolocation.

**Fix:** Add header restricting unused features:
```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()
```

**Files:** `next.config.ts`

### 4.3 — Add `Referrer-Policy: strict-origin-when-cross-origin`

**Problem:** No explicit referrer policy. Full URLs (potentially including tokens in paths) could leak to external sites via the Referer header.

**Fix:** Add `Referrer-Policy: strict-origin-when-cross-origin` to the security headers in `next.config.ts`.

**Files:** `next.config.ts`

### 4.4 — Enforce single-use on password reset tokens

**Problem:** Same pattern as 2.5 — a valid password reset token can be used multiple times before expiry.

**Fix:** After successful password reset, nullify the token and expiry fields in the same database update.

**Files:** Password reset consumption endpoint

---

## Out of Scope

The following were considered and explicitly excluded:

- **PII masking in logs (2.3)** — dropped per user decision
- **CardDAV sync rate limiting (3.4)** — dropped per user decision
- **Token out of URL query params (4.1)** — dropped per user decision
- **Infrastructure hardening** — Docker, network, DB access controls are out of scope
- **Security policies** — incident response, secret rotation, pen testing procedures are out of scope
- **Dependency upgrades** — next-auth beta upgrade is a separate effort
- **CardDAV encryption key rotation** — architectural change better suited for a dedicated effort

## Testing Strategy

Each fix should include:
1. Unit tests for the new behavior (e.g., token hashing comparison, path validation rejection)
2. Verification that existing tests still pass
3. Manual testing for CSP changes (browser console for CSP violations)
