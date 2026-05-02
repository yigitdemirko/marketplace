import { Outlet, useRouterState } from '@tanstack/react-router'
import { Navbar } from './Navbar'
import { CartDrawer } from '@/components/shared/CartDrawer'
import { Toast } from '@/components/shared/Toast'
import { NavigationProgress } from '@/components/shared/NavigationProgress'

const FULLSCREEN_ROUTES = ['/login', '/register']
const NO_CONTAINER_ROUTES = ['/', '/checkout', '/search', '/account']

export function Layout() {
  const { location } = useRouterState()
  const isFullscreen = FULLSCREEN_ROUTES.includes(location.pathname)
  const isNoContainer = NO_CONTAINER_ROUTES.includes(location.pathname)

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
        <div key={location.key} className="animate-page-in">
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
        <div key={location.key} className="animate-page-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
