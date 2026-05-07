import { createClient } from '@supabase/supabase-js'

// Service-role client for admin server-side data fetching.
// Bypasses RLS — only use in server code behind the proxy auth guard.
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
