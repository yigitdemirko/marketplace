import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Star, Package } from 'lucide-react'
import { productsApi } from '@/api/products'

export function RecommendedSection() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'recommended'],
    queryFn: () => productsApi.getAll(2, 10),
  })

  return (
    <section className="bg-white py-8">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <h2 className="text-[24px] font-semibold text-[#14181f] mb-6">Recommended items</h2>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-[260px] bg-muted animate-pulse rounded-[8px]" />
            ))}
          </div>
        )}

        {data && data.content.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.content.map((product) => {
              const originalPrice = product.price * 1.25
              return (
                <div
                  key={product.id}
                  className="bg-white border border-[#dce0e5] rounded-[8px] overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    navigate({ to: '/products/$productId', params: { productId: product.id } })
                  }
                >
                  {/* Image */}
                  <div className="aspect-square bg-[#f6f7f9] overflow-hidden flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-gray-300" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="px-3 py-3">
                    {/* Price row */}
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-[16px] text-[#14181f]">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[14px] text-[#6f7c8e] line-through">
                        ${originalPrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4].map((s) => (
                        <Star
                          key={s}
                          className="h-3.5 w-3.5 text-[#ff9017] fill-[#ff9017]"
                        />
                      ))}
                      <Star className="h-3.5 w-3.5 text-[#ff9017]" />
                      <span className="text-[13px] text-[#6f7c8e] ml-1">4.5</span>
                    </div>

                    {/* Product name */}
                    <p className="text-[13px] text-[#6f7c8e] truncate">{product.name}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

// Keep old export for backward compatibility
export function BestsellerSection() {
  return <RecommendedSection />
}
