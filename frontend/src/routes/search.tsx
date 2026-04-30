import { createFileRoute, useSearch } from '@tanstack/react-router'
import { ProductsPage } from '@/pages/products/ProductsPage'

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>): { q?: string; category?: string } => ({
    q: (search.q as string) || undefined,
    category: (search.category as string) || undefined,
  }),
  component: SearchRoute,
})

function SearchRoute() {
  const { q, category } = useSearch({ from: '/search' })
  return <ProductsPage initialQuery={q} initialCategory={category} />
}
