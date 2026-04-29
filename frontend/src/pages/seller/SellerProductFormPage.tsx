import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { productsApi } from '@/api/products'
import { useAuthStore } from '@/store/authStore'

export function SellerProductFormPage() {
  const { productId } = useParams({ strict: false })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isEdit = !!productId

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
  })
  const [error, setError] = useState('')

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        stock: product.stock.toString(),
        categoryId: product.categoryId,
      })
    }
  }, [product])

  const createMutation = useMutation({
    mutationFn: () => productsApi.create({
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      categoryId: form.categoryId,
    }, user!.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      navigate({ to: '/seller/products' })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create product'),
  })

  const updateMutation = useMutation({
    mutationFn: () => productsApi.update(productId!, {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      categoryId: form.categoryId,
    }, user!.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      navigate({ to: '/seller/products' })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to update product'),
  })

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (isEdit) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="max-w-lg space-y-6">
      <Button variant="ghost" onClick={() => navigate({ to: '/seller/products' })} className="pl-0">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Button>

      <h1 className="text-2xl font-bold">
        {isEdit ? 'Edit Product' : 'Add Product'}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₺)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category ID</Label>
              <Input
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}