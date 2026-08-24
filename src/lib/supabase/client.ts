"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Subject to RLS — safe to use directly from
 * client components (seat map subscriptions, auth, reading public trip data).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
