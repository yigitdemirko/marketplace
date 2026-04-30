import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

export function OrdersPage() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  if (!isAuthenticated) {
    navigate({ to: '/login' })
    return null
  }

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders', user?.userId],
    queryFn: () => ordersApi.getAll(user!.userId),
    enabled: !!user,
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

  if (isError) {
    return <p className="text-destructive">Failed to load orders.</p>
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-xl font-semibold">No orders yet</h2>
        <p className="text-muted-foreground">Start shopping to place your first order</p>
        <Button onClick={() => navigate({ to: '/' })}>Browse Products</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card
            key={order.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: order.id } })}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono text-muted-foreground">
                  #{order.id.slice(0, 8)}
                </CardTitle>
                <Badge variant={statusColors[order.status] as 'default' | 'secondary' | 'destructive'}>
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {order.items.length} item{order.items.length > 1 ? 's' : ''}
                </p>
                <p className="font-bold">₺{order.totalAmount.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}