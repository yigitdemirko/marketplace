import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useToastStore } from '@/store/toastStore'
import { notificationsApi, type Notification } from '@/api/notifications'

const BASE_URL = import.meta.env.VITE_API_BASE_URL
const RECONNECT_DELAY_MS = 5000
const MAX_BACKOFF_MS = 60000

export function useNotificationStream() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userId = useAuthStore((s) => s.user?.userId)
  const accountType = useAuthStore((s) => s.user?.accountType)

  useEffect(() => {
    if (!isAuthenticated || !userId || accountType !== 'BUYER') {
      useNotificationStore.getState().reset()
      return
    }

    let cancelled = false
    let eventSource: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let backoff = RECONNECT_DELAY_MS

    const hydrate = async () => {
      try {
        const [page, count] = await Promise.all([
          notificationsApi.list({ size: 20 }),
          notificationsApi.unreadCount(),
        ])
        if (cancelled) return
        useNotificationStore.getState().setAll(page.content, count.count)
      } catch {
        // silent — will retry next mount
      }
    }

    const connect = () => {
      if (cancelled) return
      eventSource = new EventSource(`${BASE_URL}/api/v1/notifications/stream`, {
        withCredentials: true,
      })

      eventSource.addEventListener('connected', () => {
        backoff = RECONNECT_DELAY_MS
      })

      eventSource.addEventListener('notification', (e) => {
        try {
          const payload = JSON.parse((e as MessageEvent).data) as Notification
          useNotificationStore.getState().prepend(payload)
          useToastStore.getState().show(payload.title, { type: 'success' })
        } catch {
          // ignore malformed
        }
      })

      eventSource.onerror = () => {
        eventSource?.close()
        eventSource = null
        if (cancelled) return
        reconnectTimer = setTimeout(connect, backoff)
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
      }
    }

    hydrate()
    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      eventSource?.close()
    }
  }, [isAuthenticated, userId, accountType])
}
