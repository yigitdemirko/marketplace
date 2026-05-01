import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { productsApi } from '@/api/products'

const DISCOUNT_LABELS = ['-25%', '-12%', '-33%', '-15%', '-25%']

export function FlashSalesSection() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'deals'],
    queryFn: () => productsApi.getAll(0, 5),
  })

  const products = data?.content.filter((p) => p.stock > 0).slice(0, 5) ?? []

  return (
    <section className="py-5 bg-[#f6f7f9]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="bg-white rounded-[8px] border border-[#dce0e5] overflow-hidden">
          <div className="flex flex-col md:flex-row">

            {/* Left sidebar — header only */}
            <div className="md:w-[220px] lg:w-[240px] shrink-0 p-6 border-b md:border-b-0 md:border-r border-[#dce0e5] flex flex-col justify-center">
              <h2 className="text-[20px] font-semibold text-[#14181f] mb-2">Deals and offers</h2>
              <p className="text-[14px] text-[#6f7c8e]">Electronics &amp; Gadgets</p>
            </div>

            {/* Right — 5-column product grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 divide-x divide-y divide-[#dce0e5] border-t md:border-t-0 border-[#dce0e5]">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-[220px] bg-[#f6f7f9] animate-pulse" />
                ))}

              {!isLoading &&
                products.map((product, index) => (
                  <div
                    key={product.id}
                    className="p-4 flex flex-col items-center text-center cursor-pointer hover:bg-[#f6f7f9] transition-colors"
                    onClick={() =>
                      navigate({ to: '/products/$productId', params: { productId: product.id } })
                    }
                  >
                    <div className="w-full aspect-square bg-[#f6f7f9] rounded-[6px] overflow-hidden flex items-center justify-center mb-3">
                      {product.images?.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      ) : (
                        <Package className="h-10 w-10 text-gray-300" />
                      )}
                    </div>
                    <p className="text-[13px] text-[#525e6f] line-clamp-2 mb-3 flex-1">
                      {product.name}
                    </p>
                    <span className="bg-red-100 text-red-600 text-[12px] font-semibold px-3 py-1 rounded-full">
                      {DISCOUNT_LABELS[index % DISCOUNT_LABELS.length]}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
