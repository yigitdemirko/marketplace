import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  Truck,
  Banknote,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
} from 'lucide-react'
import { productsApi } from '@/api/products'
import { ordersApi } from '@/api/orders'
import { useAuthStore } from '@/store/authStore'
import type { Order } from '@/types'

const CHART_DATA = [42, 68, 55, 90, 72, 110, 95, 130, 88, 115, 145, 160]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    CONFIRMED: { label: 'Confirmed', className: 'bg-[#e6f7ee] text-[#00a81c]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    SHIPPED: { label: 'Shipped', className: 'bg-[#e8eaff] text-[#3348ff]', icon: <Truck className="h-3.5 w-3.5" /> },
    DELIVERED: { label: 'Delivered', className: 'bg-[#e6f7ee] text-[#00a81c]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    PENDING: { label: 'Pending', className: 'bg-[#fff3e0] text-[#ff9017]', icon: <Clock className="h-3.5 w-3.5" /> },
    PAYMENT_PENDING: { label: 'Pending', className: 'bg-[#fff3e0] text-[#ff9017]', icon: <Clock className="h-3.5 w-3.5" /> },
    CANCELLED: { label: 'Cancelled', className: 'bg-[#ffeaea] text-[#fa3434]', icon: <XCircle className="h-3.5 w-3.5" /> },
    STOCK_RESERVING: { label: 'Processing', className: 'bg-[#e8eaff] text-[#3348ff]', icon: <Clock className="h-3.5 w-3.5" /> },
  }
  const c = config[status] ?? { label: status, className: 'bg-[#f6f7f9] text-[#6f7c8e]', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[12px] font-semibold ${c.className}`}>
      {c.icon}
      {c.label}
    </span>
  )
}

const maxChart = Math.max(...CHART_DATA)

export function SellerDashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All orders')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: statsData } = useQuery({
    queryKey: ['seller-stats', user?.userId],
    queryFn: () => ordersApi.getSellerStats(user!.userId),
    enabled: !!user,
  })

  const { data: ordersData } = useQuery({
    queryKey: ['seller-orders', user?.userId],
    queryFn: () => ordersApi.getSellerOrders(user!.userId),
    enabled: !!user,
  })

  const { data: productsData } = useQuery({
    queryKey: ['seller-products', user?.userId],
    queryFn: () => productsApi.getBySeller(user!.userId, 0, 5),
    enabled: !!user,
  })

  const filteredOrders = useMemo(() => {
    if (!ordersData) return []
    return ordersData
      .filter((o: Order) => {
        if (activeFilter === 'Pending') return o.status === 'PENDING' || o.status === 'STOCK_RESERVING' || o.status === 'PAYMENT_PENDING'
        if (activeFilter === 'Confirmed') return o.status === 'CONFIRMED'
        return true
      })
      .filter((o: Order) => !searchQuery || o.id.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5)
  }, [ordersData, activeFilter, searchQuery])

  const stats = [
    {
      label: 'Total orders',
      value: statsData ? String(statsData.totalOrders) : '—',
      icon: <Truck className="h-5 w-5 text-[#3348ff]" />,
    },
    {
      label: 'Gross revenue',
      value: statsData
        ? `$${Number(statsData.grossRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '—',
      icon: <Banknote className="h-5 w-5 text-[#3348ff]" />,
    },
    {
      label: 'Pending shipment',
      value: statsData ? String(statsData.pendingShipment) : '—',
      icon: <ShieldCheck className="h-5 w-5 text-[#3348ff]" />,
    },
  ]

  return (
    <div>
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#f6f7f9] rounded-[8px] p-4">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[14px] text-[#6f7c8e]">{s.label}</p>
              <div className="bg-white border border-[#dce0e5] rounded-[6px] p-2 shrink-0">
                {s.icon}
              </div>
            </div>
            <p className="text-[22px] font-bold text-[#14181f]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Sales chart */}
        <div className="bg-white border border-[#dce0e5] rounded-[8px] p-5">
          <div className="mb-4">
            <h3 className="text-[16px] font-semibold text-[#14181f] mb-0.5">Sales growth chart</h3>
            <p className="text-[13px] text-[#6f7c8e]">Sample data — analytics coming soon</p>
          </div>
          <div className="flex items-end gap-1.5 h-[200px]">
            {CHART_DATA.map((val, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full bg-[#3348ff] rounded-t-[3px] min-h-[4px]"
                  style={{ height: `${(val / maxChart) * 180}px` }}
                />
                <span className="text-[10px] text-[#6f7c8e]">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top selling products */}
        <div className="bg-white border border-[#dce0e5] rounded-[8px] p-5">
          <div className="mb-4">
            <h3 className="text-[16px] font-semibold text-[#14181f] mb-0.5">Top selling products</h3>
            <p className="text-[13px] text-[#6f7c8e]">Your active listings</p>
          </div>
          <table className="w-full text-[13px]">
            <tbody className="divide-y divide-[#f6f7f9]">
              {productsData?.content.length
                ? productsData.content.map((p, i) => (
                    <tr key={p.id} className="hover:bg-[#f6f7f9]">
                      <td className="py-2 text-[#6f7c8e] w-6">{i + 1}.</td>
                      <td className="py-2 flex items-center gap-2">
                        <Package className="h-4 w-4 text-[#6f7c8e] shrink-0" />
                        <span className="text-[#14181f] truncate max-w-[160px]">{p.name}</span>
                      </td>
                      <td className="py-2 text-[#6f7c8e] text-right">{p.stock} pcs</td>
                      <td className="py-2 text-[#14181f] font-medium text-right">${p.price.toFixed(2)}</td>
                    </tr>
                  ))
                : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#6f7c8e] text-[13px]">
                      No products yet
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Latest orders */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h3 className="text-[18px] font-semibold text-[#14181f]">Latest orders</h3>
          <div className="flex items-center gap-2 sm:ml-auto">
            <div className="flex border border-[#dce0e5] rounded-[6px] overflow-hidden text-[13px]">
              {['All orders', 'Pending', 'Confirmed'].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveFilter(t)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    activeFilter === t
                      ? 'bg-[#3348ff] text-white'
                      : 'bg-white text-[#6f7c8e] hover:bg-[#f6f7f9]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="search"
              placeholder="Search by ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 px-3 text-[13px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff]"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-[#dce0e5] rounded-[8px]">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#f6f7f9] border-b border-[#dce0e5]">
                <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Order ID</th>
                <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-[#6f7c8e]">Total sum</th>
                <th className="text-right px-4 py-3 font-semibold text-[#6f7c8e]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f6f7f9]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[#6f7c8e]">
                    No orders yet
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: Order) => (
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
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[11px] text-[#6f7c8e] mr-1">USD</span>
                      <span className="font-medium text-[#14181f]">{Number(order.totalAmount).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate({ to: '/seller/orders' })}
                        className="h-7 px-3 text-[12px] font-medium border border-[#dce0e5] rounded-[4px] bg-white hover:bg-[#f6f7f9] transition-colors text-[#14181f]"
                      >
                        View detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
