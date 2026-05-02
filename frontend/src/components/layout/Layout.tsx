import { useEffect } from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'
import { Navbar } from './Navbar'
import { CartDrawer } from '@/components/shared/CartDrawer'
import { Toast } from '@/components/shared/Toast'
import { NavigationProgress } from '@/components/shared/NavigationProgress'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'

const FULLSCREEN_ROUTES = ['/login', '/register']
const NO_CONTAINER_ROUTES = ['/', '/checkout', '/search', '/account']

export function Layout() {
  const { location } = useRouterState()
  const { setAuth, setRestoring } = useAuthStore()
  const isFullscreen = FULLSCREEN_ROUTES.includes(location.pathname)
  const isNoContainer = NO_CONTAINER_ROUTES.includes(location.pathname)

  // Restore session from httpOnly cookie on first load
  useEffect(() => {
    authApi.me()
      .then((user) => setAuth(user))
      .catch(() => setRestoring(false))
  }, [])

  if (isFullscreen) {
    return (
      <>
        <NavigationProgress />
        <Outlet />
      </>
    )
  }

  if (isNoContainer) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationProgress />
        <Navbar />
        <CartDrawer />
        <Toast />
        <div key={location.href} className="animate-page-in">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationProgress />
      <Navbar />
      <CartDrawer />
      <Toast />
      <main className="container mx-auto px-4 py-8">
        <div key={location.href} className="animate-page-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
