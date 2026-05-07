'use client'

import { useRef, useState } from 'react'
import { addProduct } from './actions'

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

export default function AddProductModal() {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    // Append to existing selection instead of replacing
    setFiles((prev) => [...prev, ...selected])
    setPreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))])
    setError(null)
    // Reset input so the same file can be picked again if needed
    e.target.value = ''
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index])
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
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
    if (!files.length) { setError('Add at least one photo.'); return }
    const form = e.currentTarget // capture before any await — currentTarget is nullified after
    setPending(true)
    setError(null)
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)))
      const fd = new FormData(form)
      fd.delete('images')
      compressed.forEach((f) => fd.append('images', f))
      await addProduct(fd)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setPending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-black px-3 sm:px-4 min-h-[44px] text-sm font-medium text-white hover:bg-gray-800 whitespace-nowrap"
      >
        <span className="sm:hidden">+ Add</span>
        <span className="hidden sm:inline">Add Product</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={handleClose}
          />

          {/* Drawer */}
          <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Add Product</h2>
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
            <form id="add-product-form" onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex flex-1 flex-col gap-5 px-5 py-5">

                {/* Photo upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Photos
                    <span className="ml-1 font-normal text-gray-400">(first photo is the cover)</span>
                  </label>

                  {previews.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 py-14 text-gray-400 hover:border-gray-300 hover:text-gray-500 active:bg-gray-50"
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span className="text-sm">Tap to select photos</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {previews.map((src, i) => (
                          <div key={src} className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="h-full w-full object-cover" />
                            {/* Cover badge on first photo */}
                            {i === 0 && (
                              <span className="absolute left-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white">
                                Cover
                              </span>
                            )}
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              className="absolute right-1 top-1 flex items-center justify-center w-6 h-6 rounded-full bg-black/60 text-white hover:bg-black/80"
                              aria-label={`Remove photo ${i + 1}`}
                            >
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        ))}

                        {/* Add more tile */}
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          className="aspect-square flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 active:bg-gray-50"
                          aria-label="Add more photos"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          <span className="text-[11px]">Add more</span>
                        </button>
                      </div>

                      <p className="text-xs text-gray-400">
                        {files.length} photo{files.length !== 1 ? 's' : ''} selected · first is the cover
                      </p>
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
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                    <span className="ml-1 font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Describe the item…"
                    className="w-full resize-none rounded-md border border-gray-200 px-3 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                  />
                </div>

                {/* Quantity + Cost Price */}
                <div className="flex gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      defaultValue={1}
                      required
                      className="w-24 rounded-md border border-gray-200 px-3 py-3 text-base text-gray-900 focus:border-gray-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700">
                      Cost Price (₹)
                      <span className="ml-1 font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="cost_price"
                      name="cost_price"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      className="w-32 rounded-md border border-gray-200 px-3 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
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
