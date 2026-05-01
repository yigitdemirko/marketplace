import { create } from 'zustand'

export type AppLocale = 'EN' | 'TR'

function detectLocale(): AppLocale {
  const saved = localStorage.getItem('locale') as AppLocale | null
  if (saved === 'EN' || saved === 'TR') return saved
  return navigator.language?.toLowerCase().startsWith('tr') ? 'TR' : 'EN'
}

interface LocaleStore {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: detectLocale(),
  setLocale: (locale) => {
    localStorage.setItem('locale', locale)
    set({ locale })
  },
}))
