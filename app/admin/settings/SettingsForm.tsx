'use client'

import { useActionState } from 'react'
import { saveSettings } from '../actions'

type Props = {
  initialData: {
    name: string
    contact_number: string
    instructions: string | null
  } | null
}

export default function SettingsForm({ initialData }: Props) {
  const [state, action, pending] = useActionState(saveSettings, null)

  return (
    <form action={action} className="space-y-5">

      {/* Name */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initialData?.name ?? ''}
          placeholder="e.g. Tulsi Art"
          className="w-full rounded-md border border-gray-200 px-3 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
        />
      </div>

      {/* Contact number */}
      <div className="space-y-1.5">
        <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">
          WhatsApp number <span className="text-red-400">*</span>
        </label>
        <input
          id="contact_number"
          name="contact_number"
          type="text"
          inputMode="tel"
          required
          defaultValue={initialData?.contact_number ?? ''}
          placeholder="e.g. +91 98765 43210"
          className="w-full rounded-md border border-gray-200 px-3 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
        />
      </div>

      {/* Instructions */}
      <div className="space-y-1.5">
        <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
          Instructions
          <span className="ml-1 font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="instructions"
          name="instructions"
          rows={3}
          defaultValue={initialData?.instructions ?? ''}
          placeholder="e.g. Call or WhatsApp to place an order"
          className="w-full resize-none rounded-md border border-gray-200 px-3 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
        />
      </div>

      {/* Feedback */}
      {state?.success && (
        <p className="text-sm font-medium text-green-600">Settings saved.</p>
      )}
      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-[44px] rounded-md bg-black text-sm font-medium text-white hover:bg-gray-800 active:bg-gray-900 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
