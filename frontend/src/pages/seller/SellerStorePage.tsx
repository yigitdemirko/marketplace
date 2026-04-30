import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ShieldCheck, Package, Store } from 'lucide-react'
import { productsApi } from '@/api/products'
import { usersApi } from '@/api/users'
import { ProductCard } from '@/components/shared/ProductCard'

function SellerAvatar({ sellerId }: { sellerId: string }) {
  const initials = sellerId.slice(0, 2).toUpperCase()
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#3348ff] flex items-center justify-center shrink-0 border-4 border-white shadow-md">
      <span className="text-white font-bold text-xl sm:text-2xl leading-none">{initials}</span>
    </div>
  )
}

export function SellerStorePage() {
  const { sellerId } = useParams({ strict: false })
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  const { data: profileData } = useQuery({
    queryKey: ['seller-public-profile', sellerId],
    queryFn: () => usersApi.getSellerProfile(sellerId!),
    enabled: !!sellerId,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['seller-store-products', sellerId, page],
    queryFn: () => productsApi.getBySeller(sellerId!, page, 12),
    enabled: !!sellerId,
  })

  const displayName = profileData?.storeName ?? sellerId

  if (!sellerId) return null

  const totalProducts = data?.totalElements ?? 0

  return (
    <div className="-mx-4 -mt-8">

      {/* ── Breadcrumb ── */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-5 pb-4">
        <nav className="flex items-center gap-1 text-[14px] text-[#6f7c8e]">
          <button
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-1.5 hover:text-[#3348ff] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to main
          </button>
          <span className="px-1">/</span>
          <span className="text-[#14181f]">Store profile</span>
        </nav>
      </div>

      {/* ── Store header card ── */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pb-6">
        <div className="rounded-[12px] border border-[#dce0e5] overflow-hidden">

          {/* Cover strip */}
          <div className="h-[140px] sm:h-[180px] bg-gradient-to-br from-[#1a1a2e] via-[#2b3aff]/70 to-[#3348ff] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 40px)'
              }}
            />
            <Store className="absolute right-8 bottom-0 h-32 w-32 text-white/10 translate-y-8" />
          </div>

          {/* Info bar */}
          <div className="bg-[#f6f7f9] border-t border-[#dce0e5] px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="-mt-10 sm:-mt-12">
                <SellerAvatar sellerId={displayName!} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[18px] sm:text-[22px] font-bold text-[#14181f] truncate">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-[#e6f7ee] text-[#00a81c] text-[12px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Seller
                  </span>
                </div>
                <p className="text-[14px] text-[#6f7c8e] mt-0.5">
                  {isLoading ? '...' : `${totalProducts} product${totalProducts !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + products ── */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pb-12">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left sidebar */}
          <aside className="w-full lg:w-[220px] lg:shrink-0 lg:sticky lg:top-[80px]">
            <nav className="bg-white border border-[#dce0e5] rounded-[8px] overflow-hidden">
              <div className="px-3 py-2 border-b border-[#dce0e5]">
                <p className="text-[11px] font-semibold text-[#6f7c8e] uppercase tracking-widest">
                  Store navigation
                </p>
              </div>
              <ul>
                <li>
                  <span className="flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold text-[#3348ff] bg-[#eef0ff] border-l-2 border-[#3348ff]">
                    <Package className="h-4 w-4 shrink-0" />
                    All products
                  </span>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Right: products */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold text-[#14181f]">All products</h2>
              {!isLoading && (
                <span className="text-[14px] text-[#6f7c8e]">
                  {totalProducts} result{totalProducts !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-[#f6f7f9] animate-pulse rounded-[8px]" />
                ))}
              </div>
            )}

            {/* Products grid */}
            {!isLoading && data && data.content.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.content.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => navigate({ to: '/products/$productId', params: { productId: product.id } })}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="flex items-center gap-2 mt-8">
                    <button
                      disabled={data.first}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-4 h-9 rounded-[6px] border border-[#dce0e5] text-[14px] text-[#14181f] hover:bg-[#f6f7f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Prev
                    </button>
                    {Array.from({ length: data.totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`min-w-[36px] h-9 rounded-[6px] border text-[14px] transition-colors ${
                          i === page
                            ? 'border-[#3348ff] bg-[#3348ff] text-white font-semibold'
                            : 'border-[#dce0e5] text-[#14181f] hover:bg-[#f6f7f9]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={data.last}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-4 h-9 rounded-[6px] border border-[#dce0e5] text-[14px] text-[#14181f] hover:bg-[#f6f7f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {!isLoading && (!data || data.content.length === 0) && (
              <div className="flex flex-col items-center justify-center py-24 text-[#6f7c8e] gap-3">
                <Package className="h-10 w-10 text-[#dce0e5]" />
                <p className="text-[15px]">This seller has no active products yet.</p>
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  )
}
