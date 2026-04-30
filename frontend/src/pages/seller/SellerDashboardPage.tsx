import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  Truck,
  Banknote,
  MousePointerClick,
  User,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import { productsApi } from '@/api/products'
import { useAuthStore } from '@/store/authStore'

const MOCK_ORDERS = [
  { id: '#192001', date: 'Apr 15, 2025', buyer: 'Alex John', status: 'CONFIRMED', total: 312.23 },
  { id: '#234232', date: 'Apr 14, 2025', buyer: 'Sarah Mills', status: 'PENDING', total: 1912.9 },
  { id: '#092001', date: 'Apr 12, 2025', buyer: 'Michael George', status: 'PENDING', total: 124.5 },
  { id: '#183920', date: 'Apr 10, 2025', buyer: 'Laura Kim', status: 'DELIVERED', total: 67.0 },
  { id: '#009123', date: 'Apr 8, 2025', buyer: 'Tom Baker', status: 'CANCELLED', total: 450.0 },
]

const CHART_DATA = [42, 68, 55, 90, 72, 110, 95, 130, 88, 115, 145, 160]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    CONFIRMED: { label: 'Confirmed', className: 'bg-[#e6f7ee] text-[#00a81c]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
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
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  if (!isAuthenticated || user?.accountType !== 'SELLER') {
    navigate({ to: '/' })
    return null
  }

  const { data: productsData } = useQuery({
    queryKey: ['seller-products', user?.userId],
    queryFn: () => productsApi.getBySeller(user!.userId, 0, 5),
    enabled: !!user,
  })

  const stats = [
    { label: 'Total orders', value: '45', trend: '+9% from last period', up: true, icon: <Truck className="h-5 w-5 text-[#3348ff]" /> },
    { label: 'Gross Sale', value: '$31,700', trend: '+3% from last period', up: true, icon: <Banknote className="h-5 w-5 text-[#3348ff]" /> },
    { label: 'Leads & visits', value: '45,901', trend: '-3% from last period', up: false, icon: <MousePointerClick className="h-5 w-5 text-[#3348ff]" /> },
    { label: 'Returning customers', value: '45', trend: '+9% from last period', up: true, icon: <User className="h-5 w-5 text-[#3348ff]" /> },
  ]

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <select className="h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff]">
          <option>This month</option>
          <option>Last month</option>
          <option>This week</option>
          <option>Last 30 days</option>
        </select>
        <button className="h-9 px-4 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white hover:bg-[#f6f7f9] transition-colors font-medium text-[#14181f]">
          Export data
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#f6f7f9] rounded-[8px] p-4">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[14px] text-[#6f7c8e]">{s.label}</p>
              <div className="bg-white border border-[#dce0e5] rounded-[6px] p-2 shrink-0">
                {s.icon}
              </div>
            </div>
            <p className="text-[22px] font-bold text-[#14181f] mb-1">{s.value}</p>
            <p className={`text-[12px] font-medium ${s.up ? 'text-[#00a81c]' : 'text-[#fa3434]'}`}>
              {s.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Sales chart */}
        <div className="bg-white border border-[#dce0e5] rounded-[8px] p-5">
          <div className="mb-4">
            <h3 className="text-[16px] font-semibold text-[#14181f] mb-0.5">Sales growth chart</h3>
            <p className="text-[13px] text-[#6f7c8e]">Last 12 months</p>
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
            <p className="text-[13px] text-[#6f7c8e]">From 2025 Jan — 2025 Dec</p>
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
                : [
                    ['Bonaqua water 2 litres', '794 pcs', '$28,967'],
                    ['Coca cola classic 0.5 litr', '138 pcs', '$8,710'],
                    ['Samsung Galaxy S27 Black', '124 pcs', '$710'],
                    ['Milter yogi semechka 2 litrs', '113 pcs', '$3,811'],
                    ['Bounty trio large', '98 pcs', '$1,891'],
                  ].map(([name, qty, price], i) => (
                    <tr key={i} className="hover:bg-[#f6f7f9]">
                      <td className="py-2 text-[#6f7c8e] w-6">{i + 1}.</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-[#6f7c8e] shrink-0" />
                          <span className="text-[#14181f]">{name}</span>
                        </div>
                      </td>
                      <td className="py-2 text-[#6f7c8e] text-right">{qty}</td>
                      <td className="py-2 text-[#14181f] font-medium text-right">{price}</td>
                    </tr>
                  ))}
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
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    t === 'All orders'
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
              placeholder="Search item"
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
                <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Order by</th>
                <th className="text-left px-4 py-3 font-semibold text-[#6f7c8e]">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-[#6f7c8e]">Total sum</th>
                <th className="text-right px-4 py-3 font-semibold text-[#6f7c8e]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f6f7f9]">
              {MOCK_ORDERS.map((order) => (
                <tr key={order.id} className="hover:bg-[#f6f7f9] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[#3348ff]">
                      <Truck className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{order.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6f7c8e]">{order.date}</td>
                  <td className="px-4 py-3 text-[#14181f]">{order.buyer}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[11px] text-[#6f7c8e] mr-1">USD</span>
                    <span className="font-medium text-[#14181f]">{order.total.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="h-7 px-3 text-[12px] font-medium border border-[#dce0e5] rounded-[4px] bg-white hover:bg-[#f6f7f9] transition-colors text-[#14181f]">
                      View detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
