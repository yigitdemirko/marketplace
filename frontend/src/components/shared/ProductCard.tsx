import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  onClick?: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const { user } = useAuthStore()

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

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
          {product.stock <= 5 && product.stock > 0 && (
            <Badge variant="destructive" className="ml-2 shrink-0">
              Low Stock
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="secondary" className="ml-2 shrink-0">
              Out of Stock
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <p className="text-lg font-bold mt-2">
          ₺{product.price.toFixed(2)}
        </p>
      </CardContent>
      {user?.accountType === 'BUYER' && (
        <CardFooter>
          <Button
            className="w-full"
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}