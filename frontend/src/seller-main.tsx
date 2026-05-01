import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SellerLayout } from '@/components/layout/SellerLayout'
import { SellerDashboardPage } from '@/pages/seller/SellerDashboardPage'
import { SellerCatalogPage } from '@/pages/seller/SellerCatalogPage'
import { SellerProductFormPage } from '@/pages/seller/SellerProductFormPage'
import { SellerOrdersPage } from '@/pages/seller/SellerOrdersPage'
import { SellerLoginPage } from '@/pages/auth/SellerLoginPage'
import { SellerRegisterPage } from '@/pages/auth/SellerRegisterPage'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

const rootRoute = createRootRoute({ component: () => <Outlet /> })

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: SellerLoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: SellerRegisterPage,
})

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'seller-layout',
  component: SellerLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: SellerDashboardPage,
})

const productsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/products',
  component: SellerCatalogPage,
})

const newProductRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/products/new',
  component: SellerProductFormPage,
})

const editProductRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/products/$productId/edit',
  component: SellerProductFormPage,
})

const ordersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/orders',
  component: SellerOrdersPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  layoutRoute.addChildren([
    dashboardRoute,
    productsRoute,
    newProductRoute,
    editProductRoute,
    ordersRoute,
  ]),
])

const router = createRouter({ routeTree, context: { queryClient } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
