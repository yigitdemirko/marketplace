import { create } from 'zustand'

interface ToastAction {
  label: string
  fn: () => void
}

interface ToastState {
  message: string | null
  action: ToastAction | undefined
  type: 'success' | 'error'
  show: (message: string, options?: { action?: ToastAction; type?: 'success' | 'error' }) => void
  hide: () => void
}

export const useToastStore = create<ToastState>()((set) => {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    message: null,
    action: undefined,
    type: 'success',
    show: (message, options) => {
      if (timer) clearTimeout(timer)
      set({ message, action: options?.action, type: options?.type ?? 'success' })
      timer = setTimeout(() => set({ message: null, action: undefined }), 2500)
    },
    hide: () => {
      if (timer) clearTimeout(timer)
      set({ message: null, action: undefined })
    },
  }
})
