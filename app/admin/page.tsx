import Link from 'next/link'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import AdminHeader from './AdminHeader'
import EditProductDrawer from './EditProductDrawer'
import MarkSoldButton from './MarkSoldButton'

const PER_PAGE = 6

type Product = {
  id: string
  name: string
  description: string | null
  quantity: number
  cost_price: number | null
  is_sold: boolean
  product_images: { image_url: string }[]
}

const STORAGE_MAX_IMAGES = 150 // proxy: 150 images ≈ 1 GB on Supabase free tier

async function getProducts(page: number) {
  const supabase = createSupabaseAdminClient()
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const { data, error, count } = await supabase
    .from('products')
    .select(
      `id, name, description, quantity, cost_price, is_sold, product_images(image_url)`,
      { count: 'exact' }
    )
    .eq('product_images.is_cover', true)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { products: (data ?? []) as Product[], total: count ?? 0 }
}

async function getImageCount(): Promise<number> {
  const supabase = createSupabaseAdminClient()
  const { count } = await supabase
    .from('product_images')
    .select('id', { count: 'exact', head: true })
  return count ?? 0
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const [{ products, total }, imageCount] = await Promise.all([
    getProducts(page),
    getImageCount(),
  ])
  const totalPages = Math.ceil(total / PER_PAGE)
  const storagePercent = Math.min(100, Math.round((imageCount / STORAGE_MAX_IMAGES) * 100))
  const barColor =
    storagePercent >= 90 ? '#ef4444' :
    storagePercent >= 70 ? '#eab308' :
    '#22c55e'

  return (
    <div className="min-h-screen bg-gray-50">

      <AdminHeader title="Products" showAddProduct />

      {/* ── Storage bar — always visible, thin strip below header ── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-2">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5">
          <span className="text-[11px] text-gray-400 shrink-0 tabular-nums w-[72px]">
            Storage {storagePercent}%
          </span>
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${storagePercent}%`, background: barColor }}
            />
          </div>
          <span className="text-[11px] text-gray-300 shrink-0 tabular-nums">
            {imageCount}/{STORAGE_MAX_IMAGES}
          </span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        {/* Store link — visible on mobile where header hides it */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="sm:hidden inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 min-h-[44px]"
        >
          Store ↗
        </Link>

        {total === 0 ? (
          <p className="text-sm text-gray-400 text-center py-24">No products yet.</p>
        ) : (
          <>
            {/* ── Mobile list (default) ── */}
            <div className="sm:hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
              {products.map((product) => {
                const coverUrl = product.product_images[0]?.image_url ?? null
                const sold = product.is_sold
                return (
                  <div key={product.id} className={`p-4 ${sold ? 'opacity-50' : ''}`}>
                    {/* Top row: thumb + info */}
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {coverUrl
                          ? <img src={coverUrl} alt="" className="h-full w-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                          : null}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[15px] font-semibold text-gray-900 truncate">{product.name}</p>
                          <span className={`shrink-0 text-xs font-bold uppercase tracking-wide ${sold ? 'text-gray-300' : 'text-green-600'}`}>
                            {sold ? 'Sold' : 'Live'}
                          </span>
                        </div>
                        {product.description && (
                          <p className="text-sm text-gray-500 truncate">{product.description}</p>
                        )}
                        <p className="text-sm text-gray-400">Qty: {product.quantity}</p>
                      </div>
                    </div>

                    {/* Action buttons — full-width, 44px each */}
                    <div className="flex gap-2 mt-3">
                      <EditProductDrawer
                        productId={product.id}
                        initialDescription={product.description}
                        initialQuantity={product.quantity}
                        initialCostPrice={product.cost_price}
                        coverImageUrl={coverUrl}
                        className="flex-1 min-h-[44px] rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                      />
                      <MarkSoldButton
                        productId={product.id}
                        productName={product.name}
                        isSold={sold}
                        className="flex-1 min-h-[44px] rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Desktop table (sm+) ── */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                    <th className="pl-4 pr-2 py-3 w-14" />
                    <th className="px-2 py-3">Name</th>
                    <th className="px-2 py-3">Description</th>
                    <th className="px-2 py-3 text-center">Qty</th>
                    <th className="px-2 py-3">Status</th>
                    <th className="pl-2 pr-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => {
                    const coverUrl = product.product_images[0]?.image_url ?? null
                    const sold = product.is_sold
                    return (
                      <tr key={product.id} className={sold ? 'opacity-50' : ''}>
                        <td className="pl-4 pr-2 py-3">
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100">
                            {coverUrl && <img src={coverUrl} alt="" className="h-full w-full object-cover" />} {/* eslint-disable-line @next/next/no-img-element */}
                          </div>
                        </td>
                        <td className="px-2 py-3 max-w-[180px]">
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        </td>
                        <td className="px-2 py-3 max-w-[220px]">
                          <p className="text-gray-400 truncate">{product.description ?? '—'}</p>
                        </td>
                        <td className="px-2 py-3 text-center text-gray-600">{product.quantity}</td>
                        <td className="px-2 py-3">
                          <span className={`text-xs font-bold uppercase tracking-wide ${sold ? 'text-gray-300' : 'text-green-600'}`}>
                            {sold ? 'Sold' : 'Live'}
                          </span>
                        </td>
                        <td className="pl-2 pr-4 py-3">
                          <div className="flex items-center justify-end gap-4 whitespace-nowrap">
                            <EditProductDrawer
                              productId={product.id}
                              initialDescription={product.description}
                              initialQuantity={product.quantity}
                              initialCostPrice={product.cost_price}
                              coverImageUrl={coverUrl}
                              className="text-sm text-gray-400 hover:text-gray-800"
                            />
                            <MarkSoldButton
                              productId={product.id}
                              productName={product.name}
                              isSold={sold}
                              className="text-sm text-gray-400 hover:text-gray-800 disabled:opacity-40"
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5">
                {page > 1
                  ? <Link href={`?page=${page - 1}`} className="flex items-center min-h-[44px] px-1 text-sm text-gray-500 hover:text-gray-900">← Previous</Link>
                  : <span />}
                <span className="text-sm text-gray-400">{page} / {totalPages}</span>
                {page < totalPages
                  ? <Link href={`?page=${page + 1}`} className="flex items-center min-h-[44px] px-1 text-sm text-gray-500 hover:text-gray-900">Next →</Link>
                  : <span />}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
