import { useNavigate } from '@tanstack/react-router'
import { Truck, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const MOCK_ORDERS = [
  { id: '#192001', date: 'Apr 15, 2025', buyer: 'Alex John', status: 'CONFIRMED', total: 312.23 },
  { id: '#234232', date: 'Apr 14, 2025', buyer: 'Sarah Mills', status: 'PENDING', total: 1912.9 },
  { id: '#092001', date: 'Apr 12, 2025', buyer: 'Michael George', status: 'PENDING', total: 124.5 },
  { id: '#183920', date: 'Apr 10, 2025', buyer: 'Laura Kim', status: 'DELIVERED', total: 67.0 },
  { id: '#009123', date: 'Apr 8, 2025', buyer: 'Tom Baker', status: 'CANCELLED', total: 450.0 },
  { id: '#183456', date: 'Apr 7, 2025', buyer: 'Emma Wilson', status: 'CONFIRMED', total: 230.5 },
  { id: '#009234', date: 'Apr 5, 2025', buyer: 'James Davis', status: 'PENDING', total: 88.0 },
  { id: '#183001', date: 'Apr 3, 2025', buyer: 'Olivia Brown', status: 'DELIVERED', total: 567.0 },
]

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    CONFIRMED: { label: 'Confirmed', className: 'bg-[#e6f7ee] text-[#00a81c]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    DELIVERED: { label: 'Delivered', className: 'bg-[#e6f7ee] text-[#00a81c]', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    PENDING: { label: 'Pending', className: 'bg-[#fff3e0] text-[#ff9017]', icon: <Clock className="h-3.5 w-3.5" /> },
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
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  if (!isAuthenticated || user?.accountType !== 'SELLER') {
    navigate({ to: '/' })
    return null
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="search"
          placeholder="Search by product"
          className="h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] min-w-[180px]"
        />
        <select className="h-9 px-3 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff]">
          <option>Status: any</option>
          <option>Pending</option>
          <option>Confirmed</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
        <div className="ml-auto">
          <button className="h-9 px-4 text-[14px] font-medium bg-[#3348ff] hover:bg-[#2236e0] text-white rounded-[6px] transition-colors">
            Create order
          </button>
        </div>
      </div>

      {/* Table */}
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
  )
}
