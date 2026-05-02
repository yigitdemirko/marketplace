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
import { formatPrice } from '@/lib/formatPrice'
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

const STATUS_LABELS: Record<Order['status'], string> = {
  PENDING: 'Beklemede',
  STOCK_RESERVING: 'Stok ayrılıyor',
  PAYMENT_PENDING: 'Ödeme bekleniyor',
  CONFIRMED: 'Onaylandı',
  SHIPPED: 'Kargoya verildi',
  DELIVERED: 'Teslim edildi',
  CANCELLED: 'İptal edildi',
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
    return <p className="text-destructive">Sipariş bulunamadı.</p>
  }

  const isCancellable = CANCELLABLE.includes(order.status)

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" onClick={() => navigate({ to: '/orders' })} className="pl-0">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Siparişlere dön
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sipariş #{order.id.slice(0, 8)}</h1>
        <Badge variant={statusColors[order.status] as 'default' | 'secondary' | 'destructive'}>
          {STATUS_LABELS[order.status]}
        </Badge>
      </div>

      {order.status === 'SHIPPED' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
          Siparişiniz yola çıktı!
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ürünler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item, index) => {
            const product = productQueries[index]?.data
            const image = product?.images?.[0]
            const name = product?.name ?? item.productId

            return (
              <div key={item.id} className="flex items-center gap-4">
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

                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[#14181f] truncate">{name}</p>
                  <p className="text-[13px] text-[#6f7c8e]">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                </div>

                <p className="text-[15px] font-semibold text-[#14181f] shrink-0">
                  {formatPrice(item.quantity * item.unitPrice)}
                </p>
              </div>
            )
          })}

          <Separator />
          <div className="flex justify-between font-bold text-[16px]">
            <span>Toplam</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teslimat</CardTitle>
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
          {cancelMutation.isPending ? 'İptal ediliyor...' : 'Siparişi iptal et'}
        </Button>
      )}
    </div>
  )
}
