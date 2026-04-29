import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { productsApi } from '@/api/products'
import { useAuthStore } from '@/store/authStore'

export function SellerProductsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  if (!isAuthenticated || user?.accountType !== 'SELLER') {
    navigate({ to: '/' })
    return null
  }

  const { data, isLoading } = useQuery({
    queryKey: ['seller-products', user?.userId],
    queryFn: () => productsApi.getBySeller(user!.userId),
    enabled: !!user,
  })

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => productsApi.delete(productId, user!.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Button onClick={() => navigate({ to: '/seller/products/new' })}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {data?.content.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No products yet. Add your first product!
        </p>
      )}

      <div className="space-y-4">
        {data?.content.map((product) => (
          <Card key={product.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{product.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={product.active ? 'default' : 'secondary'}>
                    {product.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate({ to: '/seller/products/$productId/edit', params: { productId: product.id } })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>₺{product.price.toFixed(2)}</span>
                <span>Stock: {product.stock}</span>
                <span>Category: {product.categoryId}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}