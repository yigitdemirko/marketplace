import { create } from 'zustand'

interface ToastState {
  message: string | null
  show: (message: string) => void
  hide: () => void
}

export const useToastStore = create<ToastState>()((set) => {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    message: null,
    show: (message) => {
      if (timer) clearTimeout(timer)
      set({ message })
      timer = setTimeout(() => set({ message: null }), 2500)
    },
    hide: () => {
      if (timer) clearTimeout(timer)
      set({ message: null })
    },
  }
})
