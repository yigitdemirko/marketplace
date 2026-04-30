import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft } from 'lucide-react'
import { ordersApi } from '@/api/orders'
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
        <CardContent className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{item.productId}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} × ₺{item.unitPrice.toFixed(2)}
                </p>
              </div>
              <p className="font-medium">
                ₺{(item.quantity * item.unitPrice).toFixed(2)}
              </p>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>₺{order.totalAmount.toFixed(2)}</span>
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
