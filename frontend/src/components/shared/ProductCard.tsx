import { ShoppingCart, Package, Star } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useCartStore } from '@/store/cartStore'
import { useAddedToCartFeedback } from '@/lib/cartFeedback'
import type { Product } from '@/types'
import { formatPrice } from '@/lib/formatPrice'

interface ProductCardProps {
  product: Product
  onClick?: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const notifyAdded = useAddedToCartFeedback()
  const navigate = useNavigate()

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
    notifyAdded()
  }

  return (
    <div
      className="bg-white rounded-[12px] cursor-pointer flex flex-col"
      onClick={handleClick}
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
          className="w-full py-2 px-3 bg-[#e0edff] rounded-[8px] flex items-center justify-center gap-2 text-[15px] font-medium text-[#3348ff] hover:bg-[#c7dfff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-5 w-5" />
          {isOutOfStock ? 'Stokta yok' : 'Sepete ekle'}
        </button>
      </div>
    </div>
  )
}
