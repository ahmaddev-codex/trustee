import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "listing-photos";

let cached: SupabaseClient | undefined;

// Service-role client - server-only, used to upload listing photos. Lazily
// constructed so the app can build before Supabase credentials are set.
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured - set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
