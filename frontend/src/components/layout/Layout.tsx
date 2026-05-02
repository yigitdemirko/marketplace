import { Outlet, useRouterState } from '@tanstack/react-router'
import { Navbar } from './Navbar'
import { CartDrawer } from '@/components/shared/CartDrawer'
import { Toast } from '@/components/shared/Toast'

const FULLSCREEN_ROUTES = ['/login', '/register']
const NO_CONTAINER_ROUTES = ['/', '/checkout', '/search']

export function Layout() {
  const { location } = useRouterState()
  const isFullscreen = FULLSCREEN_ROUTES.includes(location.pathname)
  const isNoContainer = NO_CONTAINER_ROUTES.includes(location.pathname)

  if (isFullscreen) {
    return <Outlet />
  }

  if (isNoContainer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <CartDrawer />
        <Toast />
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CartDrawer />
      <Toast />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
