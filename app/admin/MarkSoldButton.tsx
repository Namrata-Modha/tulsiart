'use client'

import { useState, useTransition } from 'react'
import { markSold, markAvailable } from './actions'

type Props = {
  productId: string
  productName: string
  isSold: boolean
  /** Tailwind classes applied to the trigger button */
  className?: string
}

export default function MarkSoldButton({ productId, productName, isSold, className }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleMarkAvailable() {
    startTransition(async () => {
      await markAvailable(productId)
    })
  }

  function handleConfirmSold() {
    setShowConfirm(false)
    startTransition(async () => {
      await markSold(productId, productName)
    })
  }

  if (isSold) {
    return (
      <button
        onClick={handleMarkAvailable}
        disabled={isPending}
        className={className}
      >
        {isPending ? 'Updating…' : 'Mark Available'}
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className={className}
      >
        {isPending ? 'Updating…' : 'Mark Sold'}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowConfirm(false)}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">
              Mark this item as sold?
            </h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Extra photos will be deleted to save storage. A sale record will be created. This cannot be undone easily.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 min-h-[44px] rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSold}
                className="flex-1 min-h-[44px] rounded-xl bg-black text-sm font-medium text-white hover:bg-gray-800 active:bg-gray-900"
              >
                Mark Sold
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
