import { Outlet, useRouterState } from '@tanstack/react-router'
import { Navbar } from './Navbar'

const FULLSCREEN_ROUTES = ['/login', '/register']
const NO_CONTAINER_ROUTES = ['/']

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