import { useQueries } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { EMPTY_SEARCH } from '@/routes/search'
import { productsApi } from '@/api/products'
import type { CategoryId } from '@/constants/categories'
import type { Product } from '@/types'
import { formatPrice } from '@/lib/formatPrice'

interface CategorySectionProps {
  bannerImage: string
  bannerTitle: string
  categoryIds: CategoryId[]
  exploreCategoryId: CategoryId
}

function CategorySection({
  bannerImage,
  bannerTitle,
  categoryIds,
  exploreCategoryId,
}: CategorySectionProps) {
  const navigate = useNavigate()

  const results = useQueries({
    queries: categoryIds.map((id) => ({
      queryKey: ['products', 'category-section', id],
      queryFn: () => productsApi.getByCategory(id, 0, 8),
    })),
  })

  const isLoading = results.some((r) => r.isLoading)

  const products: Product[] = []
  const seen = new Set<string>()
  for (const r of results) {
    if (r.data) {
      for (const p of r.data.content) {
        if (!seen.has(p.id) && p.stock > 0) {
          seen.add(p.id)
          products.push(p)
        }
      }
    }
  }
  const displayProducts = products.slice(0, 8)

  return (
    <section className="pb-5 bg-[#f6f7f9]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="bg-white rounded-[8px] border border-[#dce0e5] overflow-hidden flex flex-col md:flex-row">

          {/* Left banner */}
          <aside
            className="md:w-[220px] lg:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-[#dce0e5] bg-cover bg-center relative min-h-[200px]"
            style={{ backgroundImage: `url(${bannerImage})` }}
          >
            <div className="absolute inset-0 bg-white/60" />
            <div className="relative z-10 p-6 flex flex-col justify-end h-full">
              <h3 className="text-[20px] font-semibold text-[#14181f] mb-4 leading-snug">
                {bannerTitle}
              </h3>
              <Link
                to="/search"
                search={{ ...EMPTY_SEARCH, category: exploreCategoryId }}
                className="inline-flex items-center gap-1 border border-[#14181f] rounded-[6px] px-4 py-2 text-[14px] font-medium text-[#14181f] hover:bg-[#14181f] hover:text-white transition-colors w-fit bg-white/80"
              >
                Tümünü gör
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6C9 6 15 10.4189 15 12C15 13.5812 9 18 9 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {isLoading && (
              <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="h-[120px] bg-[#f6f7f9] animate-pulse border-r border-b border-[#dce0e5]" />
                ))}
              </ul>
            )}

            {!isLoading && displayProducts.length > 0 && (
              <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {displayProducts.map((product) => (
                  <li
                    key={product.id}
                    className="border-r border-b border-[#dce0e5] last:border-r-0 cursor-pointer hover:bg-[#f6f7f9] transition-colors"
                    onClick={() =>
                      navigate({ to: '/products/$productId', params: { productId: product.id } })
                    }
                  >
                    <div className="p-4 relative min-h-[110px] flex flex-col justify-between">
                      {/* Image floated right */}
                      <div className="absolute top-3 right-3 w-[70px] h-[70px] shrink-0 overflow-hidden rounded-[4px] bg-[#f6f7f9] flex items-center justify-center">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-300" />
                        )}
                      </div>

                      {/* Text — leaves room for image */}
                      <div className="pr-[82px]">
                        <p className="text-[13px] text-[#14181f] hover:text-[#3348ff] line-clamp-2 mb-2">
                          {product.name}
                        </p>
                        <p className="text-[12px] text-[#6f7c8e]">
                          Başlangıç<br />{formatPrice(product.price)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!isLoading && displayProducts.length === 0 && (
              <div className="flex items-center justify-center h-[200px] text-[#6f7c8e] text-[14px]">
                Ürün bulunamadı
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
      bannerImage="/banners/category-interior.jpg"
      bannerTitle="Ev ve bahçe ürünleri"
      categoryIds={['HOME_OUTDOOR', 'KITCHEN', 'FURNITURE', 'HOME_APPLIANCES', 'GARDEN']}
      exploreCategoryId="HOME_OUTDOOR"
    />
  )
}

export function ElectronicsSection() {
  return (
    <CategorySection
      bannerImage="/banners/category-tech.jpg"
      bannerTitle="Tüketici elektroniği ve gadget"
      categoryIds={['ELECTRONICS', 'PHONES_TABLETS', 'COMPUTERS', 'AUDIO', 'CAMERAS', 'GAMING', 'WEARABLES']}
      exploreCategoryId="ELECTRONICS"
    />
  )
}
