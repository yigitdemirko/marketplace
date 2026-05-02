import { useNavigate } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'

export function Toast() {
  const { message, hide } = useToastStore()
  const navigate = useNavigate()

  const visible = message !== null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-4 right-4 bottom-4 z-[60] mx-auto max-w-sm flex items-center gap-3 rounded-lg bg-[#14181f] text-white px-4 py-3 shadow-lg transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#3348ff]">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      <span className="flex-1 text-sm">{message ?? ''}</span>
      <button
        type="button"
        onClick={() => {
          hide()
          navigate({ to: '/cart' })
        }}
        className="text-sm font-medium text-[#a8b6ff] hover:text-white transition-colors"
      >
        Sepete git
      </button>
    </div>
  )
}
