import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Plus,
  Trash2,
  Star,
} from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { productsApi } from '@/api/products'
import { profileApi } from '@/api/profile'
import type { SaveAddressRequest, SaveCardRequest } from '@/api/profile'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { authApi } from '@/api/auth'
import { formatPrice } from '@/lib/formatPrice'
import type { Order, OrderItem, SavedAddress, SavedCard } from '@/types'

// ── Order sub-components ──────────────────────────────────────────────────────

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

function OrderCard({ order }: { order: Order }) {
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
          <span className="text-[13px] font-bold text-[#14181f]">{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      <div className="border-t border-[#edf0f2] my-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {order.items.map((item, index) => {
          const product = productQueries[index]?.data
          const image = product?.images?.[0]
          const name = product?.name ?? `Ürün #${item.productId.slice(0, 6)}`
          return (
            <div key={item.id} className="flex gap-4">
              <div className="w-[80px] h-[80px] shrink-0 rounded-[8px] border border-[#dce0e5] bg-[#f7f8f9] overflow-hidden flex items-center justify-center">
                {image ? (
                  <img src={image} alt={name} className="w-full h-full object-contain mix-blend-multiply" />
                ) : (
                  <Package className="h-7 w-7 text-[#cbd3db]" />
                )}
              </div>
              <div className="py-1 min-w-0">
                <p className="text-[14px] font-medium text-[#14181f] mb-1 truncate">{name}</p>
                <p className="text-[13px] text-[#6f7c8e]">{item.quantity} adet × {formatPrice(item.unitPrice)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Address tab ───────────────────────────────────────────────────────────────

const EMPTY_ADDRESS: SaveAddressRequest = {
  title: '', fullName: '', city: '', postalCode: '', addressLine1: '', addressLine2: '',
}

function AddressesTab() {
  const qc = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SaveAddressRequest>(EMPTY_ADDRESS)

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['profile', 'addresses'],
    queryFn: profileApi.getAddresses,
  })

  const addMutation = useMutation({
    mutationFn: (data: SaveAddressRequest) => profileApi.addAddress(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'addresses'] })
      setForm(EMPTY_ADDRESS)
      setShowForm(false)
      showToast('Adres kaydedildi')
    },
    onError: () => showToast('Adres kaydedilemedi'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => profileApi.deleteAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'addresses'] })
      showToast('Adres silindi')
    },
  })

  const defaultMutation = useMutation({
    mutationFn: (id: string) => profileApi.setDefaultAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'addresses'] }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addMutation.mutate(form)
  }

  if (isLoading) return <div className="h-32 bg-white rounded-[12px] animate-pulse" />

  return (
    <div>
      {addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[12px] border border-[#dce0e5]">
          <MapPin className="h-10 w-10 text-[#cbd3db] mb-3" />
          <p className="text-[15px] font-medium text-[#14181f] mb-1">Kayıtlı adresiniz yok</p>
          <p className="text-[13px] text-[#6f7c8e] mb-5">Adres ekleyerek ödeme adımını hızlandırın</p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#3348ff] hover:bg-[#2236e0] text-white px-5 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors"
          >
            <Plus className="h-4 w-4" /> Adres ekle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr: SavedAddress) => (
            <div
              key={addr.id}
              className={`bg-white border rounded-[12px] p-5 flex items-start justify-between gap-4 ${addr.isDefault ? 'border-[#3348ff]' : 'border-[#dce0e5]'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-semibold text-[#14181f]">{addr.title}</span>
                  {addr.isDefault && (
                    <span className="text-[11px] font-medium text-[#3348ff] bg-[#f0f2ff] px-2 py-0.5 rounded-full">
                      Varsayılan
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[#3a4553]">{addr.fullName}</p>
                <p className="text-[13px] text-[#6f7c8e]">
                  {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                </p>
                <p className="text-[13px] text-[#6f7c8e]">{addr.city} {addr.postalCode}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={() => defaultMutation.mutate(addr.id)}
                    title="Varsayılan yap"
                    className="p-1.5 rounded-[6px] text-[#6f7c8e] hover:text-[#3348ff] hover:bg-[#f0f2ff] transition-colors"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(addr.id)}
                  title="Sil"
                  className="p-1.5 rounded-[6px] text-[#6f7c8e] hover:text-[#fa3434] hover:bg-[#fff0f0] transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#dce0e5] rounded-[12px] py-4 text-[14px] text-[#6f7c8e] hover:border-[#3348ff] hover:text-[#3348ff] transition-colors"
            >
              <Plus className="h-4 w-4" /> Yeni adres ekle
            </button>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 bg-white border border-[#dce0e5] rounded-[12px] p-6 space-y-4">
          <h5 className="text-[15px] font-semibold text-[#14181f]">Yeni adres</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#14181f] mb-1">Adres başlığı (Ev, İş…)</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ev" className="w-full h-10 border border-[#dce0e5] rounded-[6px] px-3 text-[14px] outline-none focus:border-[#3348ff]" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#14181f] mb-1">Ad Soyad</label>
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Ad Soyad" className="w-full h-10 border border-[#dce0e5] rounded-[6px] px-3 text-[14px] outline-none focus:border-[#3348ff]" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#14181f] mb-1">Şehir</label>
              <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="İstanbul" className="w-full h-10 border border-[#dce0e5] rounded-[6px] px-3 text-[14px] outline-none focus:border-[#3348ff]" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#14181f] mb-1">Posta kodu</label>
              <input required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                placeholder="34000" className="w-full h-10 border border-[#dce0e5] rounded-[6px] px-3 text-[14px] outline-none focus:border-[#3348ff]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[13px] font-medium text-[#14181f] mb-1">Adres satırı 1</label>
              <input required value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                placeholder="Sokak, bina no" className="w-full h-10 border border-[#dce0e5] rounded-[6px] px-3 text-[14px] outline-none focus:border-[#3348ff]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[13px] font-medium text-[#14181f] mb-1">Adres satırı 2 <span className="text-[#929eaa] font-normal">(isteğe bağlı)</span></label>
              <input value={form.addressLine2 ?? ''} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                placeholder="Daire, kat" className="w-full h-10 border border-[#dce0e5] rounded-[6px] px-3 text-[14px] outline-none focus:border-[#3348ff]" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={addMutation.isPending}
              className="bg-[#3348ff] hover:bg-[#2236e0] text-white px-5 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors disabled:opacity-60">
              {addMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_ADDRESS) }}
              className="bg-[#edf0f2] hover:bg-[#dce0e5] text-[#14181f] px-5 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors">
              İptal
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Cards tab ─────────────────────────────────────────────────────────────────

const EMPTY_CARD: SaveCardRequest = {
  alias: '', cardHolder: '', last4: '', expireMonth: '', expireYear: '',
}

function CardsTab() {
  const qc = useQueryClient()
  const showToast = useToastStore((s) => s.show)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SaveCardRequest>(EMPTY_CARD)

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['profile', 'cards'],
    queryFn: profileApi.getCards,
  })

  const addMutation = useMutation({
    mutationFn: (data: SaveCardRequest) => profileApi.addCard(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'cards'] })
      setForm(EMPTY_CARD)
      setShowForm(false)
      showToast('Kart kaydedildi')
    },
    onError: () => showToast('Kart kaydedilemedi'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => profileApi.deleteCard(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'cards'] })
      showToast('Kart silindi')
    },
  })

  const defaultMutation = useMutation({
    mutationFn: (id: string) => profileApi.setDefaultCard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'cards'] }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addMutation.mutate(form)
  }

  if (isLoading) return <div className="h-32 bg-white rounded-[12px] animate-pulse" />

  return (
    <div>
      {cards.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[12px] border border-[#dce0e5]">
          <CreditCard className="h-10 w-10 text-[#cbd3db] mb-3" />
          <p className="text-[15px] font-medium text-[#14181f] mb-1">Kayıtlı kartınız yok</p>
          <p className="text-[13px] text-[#6f7c8e] mb-5">Kart ekleyerek ödeme adımını hızlandırın</p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#3348ff] hover:bg-[#2236e0] text-white px-5 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors"
          >
            <Plus className="h-4 w-4" /> Kart ekle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card: SavedCard) => (
            <div
              key={card.id}
              className={`bg-white border rounded-[12px] p-5 flex items-center justify-between gap-4 ${card.isDefault ? 'border-[#3348ff]' : 'border-[#dce0e5]'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-semibold text-[#14181f]">{card.alias}</span>
                  {card.isDefault && (
                    <span className="text-[11px] font-medium text-[#3348ff] bg-[#f0f2ff] px-2 py-0.5 rounded-full">
                      Varsayılan
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[#3a4553]">{card.cardHolder}</p>
                <p className="text-[13px] text-[#6f7c8e] font-mono">•••• •••• •••• {card.last4} &nbsp; {card.expireMonth}/{card.expireYear}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!card.isDefault && (
                  <button
                    onClick={() => defaultMutation.mutate(card.id)}
                    title="Varsayılan yap"
                    className="p-1.5 rounded-[6px] text-[#6f7c8e] hover:text-[#3348ff] hover:bg-[#f0f2ff] transition-colors"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(card.id)}
                  title="Sil"
                  className="p-1.5 rounded-[6px] text-[#6f7c8e] hover:text-[#fa3434] hover:bg-[#fff0f0] transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#dce0e5] rounded-[12px] py-4 text-[14px] text-[#6f7c8e] hover:border-[#3348ff] hover:text-[#3348ff] transition-colors"
            >
              <Plus className="h-4 w-4" /> Yeni kart ekle
            </button>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 bg-white border border-[#dce0e5] rounded-[12px] p-6 space-y-4">
          <h5 className="text-[15px] font-semibold text-[#14181f]">Yeni kart</h5>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">Test kartı</p>
            <p className="font-mono">5528790000000008 &nbsp; 12 / 2030 &nbsp; CVC: 123</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[13px] font-medium text-[#14181f] mb-1">Kart takma adı</label>
              <input required value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })}
                placeholder="Ana kartım, İş kartım…" className="w-full h-10 border border-[#dce0e5] rounded-[6px] px-3 text-[14px] outline-none focus:border-[#3348ff]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[13px] font-medium text-[#14181f] mb-1">Kart sahibinin adı</label>
              <input required value={form.cardHolder} onChange={(e) => setForm({ ...form, cardHolder: e.target.value })}
                placeholder="Ad Soyad" className="w-full h-10 border border-[#dce0e5] rounded-[6px] px-3 text-[14px] outline-none focus:border-[#3348ff]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[13px] font-medium text-[#14181f] mb-1">Son 4 hane</label>
              <input required maxLength={4} value={form.last4} onChange={(e) => setForm({ ...form, last4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="0008" className="w-full h-10 border border-[#dce0e5] rounded-[6px] px-3 text-[14px] font-mono outline-none focus:border-[#3348ff]" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#14181f] mb-1">Son kullanma ayı</label>
              <input required maxLength={2} value={form.expireMonth} onChange={(e) => setForm({ ...form, expireMonth: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                placeholder="12" className="w-full h-10 border border-[#dce0e5] rounded-[6px] px-3 text-[14px] outline-none focus:border-[#3348ff]" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#14181f] mb-1">Son kullanma yılı</label>
              <input required maxLength={4} value={form.expireYear} onChange={(e) => setForm({ ...form, expireYear: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="2030" className="w-full h-10 border border-[#dce0e5] rounded-[6px] px-3 text-[14px] outline-none focus:border-[#3348ff]" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={addMutation.isPending}
              className="bg-[#3348ff] hover:bg-[#2236e0] text-white px-5 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors disabled:opacity-60">
              {addMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_CARD) }}
              className="bg-[#edf0f2] hover:bg-[#dce0e5] text-[#14181f] px-5 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors">
              İptal
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

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
      <div className="bg-white border-b border-[#dce0e5] py-8">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          <h2 className="text-[26px] font-bold text-[#14181f] mb-1">Hesabım</h2>
          {(user?.firstName || user?.lastName) && (
            <p className="text-[15px] font-medium text-[#14181f] mb-0.5">
              {[user.firstName, user.lastName].filter(Boolean).join(' ')}
            </p>
          )}
          <p className="text-[14px] text-[#6f7c8e]">{user?.email}</p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6">

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
                      isActive ? 'text-[#3348ff] bg-[#f0f2ff] font-medium' : 'text-[#3a4553] hover:bg-[#f7f8f9]'
                    }`}
                  >
                    <span className={`w-8 h-8 flex items-center justify-center rounded-[6px] border shrink-0 shadow-sm bg-white ${
                      isActive ? 'border-[#c7cdff] text-[#3348ff]' : 'border-[#dce0e5] text-[#6f7c8e]'
                    }`}>
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
                  activeNav === 'support' ? 'text-[#3348ff] bg-[#f0f2ff] font-medium' : 'text-[#3a4553] hover:bg-[#f7f8f9]'
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-[6px] border shrink-0 shadow-sm bg-white ${
                  activeNav === 'support' ? 'border-[#c7cdff] text-[#3348ff]' : 'border-[#dce0e5] text-[#6f7c8e]'
                }`}>
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

          <main className="flex-1 min-w-0">
            {activeNav === 'orders' && (
              <>
                <div className="flex gap-1 bg-white border border-[#dce0e5] rounded-[10px] p-1 mb-5 w-fit">
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 rounded-[7px] text-[14px] font-medium transition-colors ${
                        activeTab === tab.key ? 'bg-[#3348ff] text-white' : 'text-[#6f7c8e] hover:text-[#14181f]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-48 bg-white rounded-[12px] animate-pulse" />
                    ))}
                  </div>
                ) : displayedOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[12px] border border-[#dce0e5]">
                    <ShoppingBag className="h-12 w-12 text-[#cbd3db] mb-4" />
                    <p className="text-[16px] font-medium text-[#14181f] mb-1">Bu kategoride sipariş yok</p>
                    <p className="text-[14px] text-[#6f7c8e] mb-6">Alışverişe başlamak için ürünlere göz atın</p>
                    <button
                      onClick={() => navigate({ to: '/' })}
                      className="bg-[#3348ff] hover:bg-[#2236e0] text-white px-6 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors"
                    >
                      Ürünlere göz at
                    </button>
                  </div>
                ) : (
                  displayedOrders.map((order) => <OrderCard key={order.id} order={order} />)
                )}
              </>
            )}

            {activeNav === 'addresses' && <AddressesTab />}

            {activeNav === 'payments' && <CardsTab />}

            {activeNav !== 'orders' && activeNav !== 'addresses' && activeNav !== 'payments' && (
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
