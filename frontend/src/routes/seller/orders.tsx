import { createFileRoute } from '@tanstack/react-router'
import { SellerOrdersPage } from '@/pages/seller/SellerOrdersPage'

export const Route = createFileRoute('/seller/orders')({
  component: SellerOrdersPage,
})
