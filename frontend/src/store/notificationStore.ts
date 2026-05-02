import { create } from 'zustand'
import type { Notification } from '@/api/notifications'

interface NotificationState {
  items: Notification[]
  unreadCount: number
  setAll: (items: Notification[], unreadCount: number) => void
  prepend: (notification: Notification) => void
  markRead: (id: string) => void
  markAllRead: () => void
  reset: () => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  items: [],
  unreadCount: 0,
  setAll: (items, unreadCount) => set({ items, unreadCount }),
  prepend: (notification) =>
    set((state) => {
      if (state.items.some((n) => n.id === notification.id)) return state
      return {
        items: [notification, ...state.items].slice(0, 50),
        unreadCount: state.unreadCount + (notification.read ? 0 : 1),
      }
    }),
  markRead: (id) =>
    set((state) => {
      const item = state.items.find((n) => n.id === id)
      if (!item || item.read) return state
      return {
        items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    }),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  reset: () => set({ items: [], unreadCount: 0 }),
}))
