import { Outlet, useRouterState } from '@tanstack/react-router'
import { Navbar } from './Navbar'
import { SellerLayout } from './SellerLayout'

const FULLSCREEN_ROUTES = ['/login', '/register']
const NO_CONTAINER_ROUTES = ['/']

export function Layout() {
  const { location } = useRouterState()
  const isSeller = location.pathname.startsWith('/seller')
  const isFullscreen = FULLSCREEN_ROUTES.includes(location.pathname)
  const isNoContainer = NO_CONTAINER_ROUTES.includes(location.pathname)

  if (isSeller) {
    return <SellerLayout />
  }

  if (isFullscreen) {
    return <Outlet />
  }

  if (isNoContainer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}