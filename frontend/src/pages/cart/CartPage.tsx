import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from '@tanstack/react-router'
import {
  ShoppingBag,
  Heart,
  X,
  ArrowRight,
  Star,
  Package,
  ShoppingCart,
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { productsApi } from '@/api/products'
import type { Product } from '@/types'
import { useLocaleStore } from '@/store/localeStore'
import { formatPrice } from '@/lib/formatPrice'

const DELIVERY_COST = 25
const TAX_RATE = 0.08

function SuggestedProductCard({
  product,
  onAddToCart,
}: {
  product: Product
  onAddToCart: () => void
}) {
  const [wishlisted, setWishlisted] = useState(false)
  const mainImage = product.images?.[0]

  return (
    <div className="bg-white border border-[#dce0e5] rounded-[8px] overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-[#f6f7f9] flex items-center justify-center overflow-hidden">
        {mainImage ? (
          <img src={mainImage} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
        ) : (
          <Package className="h-10 w-10 text-gray-300" />
        )}
        <button
          onClick={() => setWishlisted((v) => !v)}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white border border-[#dce0e5] hover:border-[#b6c1ca] transition-colors"
        >
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-[#6f7c8e]'}`} />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-[14px] text-[#14181f] font-medium leading-snug line-clamp-2">{product.name}</p>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`h-3 w-3 ${s <= 4 ? 'fill-[#ff9017] text-[#ff9017]' : 'fill-gray-200 text-gray-200'}`} />
          ))}
          <span className="text-[12px] text-[#6f7c8e] ml-1">(132 reviews)</span>
        </div>

        <p className="text-[15px] font-semibold text-[#14181f]">{formatPrice(product.price, product.locale ?? 'EN')}</p>

        <button
          onClick={onAddToCart}
          className="mt-auto w-full h-[36px] border border-[#dce0e5] rounded-[6px] text-[14px] text-[#14181f] font-medium flex items-center justify-center gap-2 hover:bg-[#f6f7f9] transition-colors"
        >
          <ShoppingCart className="h-4 w-4 text-[#3348ff]" />
          Add to cart
        </button>
      </div>
    </div>
  )
}

export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, addItem, totalAmount, totalItems } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const { locale } = useLocaleStore()
  const navigate = useNavigate()
  const [wishlistedItems, setWishlistedItems] = useState<Set<string>>(new Set())

  const { data: suggestedData } = useQuery({
    queryKey: ['products', 'cart-suggested'],
    queryFn: () => productsApi.getAll(1, 4),
  })

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate({ to: '/login' })
    } else {
      navigate({ to: '/checkout' })
    }
  }

  const handleWishlist = (productId: string) => {
    setWishlistedItems((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const subtotal = totalAmount()
  const tax = subtotal * TAX_RATE
  const total = subtotal + DELIVERY_COST + tax

  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + 5)
  const deliveryStr = deliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (items.length === 0) {
    return (
      <div className="-mx-4 -mt-8">
        <div className="max-w-[1180px] mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-[#f6f7f9] p-8">
            <ShoppingBag className="h-14 w-14 text-[#6f7c8e]" />
          </div>
          <h2 className="text-[24px] font-semibold text-[#14181f]">Your cart is empty</h2>
          <p className="text-[15px] text-[#6f7c8e]">Add some products to get started</p>
          <Link to="/" className="bg-[#3348ff] hover:bg-[#2236e0] text-white px-8 py-3 rounded-[8px] text-[15px] font-medium transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="-mx-4 -mt-8">
      <div className="max-w-[1180px] mx-auto px-4 py-8">

        <h1 className="text-[24px] font-semibold text-[#14181f] mb-1">Your cart</h1>
        <p className="text-[15px] text-[#6f7c8e] mb-6">{totalItems()} Products in Your cart</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* Cart items */}
          <div className="bg-white border border-[#dce0e5] rounded-[8px] overflow-hidden">
            {items.map((item, index) => (
              <div key={item.productId}>
                {index > 0 && <div className="h-px bg-[#dce0e5]" />}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4">
                  <div className="shrink-0 size-[60px] bg-[#f6f6f8] border border-[#dce0e5] rounded-[6px] overflow-hidden flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                      <Package className="h-6 w-6 text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#14181f] leading-snug truncate">{item.name}</p>
                    <p className="text-[13px] text-[#6f7c8e] mt-0.5">Price: {formatPrice(item.price, item.locale ?? 'EN')} / per item</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                      className="border border-[#dce0e5] rounded-[6px] text-[14px] text-[#14181f] px-2 py-1.5 bg-white outline-none cursor-pointer focus:border-[#3348ff]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>Qty: {n}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleWishlist(item.productId)}
                      className="p-1.5 rounded hover:bg-[#f6f7f9] transition-colors"
                      aria-label="Save for later"
                    >
                      <Heart className={`h-4 w-4 ${wishlistedItems.has(item.productId) ? 'fill-red-500 text-red-500' : 'text-[#6f7c8e]'}`} />
                    </button>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 rounded hover:bg-[#f6f7f9] transition-colors"
                      aria-label="Remove item"
                    >
                      <X className="h-4 w-4 text-[#6f7c8e]" />
                    </button>
                  </div>

                  <div className="shrink-0 min-w-0 sm:min-w-[96px] text-right ml-auto sm:ml-0">
                    <p className="text-[15px] font-semibold text-[#14181f]">{formatPrice(item.price * item.quantity, item.locale ?? 'EN')}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="h-px bg-[#dce0e5]" />
            <div className="px-4 py-3">
              <button onClick={clearCart} className="text-[14px] text-[#3348ff] hover:underline">
                Remove all from cart
              </button>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white border border-[#dce0e5] rounded-[8px] p-4 sticky top-4">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-[15px]">
                <span className="text-[#6f7c8e]">{totalItems()} items:</span>
                <span className="text-[#14181f] font-medium">{formatPrice(subtotal, locale)}</span>
              </div>
              <div className="flex justify-between text-[15px]">
                <span className="text-[#6f7c8e]">Delivery cost:</span>
                <span className="text-[#14181f] font-medium">{formatPrice(DELIVERY_COST, locale)}</span>
              </div>
              <div className="flex justify-between text-[15px]">
                <span className="text-[#6f7c8e]">Tax:</span>
                <span className="text-[#14181f] font-medium">{formatPrice(tax, locale)}</span>
              </div>
            </div>

            <div className="h-px bg-[#dce0e5] mb-4" />

            <div className="flex justify-between items-center mb-5">
              <span className="text-[16px] font-semibold text-[#14181f]">Total:</span>
              <span className="text-[22px] font-bold text-[#14181f]">{formatPrice(total, locale)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full h-[48px] bg-[#3348ff] hover:bg-[#2236e0] text-white rounded-[8px] text-[15px] font-medium flex items-center justify-center gap-2 transition-colors mb-4"
            >
              Checkout <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-2 bg-[#f6f7f9] rounded-[6px] px-3 py-2.5">
              <ShoppingBag className="h-4 w-4 text-[#3348ff] shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#6f7c8e] leading-snug">
                Delivered by <span className="text-[#14181f] font-medium">Morning, {deliveryStr}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Customers also bought */}
        {suggestedData && suggestedData.content.length > 0 && (
          <div className="mt-10">
            <h2 className="text-[20px] font-semibold text-[#14181f] mb-5">Customer also bought these</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {suggestedData.content.map((product) => (
                <SuggestedProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() =>
                    addItem({
                      productId: product.id,
                      sellerId: product.sellerId,
                      name: product.name,
                      price: product.price,
                      quantity: 1,
                      image: product.images?.[0],
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
