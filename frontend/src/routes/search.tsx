import { createFileRoute, useSearch } from '@tanstack/react-router'
import { ProductsPage } from '@/pages/products/ProductsPage'

export type SearchParams = {
  q: string | undefined
  category: string | undefined
  brand: string | undefined
  priceMin: number | undefined
  priceMax: number | undefined
  sort: string | undefined
  page: number | undefined
}

export const EMPTY_SEARCH: SearchParams = {
  q: undefined,
  category: undefined,
  brand: undefined,
  priceMin: undefined,
  priceMax: undefined,
  sort: undefined,
  page: undefined,
}

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || undefined,
    category: (search.category as string) || undefined,
    brand: (search.brand as string) || undefined,
    priceMin: search.priceMin ? Number(search.priceMin) : undefined,
    priceMax: search.priceMax ? Number(search.priceMax) : undefined,
    sort: (search.sort as string) || undefined,
    page: search.page ? Number(search.page) : undefined,
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
      initialPage={page ?? 0}
    />
  )
}
