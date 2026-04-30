import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, Package } from 'lucide-react'
import { productsApi } from '@/api/products'
import { ProductCard } from '@/components/shared/ProductCard'

export function SellerStorePage() {
  const { sellerId } = useParams({ strict: false })
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['seller-store-products', sellerId],
    queryFn: () => productsApi.getBySeller(sellerId!, 0, 20),
    enabled: !!sellerId,
  })

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 space-y-8">
      {/* Seller banner */}
      <div className="bg-[#f6f7f9] border border-[#dce0e5] rounded-[12px] px-6 py-5 flex items-center gap-4">
        <div className="bg-[#3348ff] rounded-full w-14 h-14 flex items-center justify-center shrink-0">
          <Package className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[18px] font-bold text-[#14181f] font-mono truncate">
              {sellerId}
            </h1>
            <span className="inline-flex items-center gap-1 bg-[#e6f7ee] text-[#00a81c] text-[12px] font-semibold px-2 py-0.5 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Seller
            </span>
          </div>
          <p className="text-[14px] text-[#6f7c8e] mt-0.5">
            {isLoading ? '...' : `${data?.totalElements ?? 0} product${(data?.totalElements ?? 0) !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-[#f6f7f9] animate-pulse rounded-[8px]" />
          ))}
        </div>
      ) : data && data.content.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.content.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => navigate({ to: '/products/$productId', params: { productId: product.id } })}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-[#6f7c8e] gap-3">
          <Package className="h-10 w-10 text-[#dce0e5]" />
          <p className="text-[15px]">This seller has no active products yet.</p>
        </div>
      )}
    </div>
  )
}
