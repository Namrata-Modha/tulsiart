import Link from 'next/link'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import AdminHeader from '../AdminHeader'
import SettingsForm from './SettingsForm'

async function getOwnerInfo() {
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase
    .from('owner_info')
    .select('name, contact_number, instructions')
    .limit(1)
    .maybeSingle()
  return data ?? null
}

export default async function SettingsPage() {
  const ownerInfo = await getOwnerInfo()

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Settings" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 min-h-[44px]"
        >
          ← Products
        </Link>

        <div className="mt-2 rounded-xl border border-gray-200 bg-white px-5 py-6">
          <SettingsForm initialData={ownerInfo} />
        </div>
      </main>
    </div>
  )
}
