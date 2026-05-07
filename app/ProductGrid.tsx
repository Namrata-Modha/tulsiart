'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type ProductImage = {
  image_url: string
  is_cover: boolean
  display_order: number
}

export type StoreProduct = {
  id: string
  description: string | null
  product_images: ProductImage[]
}

type Props = {
  products: StoreProduct[]
  contactNumber: string
}

function WaIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function sortedImages(images: ProductImage[]) {
  return [...images].sort((a, b) => a.display_order - b.display_order)
}

export default function ProductGrid({ products, contactNumber }: Props) {
  const [viewer, setViewer] = useState<{ product: StoreProduct; index: number } | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  /* ── Staggered scroll fade-in ── */
  useEffect(() => {
    const els = cardRefs.current.filter(Boolean) as HTMLDivElement[]
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('card-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  /* ── Lock body scroll while viewer is open ── */
  useEffect(() => {
    if (viewer) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [viewer])

  function openViewer(product: StoreProduct, index: number) {
    setViewer({ product, index })
  }
  function closeViewer() { setViewer(null) }
  function prevPhoto() {
    if (!viewer) return
    const total = viewer.product.product_images.length
    setViewer({ ...viewer, index: (viewer.index - 1 + total) % total })
  }
  function nextPhoto() {
    if (!viewer) return
    const total = viewer.product.product_images.length
    setViewer({ ...viewer, index: (viewer.index + 1) % total })
  }
  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX)
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? nextPhoto() : prevPhoto()
    setTouchStart(null)
  }

  return (
    <>
      {/* ── Product grid ── */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-x-3 gap-y-9">
        {products.map((product, idx) => {
          const images = sortedImages(product.product_images)
          const cover = images.find((img) => img.is_cover) ?? images[0]
          const waText = encodeURIComponent(
            `Hi, I'm interested in this item: ${cover?.image_url ?? ''}. Can we talk about it?`
          )
          const waUrl = `https://wa.me/${contactNumber}?text=${waText}`

          return (
            <div
              key={product.id}
              ref={(el) => { cardRefs.current[idx] = el }}
              style={{ animationDelay: `${idx * 75}ms` }}
              className="opacity-0 flex flex-col gap-2.5"
            >
              {/* Photo */}
              <button
                type="button"
                onClick={() => openViewer(product, 0)}
                className="group block w-full overflow-hidden rounded-2xl"
                style={{
                  background: '#FFFAF4',
                  boxShadow: '0 4px 20px rgba(61,43,31,0.10), 0 1px 4px rgba(61,43,31,0.06)',
                }}
              >
                <div className="aspect-[3/4] w-full overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover.image_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  ) : null}
                </div>
              </button>

              {/* Caption */}
              {product.description && (
                <p
                  className="px-0.5 text-xs leading-relaxed line-clamp-2"
                  style={{ color: '#3D2B1F', opacity: 0.6 }}
                >
                  {product.description}
                </p>
              )}

              {/* WhatsApp link */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-0.5 text-xs font-medium min-h-[36px] transition-opacity hover:opacity-60 active:opacity-40"
                style={{ color: '#C4622D' }}
              >
                <WaIcon size={13} />
                Message to order
              </a>
            </div>
          )
        })}
      </div>

      {/* ── Fullscreen photo viewer — portalled to document.body to escape stacking contexts ── */}
      {viewer && (() => {
        const images = sortedImages(viewer.product.product_images)
        const total = images.length
        const current = images[viewer.index]
        const viewerCover = images.find((img) => img.is_cover) ?? images[0]
        const viewerWaText = encodeURIComponent(
          `Hi, I'm interested in this item: ${viewerCover?.image_url ?? ''}. Can we talk about it?`
        )
        const viewerWaUrl = `https://wa.me/${contactNumber}?text=${viewerWaText}`

        return createPortal(
          <div
            className="fixed inset-0 flex flex-col"
            style={{ background: '#1a0f0a', zIndex: 9999 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
              <span className="text-sm" style={{ color: 'rgba(253,246,238,0.35)' }}>
                {total > 1 ? `${viewer.index + 1} / ${total}` : ''}
              </span>
              <button
                type="button"
                onClick={closeViewer}
                className="flex items-center justify-center min-h-[44px] min-w-[44px]"
                style={{ color: 'rgba(253,246,238,0.7)' }}
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Photo */}
            <div className="flex-1 flex items-center justify-center px-4 min-h-0">
              {current ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.image_url}
                  alt=""
                  className="max-h-full max-w-full object-contain select-none"
                  draggable={false}
                />
              ) : null}
            </div>

            {/* Prev / Next + dots */}
            {total > 1 && (
              <div className="flex items-center justify-between px-2 py-5 shrink-0">
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px]"
                  style={{ color: 'rgba(253,246,238,0.5)' }}
                  aria-label="Previous photo"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>

                <div className="flex gap-1.5">
                  {total <= 8
                    ? images.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setViewer({ ...viewer, index: i })}
                          className="w-1.5 h-1.5 rounded-full transition-colors"
                          style={{ background: i === viewer.index ? '#E8B86D' : 'rgba(232,184,109,0.25)' }}
                          aria-label={`Photo ${i + 1}`}
                        />
                      ))
                    : (
                        <span className="text-sm" style={{ color: 'rgba(253,246,238,0.45)' }}>
                          {viewer.index + 1} / {total}
                        </span>
                      )}
                </div>

                <button
                  type="button"
                  onClick={nextPhoto}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px]"
                  style={{ color: 'rgba(253,246,238,0.5)' }}
                  aria-label="Next photo"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            )}

            {/* WhatsApp footer — always visible */}
            <div
              className="shrink-0 flex justify-center pb-8 pt-2"
              style={{ borderTop: '1px solid rgba(196,98,45,0.15)' }}
            >
              <a
                href={viewerWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 decoration-[#C4622D]/50 min-h-[44px] transition-opacity hover:opacity-70 active:opacity-50"
                style={{ color: '#C4622D' }}
              >
                <WaIcon size={15} />
                Message to order
              </a>
            </div>
          </div>,
          document.body
        )
      })()}
    </>
  )
}
