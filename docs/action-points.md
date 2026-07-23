# Action points

Manual steps only you can complete — these can't be automated from code.

## Monnify (blocking the payout/release side of the demo)

- [ ] **Enable disbursements on your sandbox account.** Email
  `integration-support@monnify.com` and ask them to enable disbursements for
  your sandbox contract. Confirmed live against your sandbox key: the
  `/api/v2/disbursements/single` call is reachable and validates fields
  correctly, but your current API key's JWT scopes have no disbursement
  authority — payouts will fail until this is enabled.
- [x] **Get your Monnify Wallet Account Number** from the dashboard
  (Settlement/Wallet section) and set it as `MONNIFY_WALLET_ACCOUNT_NUMBER`
  in `.env`. This is required as `sourceAccountNumber` on every disbursement
  call — confirmed live (`sourceAccountNumber must not be blank` without it).
- [ ] **Whitelist your server's static IP** for Live disbursements before
  going to production (not required for Sandbox testing).
- [ ] Once disbursements are enabled, do one real end-to-end release to
  confirm the OTP endpoints in `src/lib/monnify/disbursements.ts`
  (`authorizeSingleTransfer`, `resendSingleTransferOtp`,
  `getSingleTransferStatus`) — their exact paths are based on Monnify's
  documented endpoint *names* but weren't independently verified against a
  live call (disbursements were disabled on this key at build time).
- [ ] Register your webhook URL in the Monnify dashboard (Settings →
  Webhook URL) — pointed at a tunnel (ngrok/cloudflared) for local dev, or
  your deployed URL in production. See README for the local-tunnel steps.

## Supabase (blocking listing photo upload)

- [x] Create a Supabase project, then set `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
- [x] Create a public Storage bucket named `listing-photos` (or update
  `SUPABASE_STORAGE_BUCKET` to match) with public read access, since listing
  photo URLs are rendered directly in `<Image>` with `unoptimized` — no
  signed URLs.
- [x] For production, point `DATABASE_URL` at the same Supabase project's
  Postgres connection string (pooled connection recommended) instead of the
  local Docker instance.

## Resend (blocking password-reset emails)

- [ ] **Create a free Resend account** at https://resend.com and generate an
  API key, then set `RESEND_API_KEY` in `.env`. Until this is set, "Forgot
  password" still works end-to-end (token issued, stored, expires correctly)
  but the email never actually sends — check the server logs for "Failed to
  send password reset email" if a user reports not receiving one.
- [ ] The default `EMAIL_FROM` (`onboarding@resend.dev`) works immediately
  with no domain setup — only change it if you verify your own sending
  domain in the Resend dashboard.

## Nice-to-haves, not blocking

- Monnify has an official MCP server (`docs/integration/mcp-server`) that
  would let an AI client query live sandbox data (banks, transaction status)
  directly — could replace some of the manual `curl` verification used
  while building this if you want tighter iteration next time.
