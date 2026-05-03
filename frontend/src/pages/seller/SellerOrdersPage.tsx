import { Fragment, useState, useMemo } from 'react'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { Truck, CheckCircle2, Clock, XCircle, ChevronDown, ChevronRight, MapPin, Package } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/api/orders'
import { productsApi } from '@/api/products'
import { formatPrice } from '@/lib/formatPrice'
import type { Order, OrderItem } from '@/types'

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    CONFIRMED: { label: 'Onaylandı', className: 'bg-[#e6f7ee] text-[#00a81c]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    SHIPPED: { label: 'Kargoda', className: 'bg-[#e8eaff] text-[#3348ff]', icon: <Truck className="h-3.5 w-3.5" /> },
    DELIVERED: { label: 'Teslim edildi', className: 'bg-[#e6f7ee] text-[#00a81c]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    PENDING: { label: 'Beklemede', className: 'bg-[#fff3e0] text-[#ff9017]', icon: <Clock className="h-3.5 w-3.5" /> },
    PAYMENT_PENDING: { label: 'Beklemede', className: 'bg-[#fff3e0] text-[#ff9017]', icon: <Clock className="h-3.5 w-3.5" /> },
    STOCK_RESERVING: { label: 'İşleniyor', className: 'bg-[#e8eaff] text-[#3348ff]', icon: <Clock className="h-3.5 w-3.5" /> },
    CANCELLED: { label: 'İptal edildi', className: 'bg-[#ffeaea] text-[#fa3434]', icon: <XCircle className="h-3.5 w-3.5" /> },
  }
  const c = config[status] ?? { label: status, className: 'bg-[#f6f7f9] text-[#6f7c8e]', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[12px] font-semibold ${c.className}`}>
      {c.icon}
      {c.label}
    </span>
  )
}

function OrderDetailsRow({ order, sellerId, colSpan }: { order: Order; sellerId: string; colSpan: number }) {
  const sellerItems = order.items.filter((item) => item.sellerId === sellerId)

  const productQueries = useQueries({
    queries: sellerItems.map((item) => ({
      queryKey: ['product', item.productId],
      queryFn: () => productsApi.getById(item.productId),
      staleTime: 1000 * 60 * 5,
    })),
  })

  const sellerSubtotal = sellerItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0,
  )

  return (
    <tr className="bg-[#fafbfc]">
      <td colSpan={colSpan} className="px-4 py-4">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="border border-[#dce0e5] rounded-[6px] bg-white p-4">
            <h4 className="text-[13px] font-semibold text-[#14181f] mb-3">
              Sevkiyat ürünleri ({sellerItems.length})
            </h4>
            <div className="space-y-3">
              {sellerItems.map((item: OrderItem, idx: number) => {
                const product = productQueries[idx]?.data
                const image = product?.images?.[0]
                const name = product?.name ?? `Ürün ${item.productId.slice(0, 8)}…`
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 shrink-0 rounded-[6px] bg-[#edf0f2] overflow-hidden flex items-center justify-center">
                      {image ? (
                        <img src={image} alt={name} className="w-full h-full object-contain mix-blend-multiply" />
                      ) : (
                        <Package className="h-5 w-5 text-[#cbd3db]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#14181f] truncate">{name}</p>
                      <p className="text-[12px] text-[#6f7c8e]">
                        {item.quantity} adet × {formatPrice(item.unitPrice)}
                      </p>
                      {product?.brand && (
                        <p className="text-[11px] text-[#6f7c8e] mt-0.5">Marka: {product.brand}</p>
                      )}
                    </div>
                    <p className="text-[13px] font-semibold text-[#14181f] shrink-0">
                      {formatPrice(item.quantity * Number(item.unitPrice))}
                    </p>
                  </div>
                )
              })}
              <div className="pt-3 border-t border-[#f6f7f9] flex justify-between text-[13px]">
                <span className="text-[#6f7c8e]">Sizin ürünlerinizin toplamı</span>
                <span className="font-semibold text-[#14181f]">{formatPrice(sellerSubtotal)}</span>
              </div>
            </div>
          </div>

          <div className="border border-[#dce0e5] rounded-[6px] bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-[#6f7c8e]" />
              <h4 className="text-[13px] font-semibold text-[#14181f]">Teslimat adresi</h4>
            </div>
            <p className="text-[13px] text-[#14181f] whitespace-pre-line leading-relaxed">
              {order.shippingAddress}
            </p>
            <div className="mt-4 pt-3 border-t border-[#f6f7f9] space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#6f7c8e]">Sipariş ID</span>
                <span className="font-mono text-[#14181f]">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6f7c8e]">Müşteri ID</span>
                <span className="font-mono text-[#14181f]">{order.userId.slice(0, 8)}…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6f7c8e]">Sipariş zamanı</span>
                <span className="text-[#14181f]">
                  {new Date(order.createdAt).toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

export function SellerOrdersPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['seller-orders', user?.userId],
    queryFn: () => ordersApi.getSellerOrders(user!.userId),
    enabled: !!user,
  })

  const shipMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.markAsShipped(orderId, user!.userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller-orders', user?.userId] }),
  })

  const deliverMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.markAsDelivered(orderId, user!.userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller-orders', user?.userId] }),
  })

  const filtered = useMemo(() => {
    if (!ordersData) return []
    return ordersData.filter((o: Order) => {
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter.toUpperCase()
      const matchesSearch = !searchQuery || o.id.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [ordersData, statusFilter, searchQuery])

  const toggleExpanded = (orderId: string) => {
    setExpandedId((prev) => (prev === orderId ? null : orderId))
  }

  const COLS = 7

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="search"
          placeholder="Sipariş ID ile ara"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] min-w-[180px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff]"
        >
          <option value="all">Durum: tümü</option>
          <option value="pending">Beklemede</option>
          <option value="confirmed">Onaylandı</option>
          <option value="shipped">Kargoda</option>
          <option value="delivered">Teslim edildi</option>
          <option value="cancelled">İptal edildi</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#dce0e5] rounded-[8px]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f6f7f9] border-b border-[#dce0e5]">
              <th className="w-8 px-2 py-3"></th>
              <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Sipariş ID</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Tarih</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Ürün</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Durum</th>
              <th className="text-right px-4 py-3 font-semibold text-[#6f7c8e]">Toplam</th>
              <th className="text-right px-4 py-3 font-semibold text-[#6f7c8e]">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f6f7f9]">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={COLS} className="px-4 py-3">
                    <div className="h-8 bg-[#f6f7f9] animate-pulse rounded" />
                  </td>
                </tr>
              ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={COLS} className="px-4 py-12 text-center text-[#6f7c8e]">
                  {ordersData?.length === 0
                    ? 'Henüz sipariş yok. Müşteriler ürünlerinizi satın aldığında siparişler burada görünür.'
                    : 'Filtrelerinize uygun sipariş bulunamadı.'}
                </td>
              </tr>
            )}
            {filtered.map((order: Order) => {
              const isExpanded = expandedId === order.id
              const sellerItemCount = order.items.filter((i) => i.sellerId === user!.userId).length
              return (
                <Fragment key={order.id}>
                  <tr
                    onClick={() => toggleExpanded(order.id)}
                    className={`hover:bg-[#f6f7f9] cursor-pointer transition-colors ${isExpanded ? 'bg-[#f6f7f9]' : ''}`}
                  >
                    <td className="px-2 py-3 text-[#6f7c8e]">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[#3348ff]">
                        <Truck className="h-4 w-4 shrink-0" />
                        <span className="font-medium font-mono text-[12px]">{order.id.slice(0, 8)}…</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6f7c8e]">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-[#6f7c8e]">{sellerItemCount} ürün</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-[#14181f]">{formatPrice(order.totalAmount)}</span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {order.status === 'CONFIRMED' && (
                        <button
                          onClick={() => shipMutation.mutate(order.id)}
                          disabled={shipMutation.isPending || deliverMutation.isPending}
                          className="h-7 px-3 text-[12px] font-medium bg-[#3348ff] hover:bg-[#2236e0] disabled:opacity-60 text-white rounded-[4px] transition-colors"
                        >
                          Kargoya ver
                        </button>
                      )}
                      {order.status === 'SHIPPED' && (
                        <button
                          onClick={() => deliverMutation.mutate(order.id)}
                          disabled={shipMutation.isPending || deliverMutation.isPending}
                          className="h-7 px-3 text-[12px] font-medium bg-[#00a81c] hover:bg-[#008c18] disabled:opacity-60 text-white rounded-[4px] transition-colors"
                        >
                          Teslim edildi
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <OrderDetailsRow
                      order={order}
                      sellerId={user!.userId}
                      colSpan={COLS}
                    />
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
