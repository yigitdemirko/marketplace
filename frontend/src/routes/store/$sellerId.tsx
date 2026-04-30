import { createFileRoute } from '@tanstack/react-router'
import { SellerStorePage } from '@/pages/seller/SellerStorePage'

export const Route = createFileRoute('/store/$sellerId')({
  component: SellerStorePage,
})
