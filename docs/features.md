# Features

Status markers: `[x]` done · `[~]` in progress · `[ ]` not started

## Foundation
- [x] Next.js 16 (App Router) + TypeScript strict + Tailwind + shadcn/ui scaffold
- [x] Prisma schema (User, Listing, Order, Dispute, WebhookEvent) + Postgres driver adapter
- [x] Docker Compose Postgres for local dev
- [x] NextAuth v5 Credentials auth (signup, login, JWT session with role)
- [x] Route protection via `proxy.ts` (dashboard/sell/orders/profile require auth, admin requires ADMIN role)
- [x] TanStack Query provider + centralized query-key registry
- [x] Bold violet/lime/cyan/sand design system (APIConf-inspired) — Bricolage Grotesque + Cabinet Grotesk
- [~] Supabase Storage wiring for listing photos — code complete, needs a Supabase project (see `action-points.md`)

## Listings
- [x] Browse active listings (homepage)
- [x] Listing detail page
- [x] Create listing (`/sell/new`) with photo upload
- [x] Dashboard (my listings / buying / selling tabs)

## Escrow — funding
- [x] Monnify integration layer (`src/lib/monnify/*`): token client, Checkout/Initialize Transaction, Verify Transaction, Name Enquiry, Get Banks, Single Transfer, Authorize Transfer — all endpoint paths confirmed live against Monnify sandbox except the OTP authorize/resend/status paths (see `action-points.md`)
- [x] Order creation on "Buy" + redirect to Monnify Checkout — verified live: real `checkoutUrl` and virtual account returned from sandbox
- [x] `/api/webhooks/monnify` receiver (idempotent via `WebhookEvent`, re-verifies via Verify Transaction API rather than trusting the payload)
- [x] Verify-Transaction fallback on redirect-back (belt-and-suspenders per Monnify's own guidance)

## Escrow — release
- [x] Seller "mark shipped" + auto-release timer — verified live end-to-end
- [x] Buyer "confirm receipt" → disbursement to seller (blocked on Monnify enabling disbursements — see `action-points.md`)
- [x] `/admin` OTP-authorization screen for `PENDING_AUTHORIZATION` disbursements
- [x] Dispute flow (raise, admin resolution: release or refund) — verified live end-to-end
- [x] Refund flow (seller never ships within grace period)
- [x] Seller/buyer bank-details page with live Name Enquiry verification

## AI assist (Groq)
- [x] `src/lib/groq.ts` — thin wrapper around Groq's chat-completions API (JSON-mode)
- [x] Dispute-resolution suggestion: admin can request an AI take (RELEASE/REFUND/UNCLEAR + reasoning) on `/admin` before resolving a dispute — advisory only, admin still clicks the final action
- [x] Scam-signal listing screening: new listings are screened at creation time (best-effort, never blocks creation on a Groq failure); flagged listings surface in a `/admin` review queue with dismiss/remove actions

## Submission polish
- [ ] Final README walkthrough + demo script
- [ ] Screenshots/recording for the submission writeup
