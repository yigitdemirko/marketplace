import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  Package,
  Star,
  CheckCircle,
  MessageCircle,
  ShoppingBasket,
  Store,
  Truck,
  BadgeCheck,
  Heart,
  Send,
  User,
  Pencil,
  XCircle,
} from 'lucide-react'
import { productsApi } from '@/api/products'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'

const TABS = ['Description', 'Seller info', 'Reviews', 'Shipping']

const RATING_BARS = [
  { star: 5, pct: 92 },
  { star: 4, pct: 56 },
  { star: 3, pct: 67 },
  { star: 2, pct: 54 },
  { star: 1, pct: 15 },
]

export function ProductDetailPage() {
  const { productId } = useParams({ strict: false })
  const navigate = useNavigate()
  const addItem = useCartStore((state) => state.addItem)
  const { user } = useAuthStore()
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState('Description')
  const [wishlisted, setWishlisted] = useState(false)

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId!),
    enabled: !!productId,
  })

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      productId: product.id,
      sellerId: product.sellerId,
      name: product.name,
      price: product.price,
      quantity: 1,
    })
  }

  if (isLoading) {
    return (
      <div className="-mx-4 -mt-8 animate-pulse">
        <div className="bg-[#f6f7f9] h-16" />
        <div className="max-w-[1180px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr_280px] gap-5">
            <div className="h-[380px] bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-6 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
            </div>
            <div className="h-[300px] bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-xl font-semibold">Product not found</p>
        <p className="text-sm text-muted-foreground mt-1">
          This product may have been removed or doesn't exist.
        </p>
        <button
          className="mt-6 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
          onClick={() => window.history.back()}
        >
          Go Back
        </button>
      </div>
    )
  }

  const images = product.images ?? []
  const mainImage = images[selectedImage] ?? null
  const isInStock = product.stock > 0
  const price = product.price

  const priceTiers = [
    { price: `$${price.toFixed(2)}`, qty: '1–50 pcs', highlight: true },
    { price: `$${(price * 0.92).toFixed(2)}`, qty: '50–500 pcs', highlight: false },
    { price: `$${(price * 0.80).toFixed(2)}`, qty: '500+ pcs', highlight: false },
  ]

  const attributes = product.attributes ?? {}
  const specEntries: { label: string; value: string }[] = Object.entries(attributes).map(
    ([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), value: String(v) })
  )

  const isBuyer = user?.accountType === 'BUYER'

  return (
    <div className="-mx-4 -mt-8">

      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <div className="bg-[#f6f7f9] border-b border-[#dce0e5]/60 h-16 flex items-center">
        <div className="max-w-[1180px] mx-auto px-4 w-full">
          <nav className="flex items-center gap-2 text-[15px] text-[#6f7c8e] tracking-tight">
            <button
              onClick={() => navigate({ to: '/' })}
              className="hover:text-[#14181f] transition-colors"
            >
              Home
            </button>
            <span>/</span>
            <span className="hover:text-[#14181f] transition-colors cursor-pointer">
              {product.categoryId ?? 'Products'}
            </span>
            <span>/</span>
            <span className="text-[#14181f] truncate max-w-xs">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ── Main section ───────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr_280px] gap-5 items-start">

          {/* LEFT: Image gallery */}
          <div className="flex flex-col gap-2">
            <div className="bg-[#f6f6f8] border border-[#dce0e5] rounded-[6px] overflow-hidden w-full aspect-square flex items-center justify-center">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover mix-blend-multiply"
                />
              ) : (
                <Package className="h-24 w-24 text-gray-300" />
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {(images.length > 0 ? images : new Array(6).fill(null)).slice(0, 6).map(
                (img: string | null, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`bg-[#f6f6f8] border rounded-[6px] overflow-hidden shrink-0 size-[56px] flex items-center justify-center transition-all ${
                      selectedImage === i
                        ? 'border-[#3348ff]'
                        : 'border-[#dce0e5] hover:border-[#b6c1ca]'
                    }`}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover mix-blend-multiply"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-gray-300" />
                    )}
                  </button>
                )
              )}
            </div>
          </div>

          {/* CENTER: Product info */}
          <div className="flex flex-col gap-3">
            <h1 className="font-medium text-[18px] text-[#14181f] leading-snug">
              {product.name}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= 4
                        ? 'fill-[#ff9017] text-[#ff9017]'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
                <span className="ml-1.5 text-[15px] text-[#db6e00] tracking-tight">4.5</span>
              </div>
              <span className="text-[#6f7c8e]">•</span>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4 text-[#6f7c8e]" />
                <span className="text-[15px] text-[#6f7c8e] tracking-tight">32 reviews</span>
              </div>
              <span className="text-[#6f7c8e]">•</span>
              <div className="flex items-center gap-1">
                <ShoppingBasket className="h-4 w-4 text-[#6f7c8e]" />
                <span className="text-[15px] text-[#6f7c8e] tracking-tight">154 orders</span>
              </div>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-1">
              {isInStock ? (
                <>
                  <CheckCircle className="h-4 w-4 text-[#00a81c]" />
                  <span className="text-[15px] text-[#00a81c] tracking-tight">In stock</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-[#fa3434]" />
                  <span className="text-[15px] text-[#fa3434] tracking-tight">Out of stock</span>
                </>
              )}
            </div>

            {/* Price tiers */}
            <div className="bg-[#edf0f2] rounded-[6px] h-[72px] flex overflow-hidden">
              {priceTiers.map((tier, i) => (
                <div key={i} className="relative flex-1 flex flex-col justify-center px-4">
                  {i > 0 && (
                    <div className="absolute left-0 top-[16px] bottom-[16px] w-px bg-[#dce0e5]" />
                  )}
                  <span
                    className={`font-semibold text-[18px] leading-snug ${
                      i === 0 ? 'text-[#fa3434]' : 'text-[#1c1c1c]'
                    }`}
                  >
                    {tier.price}
                  </span>
                  <span className="text-[13px] text-[#6f7c8e]">{tier.qty}</span>
                </div>
              ))}
            </div>

            {/* Spec list */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start text-[15px] tracking-tight">
                <span className="text-[#6f7c8e] w-[160px] shrink-0">Price:</span>
                <span className="text-[#14181f]">Negotiable</span>
              </div>
              <div className="h-px bg-[#dce0e5]" />
              {specEntries.slice(0, 6).map(({ label, value }) => (
                <div key={label} className="flex items-start text-[15px] tracking-tight">
                  <span className="text-[#6f7c8e] w-[160px] shrink-0">{label}:</span>
                  <span className="text-[#14181f]">{value}</span>
                </div>
              ))}
              {specEntries.length === 0 && (
                <>
                  {[
                    ['Type', 'N/A'],
                    ['Material', 'N/A'],
                    ['Design', 'Modern'],
                    ['Protection', 'Refund Policy'],
                    ['Brand', 'N/A'],
                    ['Warranty', '2 years'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start text-[15px] tracking-tight">
                      <span className="text-[#6f7c8e] w-[160px] shrink-0">{label}:</span>
                      <span className="text-[#14181f]">{value}</span>
                    </div>
                  ))}
                </>
              )}
              <div className="h-px bg-[#dce0e5]" />
            </div>
          </div>

          {/* RIGHT: Seller info card */}
          <div className="bg-white border border-[#b6c1ca] rounded-[8px] shadow-[0px_3px_3px_rgba(128,128,128,0.12)] p-4 flex flex-col gap-5">
            {/* Supplier */}
            <div className="flex items-center gap-3">
              <div className="bg-[#eaccff] rounded-[8px] size-[48px] flex items-center justify-center shrink-0">
                <Store className="h-6 w-6 text-[#8b2fc9]" />
              </div>
              <div>
                <p className="text-[15px] text-[#6f7c8e] tracking-tight">Supplier</p>
                <p className="text-[15px] text-[#14181f] tracking-tight">Guanjoi Trading LLC</p>
              </div>
            </div>

            <div className="h-px bg-[#dce0e5]" />

            {/* Features */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-base leading-none">🇩🇪</span>
                <span className="text-[15px] text-[#525e6f] tracking-tight">Germany, Berlin</span>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-[#525e6f] shrink-0" />
                <span className="text-[15px] text-[#525e6f] tracking-tight">Worldwide shipping</span>
              </div>
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-[#525e6f] shrink-0" />
                <span className="text-[15px] text-[#525e6f] tracking-tight">Verified Seller</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setWishlisted((v) => !v)}
                className="bg-[#edf0f2] hover:bg-[#e0e4e8] transition-colors rounded-[8px] h-[40px] flex items-center justify-center gap-2 w-full"
              >
                <Heart
                  className={`h-4 w-4 ${
                    wishlisted ? 'fill-red-500 text-red-500' : 'text-[#14181f]'
                  }`}
                />
                <span className="text-[15px] font-medium text-[#14181f] tracking-tight">
                  Save for later
                </span>
              </button>

              {isBuyer ? (
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock}
                  className="relative bg-[#3348ff] hover:bg-[#2236e0] disabled:opacity-50 transition-colors rounded-[8px] h-[40px] flex items-center justify-center gap-2 w-full shadow-[inset_0px_12px_12px_rgba(255,255,255,0.12),inset_0px_-2px_2px_rgba(48,48,48,0.1)]"
                >
                  <Send className="h-4 w-4 text-white" />
                  <span className="text-[15px] font-medium text-white tracking-tight">
                    Add to cart
                  </span>
                </button>
              ) : (
                <button className="relative bg-[#3348ff] hover:bg-[#2236e0] transition-colors rounded-[8px] h-[40px] flex items-center justify-center gap-2 w-full shadow-[inset_0px_12px_12px_rgba(255,255,255,0.12),inset_0px_-2px_2px_rgba(48,48,48,0.1)]">
                  <Send className="h-4 w-4 text-white" />
                  <span className="text-[15px] font-medium text-white tracking-tight">
                    Send inquiry
                  </span>
                </button>
              )}

              <button className="bg-[#e0edff] hover:bg-[#c8deff] transition-colors rounded-[8px] h-[40px] flex items-center justify-center gap-2 w-full">
                <User className="h-4 w-4 text-[#3348ff]" />
                <span className="text-[15px] font-medium text-[#3348ff] tracking-tight">
                  Seller profile
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom section ─────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 border-t border-[#dce0e5]">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 pt-7 pb-12">

          {/* LEFT: Rating overview */}
          <div className="lg:mt-[88px]">
            <div className="bg-white border border-[#dce0e5] rounded-[6px] shadow-[0px_3px_6px_rgba(128,128,128,0.12)] p-5 flex flex-col gap-4">
              {/* Rating summary */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-6 w-6 ${
                          s <= 4
                            ? 'fill-[#ff9017] text-[#ff9017]'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[18px] font-semibold text-[#14181f]">4.7 out of 5</span>
                </div>
                <p className="text-[15px] text-[#6f7c8e] tracking-tight">458 global ratings</p>
              </div>

              {/* Star distribution bars */}
              <div className="flex flex-col gap-2">
                {RATING_BARS.map(({ star, pct }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[16px] text-[#787a80] w-3 text-right leading-none">
                      {star}
                    </span>
                    <Star className="h-[15px] w-[15px] fill-[#ff9017] text-[#ff9017]" />
                    <div className="flex-1 relative h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-[#ff9017] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Write review button */}
              <button className="border border-[#dce0e5] rounded-[8px] h-[40px] flex items-center justify-center gap-2 w-full hover:bg-gray-50 transition-colors">
                <Pencil className="h-4 w-4 text-[#14181f]" />
                <span className="text-[15px] font-medium text-[#14181f] tracking-tight">
                  Write a review
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT: Tabs + Detailed info */}
          <div>
            {/* Tab navigation */}
            <div className="flex gap-6 border-b border-[#dce0e5] mb-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[15px] pb-3 transition-colors tracking-tight whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-[#3348ff] font-medium border-b-2 border-[#3348ff] -mb-px'
                      : 'text-[#6f7c8e] hover:text-[#14181f]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'Description' && (
              <div>
                <h2 className="text-[18px] font-semibold text-[#14181f] mb-4">
                  Detailed information
                </h2>
                <div className="text-[16px] text-[#14181f] leading-[24px] space-y-3 mb-8">
                  {product.description ? (
                    <p>{product.description}</p>
                  ) : (
                    <>
                      <p>
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
                        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                        quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                        consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                        cillum dolore eu fugiat nulla pariatur.
                      </p>
                      <p>
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
                        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                        quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                        consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                        cillum dolore eu fugiat nulla pariatur.
                      </p>
                    </>
                  )}
                </div>

                {/* Attributes table */}
                {specEntries.length > 0 && (
                  <div className="border-t border-[#dce0e5]">
                    {specEntries.map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-start border-t border-[#dce0e5] first:border-t-0"
                      >
                        <div className="w-[210px] shrink-0 px-2 py-2">
                          <span className="text-[15px] font-medium text-[#14181f] tracking-tight">
                            {label}
                          </span>
                        </div>
                        <div className="flex-1 px-3 py-2">
                          <span className="text-[15px] text-[#525e6f] tracking-tight">{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Reviews' && (
              <div className="text-[15px] text-[#6f7c8e]">No reviews yet.</div>
            )}

            {activeTab === 'Seller info' && (
              <div className="text-[15px] text-[#6f7c8e]">Seller information not available.</div>
            )}

            {activeTab === 'Shipping' && (
              <div className="text-[15px] text-[#6f7c8e]">Shipping details not available.</div>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}
