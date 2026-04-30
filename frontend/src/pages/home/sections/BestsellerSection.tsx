import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/shared/ProductCard'
import { productsApi } from '@/api/products'

interface ProductRowSectionProps {
  tag: string
  title: string
  page?: number
  showViewAll?: boolean
}

export function ProductRowSection({ tag, title, page = 0, showViewAll = false }: ProductRowSectionProps) {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'row', tag, page],
    queryFn: () => productsApi.getAll(page, 4),
  })

  return (
    <section className="py-10 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-5 h-10 rounded bg-primary block shrink-0" />
              <span className="text-primary font-semibold text-sm">{tag}</span>
            </div>
            <h2 className="text-3xl font-semibold text-foreground">{title}</h2>
          </div>
          {showViewAll ? (
            <Link
              to="/search"
              className="h-14 px-12 rounded bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center"
            >
              View All
            </Link>
          ) : (
            <div className="flex gap-2 shrink-0">
              <button className="w-11 h-11 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="w-11 h-11 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
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

        <div className="border-b border-border mt-10" />
      </div>
    </section>
  )
}

export function BestsellerSection() {
  return <ProductRowSection tag="This Month" title="Best Selling Products" showViewAll />
}
