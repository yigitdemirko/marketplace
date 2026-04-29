import { Outlet, useRouterState } from '@tanstack/react-router'
import { Navbar } from './Navbar'

const FULLSCREEN_ROUTES = ['/login', '/register']

export function Layout() {
  const { location } = useRouterState()
  const isFullscreen = FULLSCREEN_ROUTES.includes(location.pathname)

  if (isFullscreen) {
    return <Outlet />
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