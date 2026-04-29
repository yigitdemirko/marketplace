import { createFileRoute } from '@tanstack/react-router'
import { SellerProductFormPage } from '@/pages/seller/SellerProductFormPage'

export const Route = createFileRoute('/seller/products/$productId/edit')({
  component: SellerProductFormPage,
})