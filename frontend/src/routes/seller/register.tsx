import { createFileRoute } from '@tanstack/react-router'
import { SellerRegisterPage } from '@/pages/auth/SellerRegisterPage'

export const Route = createFileRoute('/seller/register')({
  component: SellerRegisterPage,
})
