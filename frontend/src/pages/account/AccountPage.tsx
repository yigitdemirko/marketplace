import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  ShoppingBag,
  MapPin,
  Lock,
  CreditCard,
  Heart,
  MessageCircle,
  LogOut,
  Package,
} from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { productsApi } from '@/api/products'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { authApi } from '@/api/auth'
import { formatPrice } from '@/lib/formatPrice'
import type { Order, OrderItem } from '@/types'

type Tab = 'current' | 'completed' | 'all'

const STATUS_LABELS: Record<Order['status'], string> = {
  PENDING: 'Beklemede',
  STOCK_RESERVING: 'Stok ayrılıyor',
  PAYMENT_PENDING: 'Ödeme bekleniyor',
  CONFIRMED: 'Onaylandı',
  SHIPPED: 'Kargoda',
  DELIVERED: 'Teslim edildi',
  CANCELLED: 'İptal edildi',
}

const STATUS_COLORS: Record<Order['status'], string> = {
  PENDING: 'text-yellow-600',
  STOCK_RESERVING: 'text-yellow-600',
  PAYMENT_PENDING: 'text-yellow-600',
  CONFIRMED: 'text-blue-600',
  SHIPPED: 'text-orange-500',
  DELIVERED: 'text-green-600',
  CANCELLED: 'text-red-500',
}

const CURRENT_STATUSES: Order['status'][] = [
  'PENDING',
  'STOCK_RESERVING',
  'PAYMENT_PENDING',
  'CONFIRMED',
  'SHIPPED',
]

function filterOrders(orders: Order[], tab: Tab): Order[] {
  if (tab === 'current') return orders.filter((o) => CURRENT_STATUSES.includes(o.status))
  if (tab === 'completed') return orders.filter((o) => o.status === 'DELIVERED')
  return orders
}

function formatOrderDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface OrderCardProps {
  order: Order
}

function OrderCard({ order }: OrderCardProps) {
  const navigate = useNavigate()

  const productQueries = useQueries({
    queries: order.items.map((item: OrderItem) => ({
      queryKey: ['product', item.productId],
      queryFn: () => productsApi.getById(item.productId),
      staleTime: 5 * 60 * 1000,
    })),
  })

  return (
    <div
      className="border border-[#dce0e5] rounded-[12px] p-6 mb-5 bg-white hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: order.id } })}
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h6 className="text-[16px] font-semibold text-[#14181f] mb-1">
            Sipariş #{order.id.slice(0, 8).toUpperCase()}
          </h6>
          <p className="text-[13px] text-[#6f7c8e]">
            {order.items.length} ürün &bull; {formatOrderDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="border-t border-[#edf0f2] my-4" />

      {/* Order details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 max-w-[80%]">
        <div className="flex gap-3">
          <span className="text-[13px] text-[#6f7c8e] w-[120px] shrink-0">Durum:</span>
          <span className={`text-[13px] font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <div className="flex gap-3">
          <span className="text-[13px] text-[#6f7c8e] w-[120px] shrink-0">Teslimat adresi:</span>
          <span className="text-[13px] text-[#14181f]">{order.shippingAddress}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-[13px] text-[#6f7c8e] w-[120px] shrink-0">Toplam:</span>
          <span className="text-[13px] font-bold text-[#14181f]">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      <div className="border-t border-[#edf0f2] my-4" />

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {order.items.map((item, index) => {
          const product = productQueries[index]?.data
          const image = product?.images?.[0]
          const name = product?.name ?? `Ürün #${item.productId.slice(0, 6)}`

          return (
            <div key={item.id} className="flex gap-4">
              <div className="w-[80px] h-[80px] shrink-0 rounded-[8px] border border-[#dce0e5] bg-[#f7f8f9] overflow-hidden flex items-center justify-center">
                {image ? (
                  <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <Package className="h-7 w-7 text-[#cbd3db]" />
                )}
              </div>
              <div className="py-1 min-w-0">
                <p className="text-[14px] font-medium text-[#14181f] mb-1 truncate">{name}</p>
                <p className="text-[13px] text-[#6f7c8e]">
                  {item.quantity} adet × {formatPrice(item.unitPrice)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'orders', label: 'Siparişlerim', icon: ShoppingBag },
  { id: 'addresses', label: 'Adreslerim', icon: MapPin },
  { id: 'security', label: 'Güvenlik', icon: Lock },
  { id: 'payments', label: 'Ödeme yöntemleri', icon: CreditCard },
  { id: 'saved', label: 'Kaydedilenler', icon: Heart },
] as const

export function AccountPage() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const [activeNav, setActiveNav] = useState<string>('orders')
  const [activeTab, setActiveTab] = useState<Tab>('current')
  const isLoggingOut = useRef(false)

  useEffect(() => {
    if (isLoggingOut.current) return
    if (!isAuthenticated || user?.accountType !== 'BUYER') {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, user?.accountType])

  const handleLogout = () => {
    isLoggingOut.current = true
    authApi.logout().finally(() => {
      logout()
      showToast('Çıkış yapıldı')
      navigate({ to: '/' })
    })
  }

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.userId],
    queryFn: () => ordersApi.getAll(user!.userId),
    enabled: !!user,
  })

  const displayedOrders = filterOrders(orders ?? [], activeTab)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'current', label: 'Devam edenler' },
    { key: 'completed', label: 'Tamamlananlar' },
    { key: 'all', label: 'Tüm siparişler' },
  ]

  return (
    <div className="min-h-screen bg-[#f7f8f9]">
      {/* Page top */}
      <div className="bg-white border-b border-[#dce0e5] py-8">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          <h2 className="text-[26px] font-bold text-[#14181f] mb-1">Hesabım</h2>
          {(user?.firstName || user?.lastName) && (
            <p className="text-[15px] font-medium text-[#14181f] mb-0.5">
              {[user.firstName, user.lastName].filter(Boolean).join(' ')}
            </p>
          )}
          <p className="text-[14px] text-[#6f7c8e]">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">

          {/* Sidebar */}
          <aside className="w-full md:w-[240px] shrink-0">
            <nav className="bg-white border border-[#dce0e5] rounded-[12px] overflow-hidden">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = activeNav === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-[14px] transition-colors border-b border-[#edf0f2] last:border-b-0 ${
                      isActive
                        ? 'text-[#3348ff] bg-[#f0f2ff] font-medium'
                        : 'text-[#3a4553] hover:bg-[#f7f8f9]'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-[6px] border shrink-0 shadow-sm bg-white ${
                        isActive ? 'border-[#c7cdff] text-[#3348ff]' : 'border-[#dce0e5] text-[#6f7c8e]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    {item.label}
                  </button>
                )
              })}

              <div className="border-t border-[#dce0e5]" />

              <button
                onClick={() => setActiveNav('support')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-[14px] transition-colors border-b border-[#edf0f2] ${
                  activeNav === 'support'
                    ? 'text-[#3348ff] bg-[#f0f2ff] font-medium'
                    : 'text-[#3a4553] hover:bg-[#f7f8f9]'
                }`}
              >
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-[6px] border shrink-0 shadow-sm bg-white ${
                    activeNav === 'support' ? 'border-[#c7cdff] text-[#3348ff]' : 'border-[#dce0e5] text-[#6f7c8e]'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                </span>
                Müşteri desteği
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-[#3a4553] hover:bg-[#f7f8f9] transition-colors"
              >
                <span className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#dce0e5] shrink-0 shadow-sm bg-white text-[#6f7c8e]">
                  <LogOut className="w-4 h-4" />
                </span>
                Çıkış yap
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {activeNav === 'orders' && (
              <>
                {/* Tabs */}
                <div className="flex gap-1 bg-white border border-[#dce0e5] rounded-[10px] p-1 mb-5 w-fit">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 rounded-[7px] text-[14px] font-medium transition-colors ${
                        activeTab === tab.key
                          ? 'bg-[#3348ff] text-white'
                          : 'text-[#6f7c8e] hover:text-[#14181f]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Orders */}
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-48 bg-white rounded-[12px] animate-pulse" />
                    ))}
                  </div>
                ) : displayedOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[12px] border border-[#dce0e5]">
                    <ShoppingBag className="h-12 w-12 text-[#cbd3db] mb-4" />
                    <p className="text-[16px] font-medium text-[#14181f] mb-1">
                      Bu kategoride sipariş yok
                    </p>
                    <p className="text-[14px] text-[#6f7c8e] mb-6">
                      Alışverişe başlamak için ürünlere göz atın
                    </p>
                    <button
                      onClick={() => navigate({ to: '/' })}
                      className="bg-[#3348ff] hover:bg-[#2236e0] text-white px-6 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors"
                    >
                      Ürünlere göz at
                    </button>
                  </div>
                ) : (
                  displayedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))
                )}
              </>
            )}

            {activeNav !== 'orders' && (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[12px] border border-[#dce0e5]">
                <p className="text-[16px] font-medium text-[#14181f] mb-1">Yakında</p>
                <p className="text-[14px] text-[#6f7c8e]">Bu özellik çok yakında kullanıma açılacak</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
