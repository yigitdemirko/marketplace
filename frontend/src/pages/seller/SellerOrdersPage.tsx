import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Truck, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/api/orders'
import type { Order } from '@/types'

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    CONFIRMED: { label: 'Confirmed', className: 'bg-[#e6f7ee] text-[#00a81c]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    SHIPPED: { label: 'Shipped', className: 'bg-[#e8eaff] text-[#3348ff]', icon: <Truck className="h-3.5 w-3.5" /> },
    DELIVERED: { label: 'Delivered', className: 'bg-[#e6f7ee] text-[#00a81c]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    PENDING: { label: 'Pending', className: 'bg-[#fff3e0] text-[#ff9017]', icon: <Clock className="h-3.5 w-3.5" /> },
    PAYMENT_PENDING: { label: 'Pending', className: 'bg-[#fff3e0] text-[#ff9017]', icon: <Clock className="h-3.5 w-3.5" /> },
    STOCK_RESERVING: { label: 'Processing', className: 'bg-[#e8eaff] text-[#3348ff]', icon: <Clock className="h-3.5 w-3.5" /> },
    CANCELLED: { label: 'Cancelled', className: 'bg-[#ffeaea] text-[#fa3434]', icon: <XCircle className="h-3.5 w-3.5" /> },
  }
  const c = config[status] ?? { label: status, className: 'bg-[#f6f7f9] text-[#6f7c8e]', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[12px] font-semibold ${c.className}`}>
      {c.icon}
      {c.label}
    </span>
  )
}

export function SellerOrdersPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="search"
          placeholder="Search by order ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] min-w-[180px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff]"
        >
          <option value="all">Status: any</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#dce0e5] rounded-[8px]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f6f7f9] border-b border-[#dce0e5]">
              <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Order ID</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Items</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-[#6f7c8e]">Total sum</th>
              <th className="text-right px-4 py-3 font-semibold text-[#6f7c8e]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f6f7f9]">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-8 bg-[#f6f7f9] animate-pulse rounded" />
                  </td>
                </tr>
              ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#6f7c8e]">
                  {ordersData?.length === 0
                    ? 'No orders yet. Orders will appear here when buyers purchase your products.'
                    : 'No orders match your filters.'}
                </td>
              </tr>
            )}
            {filtered.map((order: Order) => (
              <tr key={order.id} className="hover:bg-[#f6f7f9] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-[#3348ff]">
                    <Truck className="h-4 w-4 shrink-0" />
                    <span className="font-medium font-mono text-[12px]">{order.id.slice(0, 8)}…</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#6f7c8e]">
                  {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-[#6f7c8e]">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-[11px] text-[#6f7c8e] mr-1">USD</span>
                  <span className="font-medium text-[#14181f]">{Number(order.totalAmount).toFixed(2)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => shipMutation.mutate(order.id)}
                      disabled={shipMutation.isPending || deliverMutation.isPending}
                      className="h-7 px-3 text-[12px] font-medium bg-[#3348ff] hover:bg-[#2236e0] disabled:opacity-60 text-white rounded-[4px] transition-colors"
                    >
                      Mark Shipped
                    </button>
                  )}
                  {order.status === 'SHIPPED' && (
                    <button
                      onClick={() => deliverMutation.mutate(order.id)}
                      disabled={shipMutation.isPending || deliverMutation.isPending}
                      className="h-7 px-3 text-[12px] font-medium bg-[#00a81c] hover:bg-[#008c18] disabled:opacity-60 text-white rounded-[4px] transition-colors"
                    >
                      Mark Delivered
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
