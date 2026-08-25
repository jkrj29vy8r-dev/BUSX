import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Resolves the current Supabase user, if any, WITHOUT letting an auth
 * service hiccup (or a misconfigured environment) take down a route that
 * should work for guest checkout. Guest booking is a first-class flow here
 * — origin/destination search, seat locking, and ticket purchase all accept
 * an anonymous caller — so a failed session lookup degrades to "anonymous"
 * rather than 500ing the request.
 */
export async function getOptionalUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
