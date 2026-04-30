import { createFileRoute } from '@tanstack/react-router'
import { SellerCatalogPage } from '@/pages/seller/SellerCatalogPage'

export const Route = createFileRoute('/seller/products/')({
  component: SellerCatalogPage,
})
