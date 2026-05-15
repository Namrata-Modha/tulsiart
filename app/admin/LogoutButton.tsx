'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center text-gray-400 hover:text-gray-700 active:text-gray-900"
      aria-label="Sign out"
      title="Sign out"
    >
      {/* Icon always visible */}
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      {/* Text only on sm+ */}
      <span className="hidden sm:inline ml-1.5 text-sm">Sign out</span>
    </button>
  )
}
