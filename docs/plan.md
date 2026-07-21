# Trustee — P2P Classifieds Escrow (Monnify Developer Challenge)

## Context

The user is building a submission for the Monnify Developer Challenge: an app "powered by Monnify APIs" solving a real problem, judged on practical value, clarity/storytelling, technical depth, and clean/onboarding-friendly setup. After brainstorming several directions (tutor escrow, ajo/thrift savings, payroll, hospital deposits, classifieds escrow), the user chose **P2P classifieds escrow**: buying from informal listings (Jiji/Marketplace-style) carries real, widely-felt scam risk in Nigeria because payment happens before the buyer can verify the goods. Trustee removes that risk by holding the buyer's payment in escrow until they confirm receipt, then releasing it to the seller — with Monnify's collection, verification, disbursement, and webhook APIs doing the actual work.

This is a brand-new project, to be created at `~/projects/trustee`, separate from the `learnn`/`learnn-backend` repos. It should feel familiar to the user's existing stack conventions where sensible (confirmed via exploration of `learnn`), but is a full-stack app in its own right (learnn's frontend has no DB/ORM of its own — it calls a separate backend; Trustee needs to own its full stack).

## Confirmed decisions (from user + research)

- **Location/name**: `~/projects/trustee`, new git repo.
- **Stack**: Next.js full-stack (App Router), single repo.
- **Database**: Postgres — Docker Compose locally, Supabase Postgres in production. Supabase is used for **DB + Storage only** (not Supabase Auth) — auth stays as NextAuth so local dev is just `docker compose up`, no need to self-host the full Supabase stack.
- **Monnify creds**: user already has sandbox API key/secret/contract code.
- **Reserved Accounts vs one-time Checkout**: researched Monnify docs directly — Reserved Accounts are explicitly a **permanent per-customer** construct (require BVN, "every payment to that account is associated with the customer"), not meant for per-order collection. The correct fit for "buyer pays for this one specific order" is the **Checkout/Initialize Transaction API** with a unique `paymentReference` per Order, confirmed server-side via the Verify Transactions API (Monnify's own docs warn never to trust redirect params alone).
- **Disbursement OTP/MFA**: Monnify disbursements have MFA-via-OTP **enabled by default** — a payout call returns `PENDING_AUTHORIZATION` until the OTP (emailed to the account owner) is submitted via the Authorize Transfer API. User chose to build an **admin-authorizes-payout screen** rather than wait on Monnify support to disable MFA — this also doubles as a legitimate "dual-control on money movement" trust feature for the pitch.
- **Webhook signature**: header `monnify-signature`, HMAC-SHA512(secret + raw body) — but **sandbox does not send this header** (production only). Webhook registration itself is done via the Monnify dashboard, not an API call, so local testing needs a public tunnel (ngrok/cloudflared) — this must be called out in setup docs.

## Stack (mirrors `learnn` where it makes sense, deviates with reasons)

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript `strict`, pnpm | Matches learnn exactly |
| Styling | Tailwind CSS + **shadcn/ui** | learnn hand-rolls its own component kit, but that's an investment made over time in a mature app. Trustee has no existing design system and needs a polished, judge-facing UI fast — shadcn gives accessible, good-looking components out of the box. |
| Server state | TanStack Query, with a centralized `src/lib/query-keys.ts` registry and a single `apiFetch` wrapper | Directly mirrors the pattern learnn just migrated 47 pages to — same mental model, proven convention |
| Forms/validation | react-hook-form + zod | learnn hand-rolls forms with `useState`, but Trustee's forms feed bank details and amounts directly into Monnify payment/transfer calls — schema validation earns its keep here where learnn's forms don't touch money |
| Auth | NextAuth v5, Credentials provider, JWT session | Same library as learnn, but backed directly by Prisma/Postgres (learnn's NextAuth calls an external backend; Trustee owns its own DB) |
| DB/ORM | Prisma → Postgres | learnn's frontend has no DB of its own; Prisma is the natural default for a full-stack Next.js app and pairs cleanly with Supabase's connection string |
| File storage | Supabase Storage (listing photos) | Stateless object storage — no need to swap local vs. prod like the DB does, so dev always hits the same Supabase bucket even before `docker compose up` for Postgres |
| Lint | ESLint `next/core-web-vitals`, no Prettier | Matches learnn |

## Domain model (Prisma)

- **User** — id, name, email, passwordHash, role (`USER`/`ADMIN`), bankAccountNumber, bankCode, bankAccountName (set only after a successful Monnify name-enquiry), createdAt
- **Listing** — id, sellerId, title, description, priceKobo, imageUrls (String[], Supabase Storage URLs), category, status (`ACTIVE`/`SOLD`/`REMOVED`), createdAt
- **Order** — id, listingId, buyerId, sellerId, amountKobo, platformFeeKobo, status, monnifyPaymentReference (unique), monnifyTransactionRef, monnifyDisbursementReference, fundedAt, shippedAt, autoReleaseAt, releasedAt, refundedAt, createdAt
  - `status`: `AWAITING_PAYMENT → FUNDED → SHIPPED → RELEASED` (happy path), with `DISPUTED`, `REFUNDED`, `CANCELLED` branches
- **Dispute** — id, orderId, raisedById, reason, status (`OPEN`/`RESOLVED_RELEASE`/`RESOLVED_REFUND`), resolutionNote, resolvedAt
- **WebhookEvent** — id, eventType, paymentReference, rawPayload (Json), processedAt — idempotency + audit trail for webhook replays

## Monnify integration layer — `src/lib/monnify/`

- `client.ts` — Basic-Auth token exchange (`apiKey:secretKey` → bearer token, cached ~1hr), base fetch wrapper against sandbox base URL
- `transactions.ts` — `initializeTransaction()` (Checkout API, `paymentReference = order_<orderId>`) and `verifyTransaction()` (server-side confirmation, used both by the redirect-back page and as a fallback when webhooks haven't arrived yet)
- `verification.ts` — `nameEnquiry(accountNumber, bankCode)` (run when a seller saves bank details — reject silently-wrong account numbers before they ever matter) and `getBanks()` for the bank picker
- `disbursements.ts` — `initiateSingleTransfer()` (payout on confirm-receipt / refund / dispute resolution) and `authorizeTransfer(reference, otp)` (admin OTP step)
- `webhookVerify.ts` — HMAC-SHA512 signature check, skipped only in sandbox/dev (documented as a must-fix-before-going-live TODO, since sandbox doesn't send the header at all)

## Core flows

1. **List & buy**: seller creates a `Listing`; buyer clicks Buy → creates an `Order` (`AWAITING_PAYMENT`), platform fee computed (`PLATFORM_FEE_BPS` env, default 5%) and shown transparently before payment, `initializeTransaction()` called, buyer redirected to Monnify's `checkoutUrl`.
2. **Funding confirmation**: buyer completes payment on Monnify's hosted page → redirected to `/orders/[id]` → page calls `verifyTransaction()` server-side (never trusts redirect params alone, per Monnify's own guidance) AND the `/api/webhooks/monnify` receiver independently flips the order to `FUNDED`, recording a `WebhookEvent` keyed by `paymentReference` for idempotency.
3. **Shipping**: seller marks "Shipped" → `shippedAt` set, `autoReleaseAt = shippedAt + N days` computed, status → `SHIPPED`.
4. **Release**: buyer clicks "Confirm Receipt" (or `autoReleaseAt` passes, checked lazily on order-page load) → `initiateSingleTransfer()` to the seller's verified account for `amount - fee`. If MFA returns `PENDING_AUTHORIZATION`, the transfer appears on `/admin` for OTP entry via `authorizeTransfer()`; on success status → `RELEASED`.
5. **Dispute/refund**: buyer can raise a `Dispute` instead of confirming (status → `DISPUTED`, resolved by an admin releasing to seller or refunding buyer); if a seller never ships within a grace period after funding, the buyer can request a refund through the same disbursement path, destined to their own account.

## Pages / routes

- `/` browse listings · `/listings/[id]` detail + Buy · `/sell/new` create listing (photo upload → Supabase Storage)
- `/orders/[id]` escrow timeline (pay / mark shipped / confirm receipt / dispute, contextual to role + status)
- `/dashboard` my listings / purchases / sales · `/profile/bank-details` (saved only after live name-enquiry)
- `/admin` (role-gated) — pending OTP authorizations, open disputes
- `/api/webhooks/monnify` — webhook receiver · order state transitions via route handlers/server actions under `/api/orders/*`

## Local dev / setup (judged on onboarding-friendliness)

- `docker-compose.yml` — single Postgres 16 service for local dev
- `.env.example` — `DATABASE_URL`, `MONNIFY_API_KEY`, `MONNIFY_SECRET_KEY`, `MONNIFY_CONTRACT_CODE`, `MONNIFY_BASE_URL=https://sandbox.monnify.com`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `PLATFORM_FEE_BPS`
- `README.md` — step-by-step: clone → `pnpm install` → `docker compose up -d` → copy/fill `.env.local` → `pnpm prisma migrate dev` → `pnpm dev`, plus a dedicated section on tunneling localhost (ngrok/cloudflared) and registering the webhook URL in the Monnify dashboard for local testing
- `docs/features.md` — mirrors learnn's checklist-tracker convention, useful for the submission's "clarity and storytelling" scoring

## Build order (first working slice, then layer on)

1. Scaffold repo: Next.js + TS + Tailwind + shadcn + ESLint, Prisma schema + migration, Docker Compose, `.env.example`, README skeleton
2. Auth: NextAuth Credentials + Prisma, signup/login pages
3. Listings: create/browse/detail, Supabase Storage photo upload
4. Monnify integration layer (`src/lib/monnify/*`) against sandbox, verified with a standalone script before wiring into UI
5. Order creation + Checkout redirect + webhook receiver + Verify-Transactions fallback → `FUNDED` state working end-to-end
6. Ship / confirm-receipt / disbursement + admin OTP-authorization screen → `RELEASED` state working end-to-end
7. Dispute + refund paths, `/admin` disputes screen
8. Polish pass + `docs/features.md` + final README walkthrough

## Verification

- `pnpm build` / `tsc --noEmit` clean at each milestone (per user's standing preference to catch compile errors before commit)
- Manual end-to-end run against Monnify **sandbox**: create a listing, pay via sandbox test transfer, confirm webhook + verify-transaction both land, ship, confirm receipt, authorize the OTP, and see the sandbox disbursement complete — this full loop is the actual demo for judges, so it must be run for real, not just type-checked
