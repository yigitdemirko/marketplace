import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api/products'
import { ProductCard } from '@/components/shared/ProductCard'

export function RecommendedSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'recommended'],
    queryFn: () => productsApi.getAll(2, 10),
  })

  return (
    <section className="bg-[#f6f7f9] py-8">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <h2 className="text-[24px] font-semibold text-[#14181f] mb-6">Recommended items</h2>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-[380px] bg-white animate-pulse rounded-[12px]" />
            ))}
          </div>
        )}

        {data && (() => {
          const visible = data.content.filter((p) => p.stock > 0)
          if (visible.length === 0) return null
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )
        })()}
      </div>
    </section>
  )
}

export function BestsellerSection() {
  return <RecommendedSection />
}
