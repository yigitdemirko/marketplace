import { createFileRoute } from '@tanstack/react-router'
import { SellerLoginPage } from '@/pages/auth/SellerLoginPage'

export const Route = createFileRoute('/seller/login')({
  component: SellerLoginPage,
})
