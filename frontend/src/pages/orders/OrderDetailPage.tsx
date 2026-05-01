import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Package } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { productsApi } from '@/api/products'
import { useAuthStore } from '@/store/authStore'
import type { Order } from '@/types'

const statusColors: Record<Order['status'], string> = {
  PENDING: 'secondary',
  STOCK_RESERVING: 'secondary',
  PAYMENT_PENDING: 'secondary',
  CONFIRMED: 'default',
  SHIPPED: 'default',
  DELIVERED: 'default',
  CANCELLED: 'destructive',
}

const CANCELLABLE: Order['status'][] = ['PENDING', 'STOCK_RESERVING']

export function OrderDetailPage() {
  const { orderId } = useParams({ strict: false })
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId!, user!.userId),
    enabled: !!orderId && !!user,
  })

  // Fetch product details for each order item to get names + images
  const productQueries = useQueries({
    queries: (order?.items ?? []).map((item) => ({
      queryKey: ['product', item.productId],
      queryFn: () => productsApi.getById(item.productId),
    })),
  })

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(orderId!, user!.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders', user?.userId] })
    },
  })

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />
  }

  if (isError || !order) {
    return <p className="text-destructive">Order not found.</p>
  }

  const isCancellable = CANCELLABLE.includes(order.status)

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" onClick={() => navigate({ to: '/orders' })} className="pl-0">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
        <Badge variant={statusColors[order.status] as 'default' | 'secondary' | 'destructive'}>
          {order.status}
        </Badge>
      </div>

      {order.status === 'SHIPPED' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
          Your order is on the way!
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item, index) => {
            const product = productQueries[index]?.data
            const image = product?.images?.[0]
            const name = product?.name ?? item.productId

            return (
              <div key={item.id} className="flex items-center gap-4">
                {/* Product image */}
                <div className="w-[60px] h-[60px] shrink-0 rounded-[8px] bg-[#edf0f2] overflow-hidden flex items-center justify-center">
                  {image ? (
                    <img
                      src={image}
                      alt={name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-[#cbd3db]" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[#14181f] truncate">{name}</p>
                  <p className="text-[13px] text-[#6f7c8e]">
                    {item.quantity} × ${item.unitPrice.toFixed(2)}
                  </p>
                </div>

                <p className="text-[15px] font-semibold text-[#14181f] shrink-0">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </p>
              </div>
            )
          })}

          <Separator />
          <div className="flex justify-between font-bold text-[16px]">
            <span>Total</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
        </CardContent>
      </Card>

      {isCancellable && (
        <Button
          variant="destructive"
          disabled={cancelMutation.isPending}
          onClick={() => cancelMutation.mutate()}
        >
          {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
        </Button>
      )}
    </div>
  )
}
