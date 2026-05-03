import { useState } from 'react'
import { ShoppingCart, Package, Star, Check } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useAddBasketItem } from '@/hooks/useBasket'
import { useAddedToCartFeedback } from '@/lib/cartFeedback'
import type { Product } from '@/types'
import { formatPrice } from '@/lib/formatPrice'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useAddBasketItem()
  const notifyAdded = useAddedToCartFeedback()
  const [added, setAdded] = useState(false)

  const mainImage = product.images?.[0]
  const isOutOfStock = product.stock === 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem.mutate({
      productId: product.id,
      quantity: 1,
      snapshot: {
        name: product.name,
        price: product.price,
        sellerId: product.sellerId,
        image: mainImage,
      },
    })
    notifyAdded()
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Link
      to="/products/$productId"
      params={{ productId: product.id }}
      className="bg-white rounded-[12px] flex flex-col text-inherit no-underline"
    >
      {/* Image area */}
      <div className="relative bg-[#edf0f2] rounded-[12px] h-[270px] overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-[#cbd3db]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 px-3 py-3 flex-1">
        <p className="text-[15px] text-[#14181f] leading-[1.4] line-clamp-2 min-h-[42px] tracking-[-0.3px]">
          {product.name}
        </p>

        <div className="flex items-center gap-1.5">
          <Star className="h-[15px] w-[15px] fill-[#db6e00] text-[#db6e00]" />
          <span className="text-[13px] text-[#6f7c8e]">4.5</span>
          <span className="text-[13px] text-[#6f7c8e]">(0 sipariş)</span>
        </div>

        <p className="text-[15px] font-semibold text-[#14181f] mt-auto">
          {formatPrice(product.price)}
        </p>

        <button
          className={`w-full py-2 px-3 rounded-[8px] flex items-center justify-center gap-2 text-[15px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            added
              ? 'bg-[#e6f9f0] text-[#1a9e5c]'
              : 'bg-[#e0edff] text-[#3348ff] hover:bg-[#c7dfff]'
          }`}
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
          {isOutOfStock ? 'Stokta yok' : added ? 'Eklendi' : 'Sepete ekle'}
        </button>
      </div>
    </Link>
  )
}
