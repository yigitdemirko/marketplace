import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'

/**
 * Wait for the post-load session restore (`authApi.me()` in Layout) before deciding whether
 * to send the user to /login. Without this, refresh on protected pages races the cookie
 * restore and bounces the user out even though they are still authenticated.
 *
 * Caller pattern:
 *   const { ready } = useRequireAuth()
 *   if (!ready) return <Loader />
 */
export function useRequireAuth(): { ready: boolean; isAuthenticated: boolean } {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const restoring = useAuthStore((s) => s.restoring)
  const navigate = useNavigate()

  useEffect(() => {
    if (!restoring && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [restoring, isAuthenticated, navigate])

  return { ready: !restoring, isAuthenticated }
}
