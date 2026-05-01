import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import { ArrowRight, Package } from 'lucide-react'
import { EMPTY_SEARCH } from '@/routes/search'
import { productsApi } from '@/api/products'
import type { CategoryId } from '@/constants/categories'

interface CategorySectionProps {
  bannerBg: string
  bannerEmoji: string
  bannerTitle: string
  categoryId: CategoryId
}

function CategorySection({ bannerBg, bannerEmoji, bannerTitle, categoryId }: CategorySectionProps) {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'category-section', categoryId],
    queryFn: () => productsApi.getByCategory(categoryId, 0, 8),
  })

  return (
    <section className="bg-white py-8">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left banner */}
          <div
            className={`${bannerBg} hidden lg:flex w-[300px] shrink-0 rounded-[8px] p-6 flex-col justify-end min-h-[300px] relative overflow-hidden`}
          >
            <span className="absolute top-4 right-4 text-[80px] opacity-20 leading-none select-none">
              {bannerEmoji}
            </span>
            <h3 className="text-[20px] font-semibold text-[#14181f] mb-2 relative z-10">
              {bannerTitle}
            </h3>
            <Link
              to="/search"
              search={EMPTY_SEARCH}
              className="flex items-center gap-1 text-[15px] text-[#3348ff] font-medium relative z-10 w-fit hover:underline"
            >
              Explore all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right product grid */}
          <div className="flex-1">
            {isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-[160px] bg-muted animate-pulse rounded-[8px]" />
                ))}
              </div>
            )}

            {data && data.content.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.content.slice(0, 8).map((product) => (
                  <div
                    key={product.id}
                    className="border border-[#dce0e5] rounded-[8px] overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
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
                        <Package className="h-10 w-10 text-gray-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-3 py-2">
                      <p className="text-[13px] text-[#14181f] truncate">{product.name}</p>
                      <p className="text-[13px] text-[#6f7c8e]">
                        From ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function HomeOutdoorSection() {
  return (
    <CategorySection
      bannerBg="bg-[#d4edda]"
      bannerEmoji="🏠"
      bannerTitle="Home & Outdoor"
      categoryId="HOME_OUTDOOR"
    />
  )
}

export function ElectronicsSection() {
  return (
    <CategorySection
      bannerBg="bg-[#d0e8ff]"
      bannerEmoji="📱"
      bannerTitle="Consumer Electronics & Gadgets"
      categoryId="ELECTRONICS"
    />
  )
}
