import { useState } from 'react'
import { ShoppingCart, Heart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cartStore'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  onClick?: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      productId: product.id,
      sellerId: product.sellerId,
      name: product.name,
      price: product.price,
      quantity: 1,
    })
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsWishlisted((prev) => !prev)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.()
  }

  const mainImage = product.images?.[0]
  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 5

  return (
    <div
      className="group relative flex flex-col bg-card rounded-xl overflow-hidden ring-1 ring-foreground/10 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className={cn(
              'w-full h-full object-cover transition-transform duration-500',
              isHovered && 'scale-110',
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="h-14 w-14 text-muted-foreground/30" />
          </div>
        )}

        {/* Stock badge */}
        <div className="absolute top-3 left-3">
          {isOutOfStock && (
            <Badge variant="secondary" className="text-xs shadow-sm">
              Out of Stock
            </Badge>
          )}
          {isLowStock && (
            <Badge variant="destructive" className="text-xs shadow-sm">
              Low Stock
            </Badge>
          )}
        </div>

        {/* Wishlist */}
        <button
          className={cn(
            'absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm',
            'transition-all duration-200 hover:scale-110 hover:bg-white',
            isWishlisted ? 'text-destructive' : 'text-muted-foreground',
          )}
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
        >
          <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
        </button>

        {/* Hover action bar */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 flex gap-2 p-3',
            'bg-gradient-to-t from-black/60 to-transparent',
            'transition-all duration-300',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
          )}
        >
          <Button
            className="flex-1 h-9 text-xs bg-white text-foreground hover:bg-white/90 font-semibold"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
          </Button>
          <Button
            className="h-9 w-9 p-0 bg-white text-foreground hover:bg-white/90"
            onClick={handleQuickView}
            aria-label="Quick view"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 p-3 pb-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium truncate">
          {product.categoryId || 'Product'}
        </p>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-card-foreground">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-base font-bold text-primary">
            ₺{product.price.toFixed(2)}
          </span>
          {product.stock > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {product.stock} in stock
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
