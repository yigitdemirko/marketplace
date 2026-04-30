import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { ProductCard } from '@/components/shared/ProductCard'
import { productsApi } from '@/api/products'

interface Props {
  initialQuery?: string
  initialCategory?: string
}

export function ProductsPage({ initialQuery, initialCategory }: Props = {}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialQuery ?? '')
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? '')
  const [page, setPage] = useState(0)

  useEffect(() => {
    setQuery(initialQuery ?? '')
    setSearchQuery(initialQuery ?? '')
    setPage(0)
  }, [initialQuery, initialCategory])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', searchQuery, initialCategory, page],
    queryFn: () => {
      if (searchQuery) return productsApi.search(searchQuery, page)
      if (initialCategory) return productsApi.search(initialCategory, page)
      return productsApi.getAll(page)
    },
  })

  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault()
    setSearchQuery(query)
    setPage(0)
  }

  return (
    <div className="space-y-6">
      {initialCategory && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Category:</span>
          <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded">{initialCategory}</span>
          <button
            onClick={() => navigate({ to: '/search' })}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            clear
          </button>
        </div>
      )}

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {isError && <p className="text-destructive">Failed to load products.</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.content.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigate({ to: '/products/$productId', params: { productId: product.id } })}
              />
            ))}
          </div>

          {data.content.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No products found.</p>
          )}

          <div className="flex justify-center gap-2">
            <Button variant="outline" disabled={data.first} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="flex items-center text-sm text-muted-foreground">
              Page {page + 1} of {data.totalPages}
            </span>
            <Button variant="outline" disabled={data.last} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
