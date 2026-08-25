import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Request-scoped Supabase client bound to the caller's session cookies.
 * Subject to RLS — this is what every read-facing API route handler should
 * use so multi-tenant scoping (passenger/operator_admin/conductor) is
 * enforced by Postgres policies, not application logic.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll called from a Server Component — safe to ignore when
            // middleware is refreshing the session.
          }
        },
      },
    }
  );
}

/**
 * Service-role client — BYPASSES ROW LEVEL SECURITY. Never expose to the
 * client bundle; import only inside `src/app/api/**` route handlers or
 * `src/lib/services/**`. Used for the small set of operations that must
 * cross tenant boundaries under controlled application logic: seat locking
 * (GiST exclusion enforcement), ticket issuance (HMAC signing), and payment
 * webhook confirmation.
 */
export function createSupabaseServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
