import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import { productsApi } from '@/api/products'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'

export function ProductDetailPage() {
  const { productId } = useParams({ strict: false })
  const addItem = useCartStore((state) => state.addItem)
  const { user } = useAuthStore()

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
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (isError || !product) {
    return <p className="text-destructive">Product not found.</p>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => window.history.back()}
        className="pl-0"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.stock === 0 && (
            <Badge variant="secondary">Out of Stock</Badge>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <Badge variant="destructive">Low Stock</Badge>
          )}
        </div>

        <p className="text-3xl font-bold">₺{product.price.toFixed(2)}</p>

        <p className="text-muted-foreground">{product.description}</p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Stock: {product.stock}</span>
          <span>•</span>
          <span>Category: {product.categoryId}</span>
        </div>

        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Attributes</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(product.attributes).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {user?.accountType === 'BUYER' && (
          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full sm:w-auto"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  )
}