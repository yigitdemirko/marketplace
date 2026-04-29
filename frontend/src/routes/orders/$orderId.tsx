import { createFileRoute } from '@tanstack/react-router'
import { OrderDetailPage } from '@/pages/orders/OrderDetailPage'

export const Route = createFileRoute('/orders/$orderId')({
  component: OrderDetailPage,
})