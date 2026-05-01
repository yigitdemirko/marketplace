import { createFileRoute, useSearch } from '@tanstack/react-router'
import { ProductsPage } from '@/pages/products/ProductsPage'

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || undefined,
    category: (search.category as string) || undefined,
    brand: (search.brand as string) || undefined,
    priceMin: search.priceMin ? Number(search.priceMin) : undefined,
    priceMax: search.priceMax ? Number(search.priceMax) : undefined,
    sort: (search.sort as string) || undefined,
    page: search.page ? Number(search.page) : 0,
  }),
  component: SearchRoute,
})

function SearchRoute() {
  const { q, category, brand, priceMin, priceMax, sort, page } = useSearch({ from: '/search' })
  return (
    <ProductsPage
      initialQuery={q}
      initialCategory={category}
      initialBrand={brand}
      initialPriceMin={priceMin}
      initialPriceMax={priceMax}
      initialSort={sort}
      initialPage={page}
    />
  )
}
