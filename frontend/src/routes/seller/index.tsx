import { createFileRoute } from '@tanstack/react-router'
import { SellerDashboardPage } from '@/pages/seller/SellerDashboardPage'

export const Route = createFileRoute('/seller/')({
  component: SellerDashboardPage,
})
