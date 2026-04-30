import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/shared/ProductCard'
import { productsApi } from '@/api/products'

export function ExploreProductsSection() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'explore'],
    queryFn: () => productsApi.getAll(0, 8),
  })

  return (
    <section className="py-10 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-5 h-10 rounded bg-primary block shrink-0" />
              <span className="text-primary font-semibold text-sm">Our Products</span>
            </div>
            <h2 className="text-3xl font-semibold text-foreground">Explore Our Products</h2>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="w-11 h-11 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="w-11 h-11 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 bg-muted animate-pulse rounded" />
            ))}
          </div>
        )}

        {data && data.content.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {data.content.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() =>
                  navigate({ to: '/products/$productId', params: { productId: product.id } })
                }
              />
            ))}
          </div>
        )}

        <div className="flex justify-center mt-10">
          <Link
            to="/search"
            className="h-14 px-12 rounded bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
