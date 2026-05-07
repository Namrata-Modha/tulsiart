'use client'

import { useRef, useState } from 'react'
import { editProduct } from './actions'

async function compressImage(file: File): Promise<File> {
  // Dynamic import keeps browser-image-compression out of SSR entirely.
  // This function is only ever called inside a click handler, never during render.
  const { default: imageCompression } = await import('browser-image-compression')
  return imageCompression(file, {
    maxSizeMB: 0.4,       // 400 KB per image — 5 photos ≈ 2 MB total
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  })
}

type Props = {
  productId: string
  initialDescription: string | null
  initialQuantity: number
  initialCostPrice: number | null
  coverImageUrl: string | null
  /** Tailwind classes for the trigger button */
  className?: string
}

export default function EditProductDrawer({
  productId,
  initialDescription,
  initialQuantity,
  initialCostPrice,
  coverImageUrl,
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    previews.forEach(URL.revokeObjectURL)
    setFiles(selected)
    setPreviews(selected.map((f) => URL.createObjectURL(f)))
    setError(null)
  }

  function handleClose() {
    previews.forEach(URL.revokeObjectURL)
    setOpen(false)
    setFiles([])
    setPreviews([])
    setError(null)
    setPending(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setPending(true)
    setError(null)
    try {
      const fd = new FormData(form)
      // Replace images in FormData with compressed versions (if any selected)
      fd.delete('images')
      if (files.length > 0) {
        const compressed = await Promise.all(files.map((f) => compressImage(f)))
        compressed.forEach((f) => fd.append('images', f))
      }
      await editProduct(fd)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setPending(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={handleClose} />

          {/* Drawer */}
          <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Edit Product</h2>
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
              <input type="hidden" name="productId" value={productId} />

              <div className="flex flex-1 flex-col gap-5 px-5 py-5">

                {/* Photos */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Photos
                    <span className="ml-1 font-normal text-gray-400">(first photo is the cover)</span>
                  </label>

                  {previews.length === 0 ? (
                    /* Show current cover + replace option */
                    <div className="space-y-3">
                      {coverImageUrl ? (
                        <div className="relative w-24 aspect-square overflow-hidden rounded-md bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
                          <span className="absolute left-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white">
                            Cover
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No photos yet.</p>
                      )}
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex items-center min-h-[44px] text-sm text-blue-600 hover:text-blue-800 active:text-blue-900"
                      >
                        Replace photos…
                      </button>
                    </div>
                  ) : (
                    /* Show new photo previews */
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {previews.map((src, i) => (
                          <div key={src} className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="h-full w-full object-cover" />
                            {i === 0 && (
                              <span className="absolute left-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white">
                                Cover
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex items-center min-h-[44px] text-sm text-gray-400 hover:text-gray-600 active:text-gray-800"
                      >
                        Change photos
                      </button>
                    </div>
                  )}

                  <input
                    ref={inputRef}
                    type="file"
                    name="images"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                    Description
                    <span className="ml-1 font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="edit-description"
                    name="description"
                    rows={3}
                    defaultValue={initialDescription ?? ''}
                    placeholder="Describe the item…"
                    className="w-full resize-none rounded-md border border-gray-200 px-3 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                  />
                </div>

                {/* Quantity + Cost Price */}
                <div className="flex gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-quantity" className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <input
                      id="edit-quantity"
                      name="quantity"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      defaultValue={initialQuantity}
                      required
                      className="w-24 rounded-md border border-gray-200 px-3 py-3 text-base text-gray-900 focus:border-gray-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-cost-price" className="block text-sm font-medium text-gray-700">
                      Cost Price (₹)
                      <span className="ml-1 font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="edit-cost-price"
                      name="cost_price"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      defaultValue={initialCostPrice ?? ''}
                      placeholder="0.00"
                      className="w-32 rounded-md border border-gray-200 px-3 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="min-h-[44px] rounded-md px-4 text-sm text-gray-500 hover:text-gray-800 active:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="min-h-[44px] rounded-md bg-black px-6 text-sm font-medium text-white hover:bg-gray-800 active:bg-gray-900 disabled:opacity-50"
                >
                  {pending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
