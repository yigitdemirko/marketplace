import { useState } from 'react'
import { ShoppingCart, Heart, Package } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useCartStore } from '@/store/cartStore'
import { Star } from 'lucide-react'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  onClick?: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const navigate = useNavigate()
  const [wishlisted, setWishlisted] = useState(false)

  const mainImage = product.images?.[0]
  const isOutOfStock = product.stock === 0

  const handleClick = () => {
    if (onClick) onClick()
    else navigate({ to: '/products/$productId', params: { productId: product.id } })
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      productId: product.id,
      sellerId: product.sellerId,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: mainImage,
    })
  }

  return (
    <div
      className="bg-white rounded-[12px] cursor-pointer"
      onClick={handleClick}
    >
      {/* Image area */}
      <div className="relative bg-[#edf0f2] rounded-[12px] h-[270px] overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-[#cbd3db]" />
          </div>
        )}

        {/* Wishlist button */}
        <button
          aria-label="Toggle wishlist"
          className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center bg-white/40 rounded-[8px] hover:bg-white/70 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            setWishlisted((p) => !p)
          }}
        >
          <Heart
            className={`h-[22px] w-[22px] transition-colors ${
              wishlisted ? 'fill-[#3348ff] text-[#3348ff]' : 'text-[#6f7c8e]'
            }`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 py-3">
        <p className="text-[15px] text-[#14181f] leading-[1.4] line-clamp-2 tracking-[-0.3px]">
          {product.name}
        </p>

        <div className="flex items-center gap-1.5">
          <Star className="h-[15px] w-[15px] fill-[#db6e00] text-[#db6e00]" />
          <span className="text-[13px] text-[#6f7c8e]">4.5</span>
          <span className="text-[13px] text-[#6f7c8e]">(0 orders)</span>
        </div>

        <p className="text-[15px] font-semibold text-[#14181f]">
          ${Number(product.price).toFixed(2)}
        </p>

        <button
          className="w-full py-2 px-3 bg-[#e0edff] rounded-[8px] flex items-center justify-center gap-2 text-[15px] font-medium text-[#3348ff] hover:bg-[#c7dfff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-5 w-5" />
          {isOutOfStock ? 'Out of Stock' : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}
