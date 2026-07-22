# Trustee

Escrow for P2P classifieds, powered by [Monnify](https://developers.monnify.com/). A buyer's payment is held in escrow until they confirm the item arrived — the seller is only paid out once the buyer is satisfied.

Built for the Monnify Developer Challenge.

## Why

Buying from informal listings (Jiji/Marketplace-style) carries real scam risk: payment happens before the buyer can verify the goods. Trustee removes that risk using Monnify's Checkout, Verification, Disbursement, and Webhook APIs to hold and release funds.

## Stack

- Next.js 16 (App Router) + TypeScript, Tailwind CSS + shadcn/ui
- TanStack Query for client-side data fetching
- NextAuth v5 (Credentials) + Prisma 7 (Postgres, via `@prisma/adapter-pg`)
- Supabase (Postgres in production, Storage for listing photos)
- Monnify sandbox APIs for Checkout, Verification, and Disbursements

## Local setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start Postgres locally**

   ```bash
   docker compose up -d
   ```

   This runs Postgres 16 on `localhost:5432` (user/password/db: `trustee`).
   If port `5432` is already taken by another local Postgres, either stop
   that one or change the host port in `docker-compose.yml` and
   `DATABASE_URL` together.

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in:
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `MONNIFY_API_KEY`, `MONNIFY_SECRET_KEY`, `MONNIFY_CONTRACT_CODE` — from your [Monnify sandbox dashboard](https://developers.monnify.com/)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase project (used for Storage; Postgres itself can stay local via Docker for dev)

4. **Run the database migration**

   ```bash
   pnpm exec prisma migrate dev
   ```

5. **Seed the admin account**

   ```bash
   pnpm seed
   ```

   Creates (or promotes) an admin user so you can reach `/admin`. Defaults to
   `admin@trustee.dev` / `AdminPassword123!` — override with `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`, `ADMIN_NAME` in `.env` first if you want different
   credentials. Re-running it against an existing email just promotes that
   account to `ADMIN` without touching its password.

6. **Start the app**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Testing Monnify webhooks locally

Monnify webhook URLs are registered in the Monnify dashboard, not via API — so
local testing needs a public tunnel:

```bash
ngrok http 3000
# or: cloudflared tunnel --url http://localhost:3000
```

Then register `https://<your-tunnel>.ngrok.io/api/webhooks/monnify` as the
Transaction Completion webhook URL in your sandbox dashboard.

Note: Monnify's **sandbox** does not send the `monnify-signature` header
(production only) — signature verification in this codebase is skipped in
non-production environments accordingly.

## Demo walkthrough

1. **Sign up twice** — once as a seller, once as a buyer (two browsers/incognito windows, or two accounts).
2. **Seller**: add a payout bank account at `/profile/bank-details` — it's verified live against Monnify's Name Enquiry API before saving.
3. **Seller**: create a listing at `/sell/new` with a photo.
4. **Buyer**: open the listing and click **Buy — pay into escrow**. You're redirected to Monnify's hosted checkout.
5. **Sandbox payment**: on the checkout page, switch to *Pay with Transfer* and use the [Monnify Bank Simulator](https://websim.sdk.monnify.com/?#/bankingapp) to complete the transfer for the exact amount shown.
6. Back on Trustee, the order flips to **Funds in escrow** (via webhook, or the redirect-back page's own Verify Transaction fallback if the webhook hasn't arrived yet).
7. **Seller**: marks the order **Shipped** from the order page.
8. **Buyer**: clicks **Confirm receipt** — this triggers the Monnify disbursement to the seller's verified account.
   - If Monnify's MFA/OTP is enabled on the account (the default), the transfer shows up on `/admin` waiting for the OTP emailed to the account owner. Paste it in to authorize — the order then flips to **Released**.
   - See [`docs/action-points.md`](docs/action-points.md) for the one-time Monnify account setup (enabling disbursements, wallet account number) needed before this step works.
9. **Disputes**: instead of confirming, the buyer can **Report a problem** — this opens the order to an admin, who resolves it from `/admin` by releasing to the seller or refunding the buyer.

## Project docs

- [`docs/features.md`](docs/features.md) — feature checklist and build status
- [`docs/action-points.md`](docs/action-points.md) — manual setup steps only you can complete (Monnify account config, Supabase project)
