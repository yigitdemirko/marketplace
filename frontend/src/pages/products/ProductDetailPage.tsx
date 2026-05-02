import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  Package,
  Star,
  ShoppingBasket,
  Store,
  Heart,
  ShoppingCart,
  Check,
  Plus,
  Minus,
  PenLine,
} from 'lucide-react'
import { productsApi } from '@/api/products'
import { usersApi } from '@/api/users'
import { useCartStore } from '@/store/cartStore'
import { useAddedToCartFeedback } from '@/lib/cartFeedback'
import { getCategoryLabel } from '@/constants/categories'
import { formatPrice } from '@/lib/formatPrice'

const TABS = ['Açıklama', 'Yorumlar', 'Mağaza', 'Kullanım kılavuzu'] as const

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
  const notifyAdded = useAddedToCartFeedback()
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Açıklama')
  const [wishlisted, setWishlisted] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId!),
    enabled: !!productId,
  })

  const { data: sellerProfile } = useQuery({
    queryKey: ['seller-public-profile', product?.sellerId],
    queryFn: () => usersApi.getSellerProfile(product!.sellerId),
    enabled: !!product?.sellerId,
  })

  const sellerDisplayName = sellerProfile?.storeName ?? product?.sellerId

  const handleAddToCart = useCallback(() => {
    if (!product) return
    addItem({
      productId: product.id,
      sellerId: product.sellerId,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0],
    })
    notifyAdded()
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }, [product, quantity, addItem, notifyAdded])

  if (isLoading) {
    return (
      <div className="-mx-4 -mt-8 animate-pulse">
        <div className="bg-[#f6f7f9] h-16" />
        <div className="max-w-[1180px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[72px_1fr_374px] gap-5">
            <div className="hidden lg:flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[70px] bg-muted rounded-md" />
              ))}
            </div>
            <div className="aspect-[698/540] bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-6 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-xl font-semibold">Ürün bulunamadı</p>
        <p className="text-sm text-muted-foreground mt-1">
          Bu ürün kaldırılmış veya mevcut değil.
        </p>
        <button
          className="mt-6 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
          onClick={() => window.history.back()}
        >
          Geri dön
        </button>
      </div>
    )
  }

  const images = product.images ?? []
  const mainImage = images[selectedImage] ?? null
  const isInStock = product.stock > 0

  const attributes = product.attributes ?? {}
  const allSpecEntries: { label: string; value: string }[] = Object.entries(attributes).map(
    ([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), value: String(v) })
  )
  const headlineSpecs = allSpecEntries.slice(0, 2)

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
              Anasayfa
            </button>
            <span>/</span>
            <span className="hover:text-[#14181f] transition-colors cursor-pointer">
              {product.categoryId ? getCategoryLabel(product.categoryId) : 'Ürünler'}
            </span>
            <span>/</span>
            <span className="text-[#14181f] truncate max-w-xs">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ── Main section ───────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[72px_1fr_374px] gap-5 items-start">

          {/* LEFT: Vertical thumbnails */}
          <div className="hidden lg:flex flex-col gap-2 w-[72px]">
            {(images.length > 0 ? images : new Array(1).fill(null)).slice(0, 8).map(
              (img: string | null, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`bg-white border rounded-md overflow-hidden h-[70px] w-full flex items-center justify-center transition-colors ${
                    selectedImage === i
                      ? 'border-[#5261fe]'
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

          {/* CENTER: Main image */}
          <div className="flex flex-col gap-3">
            <div className="bg-[#edf0f2] border border-[#dce0e5] rounded-lg overflow-hidden w-full aspect-[698/540] flex items-center justify-center">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              ) : (
                <Package className="h-24 w-24 text-gray-300" />
              )}
            </div>

            {/* Mobile thumbnails (horizontal) */}
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-1">
              {(images.length > 0 ? images : new Array(1).fill(null)).slice(0, 8).map(
                (img: string | null, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`bg-white border rounded-md overflow-hidden shrink-0 size-[70px] flex items-center justify-center transition-colors ${
                      selectedImage === i ? 'border-[#5261fe]' : 'border-[#dce0e5]'
                    }`}
                  >
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                    ) : (
                      <Package className="h-5 w-5 text-gray-300" />
                    )}
                  </button>
                )
              )}
            </div>
          </div>

          {/* RIGHT: Product aside */}
          <div className="flex flex-col gap-5">
            {/* Title + rating */}
            <div className="flex flex-col gap-3">
              <h1 className="font-semibold text-[20px] text-[#14181f] leading-[1.4]">
                {product.name}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
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
                  </div>
                  <span className="text-[15px] text-[#db6e00] tracking-tight">4.5</span>
                </div>
                <span className="size-[6px] rounded-full bg-[#dce0e5]" />
                <div className="flex items-center gap-1.5">
                  <ShoppingBasket className="h-4 w-4 text-[#6f7c8e]" />
                  <span className="text-[15px] text-[#6f7c8e] tracking-tight">154 sipariş</span>
                </div>
              </div>
            </div>

            {/* Headline info rows — first 2 attributes if available, otherwise omitted */}
            {headlineSpecs.length > 0 && (
              <div className="flex flex-col gap-2">
                {headlineSpecs.map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-4 text-[15px] tracking-tight">
                    <span className="text-[#6f7c8e] shrink-0 whitespace-nowrap">{label}:</span>
                    <span className="text-[#14181f] min-w-0 break-words">{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="h-px bg-[#dce0e5]" />

            {/* Quantity */}
            <div className="flex flex-col gap-1.5 w-[135px]">
              <span className="text-[15px] font-medium text-[#14181f] tracking-tight">
                Adet
              </span>
              <div className="bg-white border border-[#3348ff] rounded-lg h-10 flex items-center gap-1 p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="bg-[#e0edff] hover:bg-[#c8deff] transition-colors rounded-md size-8 flex items-center justify-center"
                  aria-label="Adeti azalt"
                >
                  <Minus className="h-4 w-4 text-[#3348ff]" />
                </button>
                <span className="flex-1 text-center text-[15px] font-medium text-[#14181f] tracking-tight">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => (product.stock > 0 ? Math.min(product.stock, q + 1) : q + 1))
                  }
                  className="bg-[#e0edff] hover:bg-[#c8deff] transition-colors rounded-md size-8 flex items-center justify-center"
                  aria-label="Adeti artır"
                >
                  <Plus className="h-4 w-4 text-[#3348ff]" />
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1">
              <span className="text-[15px] text-[#525e6f] tracking-tight">Fiyat</span>
              <span className="font-semibold text-[20px] text-[#14181f] leading-[1.4]">
                {formatPrice(product.price)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-stretch gap-2">
              <button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className={`flex-1 h-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg flex items-center justify-center gap-2 px-3 shadow-[inset_0px_12px_12px_rgba(255,255,255,0.12),inset_0px_-2px_2px_rgba(48,48,48,0.1)] ${
                  added
                    ? 'bg-[#1a9e5c] hover:bg-[#158a50]'
                    : 'bg-[#3348ff] hover:bg-[#2236e0]'
                }`}
              >
                {added ? <Check className="h-5 w-5 text-white" /> : <ShoppingCart className="h-5 w-5 text-white" />}
                <span className="text-[15px] font-medium text-white tracking-tight whitespace-nowrap">
                  {!isInStock ? 'Stokta yok' : added ? 'Eklendi' : 'Sepete ekle'}
                </span>
              </button>
              <button
                onClick={() => setWishlisted((v) => !v)}
                className="size-10 shrink-0 bg-white border border-[#dce0e5] hover:bg-[#f6f7f9] transition-colors rounded-lg flex items-center justify-center shadow-[inset_0px_12px_12px_rgba(255,255,255,0.12),inset_0px_-2px_2px_rgba(48,48,48,0.1)]"
                aria-label="Favorilere ekle"
              >
                <Heart
                  className={`h-[18px] w-[18px] ${
                    wishlisted ? 'fill-red-500 text-red-500' : 'text-[#14181f]'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom section ─────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_374px] gap-5 items-start">

          {/* LEFT: Tabs + description */}
          <div className="border-t border-[#dce0e5] pt-1">
            {/* Tab navigation */}
            <div className="flex border-b border-[#dce0e5]">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[15px] px-2.5 py-2.5 transition-colors tracking-tight whitespace-nowrap ${
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
            <div className="pt-6">
              {activeTab === 'Açıklama' && (
                <div>
                  <div className="text-[16px] text-[#14181f] leading-[24px] space-y-3 mb-8">
                    {product.description ? (
                      <p>{product.description}</p>
                    ) : (
                      <p className="text-[#6f7c8e]">Açıklama eklenmemiş.</p>
                    )}
                  </div>

                  {/* Full attributes table */}
                  {allSpecEntries.length > 0 && (
                    <div className="border-t border-[#dce0e5]">
                      {allSpecEntries.map(({ label, value }) => (
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
                            <span className="text-[15px] text-[#525e6f] tracking-tight">
                              {value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Yorumlar' && (
                <div className="text-[15px] text-[#6f7c8e]">Henüz yorum yok.</div>
              )}

              {activeTab === 'Mağaza' && (
                <div className="space-y-3">
                  <p className="text-[15px] text-[#14181f]">
                    <span className="text-[#6f7c8e]">Mağaza: </span>
                    <span className="font-semibold">{sellerDisplayName}</span>
                  </p>
                  <button
                    onClick={() =>
                      navigate({ to: '/store/$sellerId', params: { sellerId: product.sellerId } })
                    }
                    className="text-[15px] text-[#3348ff] hover:underline"
                  >
                    Bu satıcının tüm ürünlerini gör →
                  </button>
                </div>
              )}

              {activeTab === 'Kullanım kılavuzu' && (
                <div className="text-[15px] text-[#6f7c8e]">Kullanım kılavuzu mevcut değil.</div>
              )}
            </div>
          </div>

          {/* RIGHT: Seller card + rating card stacked */}
          <div className="flex flex-col gap-4">
            {/* Seller card */}
            <div className="bg-white border border-[#dce0e5] rounded-lg shadow-[0px_1px_2px_rgba(128,128,128,0.12)] p-5 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="bg-[#b3f8eb] rounded-lg size-14 flex items-center justify-center shrink-0">
                  <Store className="h-8 w-8 text-[#0d9488]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-[#3348ff] tracking-tight truncate">
                    {sellerDisplayName}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  navigate({ to: '/store/$sellerId', params: { sellerId: product.sellerId } })
                }
                className="bg-white border border-[#dce0e5] hover:bg-[#f6f7f9] transition-colors rounded-lg h-10 flex items-center justify-center w-full shadow-[inset_0px_12px_12px_rgba(255,255,255,0.12),inset_0px_-2px_2px_rgba(48,48,48,0.1)]"
              >
                <span className="text-[15px] font-medium text-[#14181f] tracking-tight">
                  Satıcı profili
                </span>
              </button>
            </div>

            {/* Rating overview card */}
            <div className="bg-white border border-[#dce0e5] rounded-lg shadow-[0px_1px_2px_rgba(128,128,128,0.12)] p-5 flex flex-col gap-4">
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
                  <span className="text-[18px] font-semibold text-[#14181f]">5 üzerinden 4.7</span>
                </div>
                <p className="text-[15px] text-[#6f7c8e] tracking-tight">458 değerlendirme</p>
              </div>

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

              <button className="bg-white border border-[#dce0e5] hover:bg-[#f6f7f9] transition-colors rounded-lg h-10 flex items-center justify-center gap-2 w-full shadow-[inset_0px_12px_12px_rgba(255,255,255,0.12),inset_0px_-2px_2px_rgba(48,48,48,0.1)]">
                <PenLine className="h-4 w-4 text-[#14181f]" />
                <span className="text-[15px] font-medium text-[#14181f] tracking-tight">
                  Yorum yaz
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
