import Link from 'next/link'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import AdminHeader from '../AdminHeader'

type ProductRow = {
  id: string
  name: string
  cost_price: number | null
  is_sold: boolean
  created_at: string
  product_images: { image_url: string }[]
}

async function getStats() {
  const supabase = createSupabaseAdminClient()

  // Live items count
  const { count: liveCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_sold', false)

  // Sold this month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

  const { count: soldThisMonth } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .gte('sold_at', monthStart)
    .lt('sold_at', nextMonthStart)

  // Inventory cost — fetch cost_price for all live items
  const { data: liveItems } = await supabase
    .from('products')
    .select('cost_price')
    .eq('is_sold', false)

  const inventoryCost = (liveItems ?? []).reduce((sum, p) => sum + (p.cost_price ?? 0), 0)
  const isPartial = (liveItems ?? []).some((p) => p.cost_price === null)

  return {
    liveCount: liveCount ?? 0,
    soldThisMonth: soldThisMonth ?? 0,
    inventoryCost,
    isPartial,
  }
}

async function getAllProducts(): Promise<ProductRow[]> {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('products')
    .select('id, name, cost_price, is_sold, created_at, product_images(image_url)')
    .eq('product_images.is_cover', true)
    .order('is_sold', { ascending: true })   // live (false) first
    .order('created_at', { ascending: false }) // newest first within each group

  if (error) throw error
  return (data ?? []) as ProductRow[]
}

function formatCurrency(value: number) {
  return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function SalesPage() {
  const [stats, products] = await Promise.all([getStats(), getAllProducts()])

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Sales" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 min-h-[44px]"
        >
          ← Products
        </Link>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Live items */}
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-none">Live</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stats.liveCount}</p>
            <p className="mt-0.5 text-xs text-gray-400">items</p>
          </div>

          {/* Sold this month */}
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-none">Sold</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stats.soldThisMonth}</p>
            <p className="mt-0.5 text-xs text-gray-400">this month</p>
          </div>

          {/* Inventory cost */}
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-none">Cost</p>
            <p className="mt-2 text-lg font-bold text-gray-900 leading-tight break-all">
              {formatCurrency(stats.inventoryCost)}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {stats.isPartial ? 'partial' : 'inventory'}
            </p>
          </div>
        </div>

        {/* ── Product list ── */}
        {products.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No products yet.</p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
            {products.map((product) => {
              const coverUrl = product.product_images[0]?.image_url ?? null
              const sold = product.is_sold
              return (
                <div key={product.id} className={`flex items-center gap-3 px-4 py-3 ${sold ? 'opacity-50' : ''}`}>
                  {/* Thumbnail */}
                  <div className="h-10 w-10 shrink-0 rounded-md overflow-hidden bg-gray-100">
                    {coverUrl
                      ? <img src={coverUrl} alt="" className="h-full w-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                      : null}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">
                        {product.cost_price != null ? formatCurrency(product.cost_price) : '—'}
                      </span>
                      <span className="text-gray-200 text-xs">·</span>
                      <span className="text-xs text-gray-400">{formatDate(product.created_at)}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`shrink-0 text-xs font-bold uppercase tracking-wide ${sold ? 'text-gray-300' : 'text-green-600'}`}>
                    {sold ? 'Sold' : 'Live'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
