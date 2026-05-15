import Link from 'next/link'
import AddProductModal from './AddProductModal'
import LogoutButton from './LogoutButton'

type Props = {
  title: string
  showAddProduct?: boolean
}

export default function AdminHeader({ title, showAddProduct = false }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <h1 className="text-base font-semibold text-gray-900 shrink-0">{title}</h1>

        <div className="flex items-center">
          {/* "Store ↗" hidden on mobile — shown in page content instead */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center justify-center min-h-[44px] px-3 text-sm text-gray-500 hover:text-gray-900 whitespace-nowrap"
          >
            Store ↗
          </Link>

          <Link
            href="/admin/sales"
            className="flex items-center justify-center min-h-[44px] px-2 sm:px-3 text-sm text-gray-500 hover:text-gray-900 whitespace-nowrap"
          >
            Sales
          </Link>

          <Link
            href="/admin/settings"
            className="flex items-center justify-center min-h-[44px] px-2 sm:px-3 text-sm text-gray-500 hover:text-gray-900 whitespace-nowrap"
          >
            Settings
          </Link>

          {/* Logout — icon on mobile, text on desktop */}
          <div className="flex items-center justify-center min-h-[44px] px-2 sm:px-3">
            <LogoutButton />
          </div>

          {showAddProduct && (
            <div className="ml-1">
              <AddProductModal />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
