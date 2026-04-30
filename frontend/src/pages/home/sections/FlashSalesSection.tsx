import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/shared/ProductCard'
import { productsApi } from '@/api/products'
import { useCountdown } from '@/pages/home/hooks/useCountdown'

const FLASH_END = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

export function FlashSalesSection() {
  const navigate = useNavigate()
  const { hours, mins, secs } = useCountdown(FLASH_END)

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'flash'],
    queryFn: () => productsApi.getAll(0, 5),
  })

  return (
    <section className="py-10 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-5 h-10 rounded bg-primary block shrink-0" />
              <span className="text-primary font-semibold text-sm">Today's</span>
            </div>
            <div className="flex items-end gap-8">
              <h2 className="text-3xl font-semibold text-foreground">Flash Sales</h2>
              {/* Countdown */}
              <div className="flex items-center gap-2 mb-1">
                {[
                  { label: 'Hours', value: hours },
                  { label: 'Minutes', value: mins },
                  { label: 'Seconds', value: secs },
                ].map(({ label, value }, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="text-center">
                      <p className="text-[10px] text-foreground/60 leading-none mb-1">{label}</p>
                      <span className="text-2xl font-bold text-foreground tabular-nums">
                        {String(value).padStart(2, '0')}
                      </span>
                    </div>
                    {i < 2 && <span className="text-primary font-bold text-2xl mb-1">:</span>}
                  </div>
                ))}
              </div>
            </div>
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

        {/* Products */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded" />
            ))}
          </div>
        )}

        {data && data.content.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

        <div className="border-b border-border mt-10" />
      </div>
    </section>
  )
}
