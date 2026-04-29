import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { ProductCard } from '@/components/shared/ProductCard'
import { productsApi } from '@/api/products'

export function ProductsPage() {
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', searchQuery, page],
    queryFn: () =>
      searchQuery
        ? productsApi.search(searchQuery, page)
        : productsApi.getAll(page),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(query)
    setPage(0)
  }

  return (
    <div className="space-y-6">
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

      {isError && (
        <p className="text-destructive">Failed to load products.</p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.content.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => window.location.href = `/products/${product.id}`}
              />
            ))}
          </div>

          {data.content.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No products found.
            </p>
          )}

          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={data.first}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center text-sm text-muted-foreground">
              Page {page + 1} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  )
}