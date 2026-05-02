import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Package, MapPin, CreditCard, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/api/orders'
import { paymentsApi } from '@/api/payments'
import { profileApi } from '@/api/profile'
import type { SaveAddressRequest, SaveCardRequest } from '@/api/profile'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatPrice'
import type { SavedAddress, SavedCard } from '@/types'

type CheckoutStep = 'shipping' | 'payment'
type DeliveryMethod = 'pickup' | 'standard' | 'express'

const DELIVERY_OPTIONS: { id: DeliveryMethod; label: string; description: string; cost: number }[] = [
  { id: 'pickup', label: 'Mağazadan teslim', description: 'En yakın şubeden', cost: 0 },
  { id: 'standard', label: 'Standart kargo', description: 'Sipariş sonrası 7-10 gün', cost: 9 },
  { id: 'express', label: 'Hızlı kargo', description: 'Sipariş sonrası 1-2 gün', cost: 25 },
]

const TAX_RATE = 0.038

function FormField({ label, optional, children, className }: {
  label: string; optional?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <Label className="mb-1.5 text-sm font-medium text-[#14181f]">
        {label}
        {optional && <span className="ml-1 text-[#929eaa] font-normal">(isteğe bağlı)</span>}
      </Label>
      {children}
    </div>
  )
}

function OrderSummary({ coupon, onCouponChange, subtotal, deliveryCost }: {
  coupon: string; onCouponChange: (v: string) => void; subtotal: number; deliveryCost: number
}) {
  const { items } = useCartStore()
  const tax = subtotal * TAX_RATE

  return (
    <div className="p-5 md:p-10 bg-[#f6f7f9] h-full">
      <p className="font-medium mb-6 text-[#14181f]">Sipariş özeti</p>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <figure key={item.productId} className="flex gap-3">
            <div className="size-[72px] shrink-0 overflow-hidden rounded-lg bg-white border border-[#dce0e5] flex items-center justify-center">
              {item.image ? (
                <img src={item.image} alt={item.name} className="size-full object-contain mix-blend-multiply" />
              ) : (
                <Package className="size-6 text-[#cbd3db]" />
              )}
            </div>
            <figcaption className="flex flex-1 flex-col gap-0.5 min-w-0">
              <p className="font-medium text-[#14181f] text-sm leading-tight line-clamp-2">{item.name}</p>
              <p className="text-sm text-[#6f7c8e]">Adet: {item.quantity}</p>
            </figcaption>
            <div className="text-right">
              <span className="text-sm text-[#6f7c8e] whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
            </div>
          </figure>
        ))}
      </div>

      <hr className="my-6 border-[#dce0e5]" />

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={coupon}
          onChange={(e) => onCouponChange(e.target.value)}
          placeholder="Kupon kodu"
          className="flex-1 rounded-lg border border-[#dce0e5] bg-white px-3 text-sm text-[#14181f] placeholder:text-[#929eaa] outline-none h-10"
        />
        <button type="button" className="h-10 rounded-lg border border-[#dce0e5] bg-white px-4 text-sm font-medium text-[#14181f] hover:bg-white/80 transition-colors">
          Uygula
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        <li className="flex items-center justify-between text-sm text-[#14181f]">
          <span>Ara toplam:</span><span>{formatPrice(subtotal)}</span>
        </li>
        <li className="flex items-center justify-between text-sm text-[#14181f]">
          <span>Kargo:</span><span>{formatPrice(deliveryCost)}</span>
        </li>
        <li className="flex items-center justify-between text-sm text-[#14181f]">
          <span>KDV:</span><span>{formatPrice(tax)}</span>
        </li>
      </ul>

      <hr className="my-4 border-[#dce0e5]" />

      <dl className="flex items-center justify-between">
        <dt className="text-[#14181f]">Toplam:</dt>
        <dd className="font-semibold text-xl text-[#14181f]">{formatPrice(subtotal + deliveryCost + tax)}</dd>
      </dl>
    </div>
  )
}

// ── Saved address selector ─────────────────────────────────────────────────────

function SavedAddressSelector({ onSelect }: { onSelect: (addr: SavedAddress) => void }) {
  const { data: addresses = [] } = useQuery({
    queryKey: ['profile', 'addresses'],
    queryFn: profileApi.getAddresses,
  })
  const [selected, setSelected] = useState<string>(() => {
    const def = addresses.find((a: SavedAddress) => a.isDefault)
    return def?.id ?? addresses[0]?.id ?? ''
  })

  if (addresses.length === 0) return null

  return (
    <div className="mb-5">
      <p className="text-[13px] font-medium text-[#6f7c8e] mb-3 flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5" /> Kayıtlı adreslerim
      </p>
      <div className="space-y-2">
        {addresses.map((addr: SavedAddress) => (
          <label
            key={addr.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors',
              selected === addr.id ? 'border-[#3348ff] bg-[#f0f2ff]' : 'border-[#dce0e5] bg-white hover:bg-[#f7f8f9]',
            )}
          >
            <input
              type="radio"
              name="saved-address"
              checked={selected === addr.id}
              onChange={() => { setSelected(addr.id); onSelect(addr) }}
              className="mt-0.5 accent-[#3348ff]"
            />
            <div>
              <p className="text-[13px] font-medium text-[#14181f]">{addr.title} — {addr.fullName}</p>
              <p className="text-[12px] text-[#6f7c8e]">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city} {addr.postalCode}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Saved card selector ────────────────────────────────────────────────────────

function SavedCardSelector({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const { data: cards = [] } = useQuery({
    queryKey: ['profile', 'cards'],
    queryFn: profileApi.getCards,
  })

  if (cards.length === 0) return null

  return (
    <div className="mb-5">
      <p className="text-[13px] font-medium text-[#6f7c8e] mb-3 flex items-center gap-1.5">
        <CreditCard className="h-3.5 w-3.5" /> Kayıtlı kartlarım
      </p>
      <div className="space-y-2">
        {cards.map((card: SavedCard) => (
          <label
            key={card.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors',
              selected === card.id ? 'border-[#3348ff] bg-[#f0f2ff]' : 'border-[#dce0e5] bg-white hover:bg-[#f7f8f9]',
            )}
          >
            <input
              type="radio"
              name="saved-card"
              checked={selected === card.id}
              onChange={() => onSelect(card.id)}
              className="accent-[#3348ff]"
            />
            <div>
              <p className="text-[13px] font-medium text-[#14181f]">{card.alias} — {card.cardHolder}</p>
              <p className="text-[12px] text-[#6f7c8e] font-mono">•••• •••• •••• {card.last4} &nbsp; {card.expireMonth}/{card.expireYear}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Main checkout ──────────────────────────────────────────────────────────────

export function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [step, setStep] = useState<CheckoutStep>('shipping')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup')
  const [coupon, setCoupon] = useState('')

  const [contact, setContact] = useState({ name: '', surname: '', email: user?.email ?? '' })
  const [shippingForm, setShippingForm] = useState({ city: '', postalCode: '', addressLine1: '', addressLine2: '' })
  const [cardForm, setCardForm] = useState({ cardHolderName: '', cardNumber: '', expireMonth: '', expireYear: '', cvc: '' })

  const [saveAddress, setSaveAddress] = useState(false)
  const [addressTitle, setAddressTitle] = useState('')
  const [showNewAddress, setShowNewAddress] = useState(false)

  const [saveCard, setSaveCard] = useState(false)
  const [cardAlias, setCardAlias] = useState('')
  const [selectedSavedCardId, setSelectedSavedCardId] = useState('')
  const [showNewCard, setShowNewCard] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['profile', 'addresses'],
    queryFn: profileApi.getAddresses,
    enabled: isAuthenticated,
  })

  const { data: savedCards = [] } = useQuery({
    queryKey: ['profile', 'cards'],
    queryFn: profileApi.getCards,
    enabled: isAuthenticated,
  })

  const hasAddresses = savedAddresses.length > 0
  const hasCards = savedCards.length > 0

  if (!isAuthenticated) {
    navigate({ to: '/login' })
    return null
  }

  const deliveryCost = DELIVERY_OPTIONS.find((o) => o.id === deliveryMethod)!.cost
  const subtotal = totalAmount()
  const tax = subtotal * TAX_RATE
  const total = subtotal + deliveryCost + tax

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setShippingForm({
      city: addr.city,
      postalCode: addr.postalCode,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? '',
    })
    const [firstName, ...rest] = addr.fullName.split(' ')
    setContact((c) => ({ ...c, name: firstName, surname: rest.join(' ') }))
    setShowNewAddress(false)
  }

  const handlePlaceOrder = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    if (!user || items.length === 0) return

    setLoading(true)
    try {
      const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const shippingAddress = [shippingForm.addressLine1, shippingForm.addressLine2, shippingForm.city, shippingForm.postalCode]
        .filter(Boolean).join(', ')

      const order = await ordersApi.create(
        { items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })), shippingAddress, idempotencyKey },
        user.userId,
      )

      await paymentsApi.process(
        { orderId: order.id, idempotencyKey: `pay-${idempotencyKey}`, ...cardForm },
        user.userId,
      )

      if (saveAddress && addressTitle.trim() && shippingForm.addressLine1) {
        const req: SaveAddressRequest = {
          title: addressTitle,
          fullName: `${contact.name} ${contact.surname}`.trim(),
          city: shippingForm.city,
          postalCode: shippingForm.postalCode,
          addressLine1: shippingForm.addressLine1,
          addressLine2: shippingForm.addressLine2 || undefined,
        }
        await profileApi.addAddress(req).catch(() => {})
        qc.invalidateQueries({ queryKey: ['profile', 'addresses'] })
      }

      if (saveCard && cardAlias.trim() && cardForm.cardNumber.length >= 4) {
        const req: SaveCardRequest = {
          alias: cardAlias,
          cardHolder: cardForm.cardHolderName,
          last4: cardForm.cardNumber.replace(/\s/g, '').slice(-4),
          expireMonth: cardForm.expireMonth,
          expireYear: cardForm.expireYear,
        }
        await profileApi.addCard(req).catch(() => {})
        qc.invalidateQueries({ queryKey: ['profile', 'cards'] })
      }

      clearCart()
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme başarısız')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold">Siparişiniz alındı!</h2>
        <p className="text-muted-foreground">Siparişiniz başarıyla oluşturuldu.</p>
        <Button onClick={() => navigate({ to: '/orders' })}>Siparişlerimi gör</Button>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-[calc(100vh-64px)]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row">
          <main className="md:basis-7/12 md:shrink-0">
            <div className="py-10 md:mr-10">
              {step === 'shipping' ? (
                <form id="shipping-form" onSubmit={(e) => { e.preventDefault(); setStep('payment') }}>
                  {/* Contact */}
                  <article className="mb-5">
                    <h4 className="mb-5 text-xl font-semibold text-[#14181f]">İletişim bilgileri</h4>
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4 mb-6">
                      <FormField label="Ad">
                        <Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })}
                          placeholder="Buraya yazın" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
                      </FormField>
                      <FormField label="Soyad">
                        <Input value={contact.surname} onChange={(e) => setContact({ ...contact, surname: e.target.value })}
                          placeholder="Buraya yazın" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
                      </FormField>
                      <FormField label="E-posta" className="md:col-span-2">
                        <Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })}
                          placeholder="Buraya yazın" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
                      </FormField>
                    </fieldset>
                    <hr className="border-[#dce0e5]" />
                  </article>

                  {/* Shipping address */}
                  <article className="mb-5">
                    <h4 className="mb-5 text-xl font-semibold text-[#14181f]">Teslimat adresi</h4>

                    {hasAddresses && !showNewAddress && (
                      <>
                        <SavedAddressSelector onSelect={handleSelectSavedAddress} />
                        <button
                          type="button"
                          onClick={() => setShowNewAddress(true)}
                          className="flex items-center gap-1.5 text-[13px] text-[#3348ff] hover:underline mb-4"
                        >
                          <Plus className="h-3.5 w-3.5" /> Farklı adres gir
                        </button>
                      </>
                    )}

                    {(!hasAddresses || showNewAddress) && (
                      <>
                        {showNewAddress && (
                          <button type="button" onClick={() => setShowNewAddress(false)}
                            className="text-[13px] text-[#6f7c8e] hover:text-[#3348ff] mb-4 flex items-center gap-1">
                            ← Kayıtlı adreslerime dön
                          </button>
                        )}
                        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4 mb-4">
                          <FormField label="Şehir">
                            <Input value={shippingForm.city} onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                              placeholder="Şehir adı girin" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
                          </FormField>
                          <FormField label="Posta kodu">
                            <Input value={shippingForm.postalCode} onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                              className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
                          </FormField>
                          <FormField label="Adres satırı 1" className="md:col-span-2">
                            <Input value={shippingForm.addressLine1} onChange={(e) => setShippingForm({ ...shippingForm, addressLine1: e.target.value })}
                              placeholder="Sokak adı, bina" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
                          </FormField>
                          <FormField label="Adres satırı 2" optional className="md:col-span-2">
                            <Input value={shippingForm.addressLine2} onChange={(e) => setShippingForm({ ...shippingForm, addressLine2: e.target.value })}
                              placeholder="Daire, kat" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" />
                          </FormField>
                        </fieldset>

                        <label className="flex items-center gap-2.5 mb-4 cursor-pointer">
                          <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)}
                            className="h-4 w-4 accent-[#3348ff] rounded" />
                          <span className="text-[13px] text-[#3a4553]">Bu adresi kaydet</span>
                        </label>
                        {saveAddress && (
                          <Input value={addressTitle} onChange={(e) => setAddressTitle(e.target.value)}
                            placeholder="Adres başlığı (Ev, İş…)" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10 mb-4" />
                        )}
                      </>
                    )}

                    <p className="mb-3 text-sm text-[#14181f]">Teslimat seçeneği</p>
                    <fieldset className="flex flex-col sm:flex-row gap-2">
                      {DELIVERY_OPTIONS.map((option) => {
                        const selected = deliveryMethod === option.id
                        return (
                          <label key={option.id} className={cn(
                            'flex flex-1 items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                            selected ? 'border-primary bg-blue-50' : 'border-[#dce0e5] bg-white',
                          )}>
                            <input type="radio" name="delivery-type" checked={selected}
                              onChange={() => setDeliveryMethod(option.id)} className="mt-1 accent-primary" />
                            <div>
                              <span className="text-sm text-[#14181f] font-medium">{option.label}</span>
                              <p className="text-xs text-[#6f7c8e] mt-0.5">{option.description}</p>
                            </div>
                          </label>
                        )
                      })}
                    </fieldset>
                  </article>

                  <hr className="my-6 border-[#dce0e5]" />

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="secondary" onClick={() => navigate({ to: '/cart' })}
                      className="gap-2 bg-[#edf0f2] text-[#14181f] hover:bg-[#dce0e5]">
                      <ChevronLeft className="size-4" /> Sepete dön
                    </Button>
                    <Button type="submit" className="gap-2 bg-primary text-white hover:bg-primary/90">
                      Ödemeye geç <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePlaceOrder} className="flex flex-col gap-6">
                  <h4 className="text-xl font-semibold text-[#14181f]">Ödeme bilgileri</h4>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    <p className="font-semibold mb-1">Test kartı</p>
                    <p className="font-mono">5528790000000008 &nbsp; 12 / 2030 &nbsp; CVC: 123</p>
                  </div>

                  {hasCards && !showNewCard && (
                    <>
                      <SavedCardSelector selected={selectedSavedCardId} onSelect={setSelectedSavedCardId} />
                      <button type="button" onClick={() => setShowNewCard(true)}
                        className="flex items-center gap-1.5 text-[13px] text-[#3348ff] hover:underline -mt-2">
                        <Plus className="h-3.5 w-3.5" /> Farklı kart gir
                      </button>
                    </>
                  )}

                  {(!hasCards || showNewCard) && (
                    <>
                      {showNewCard && (
                        <button type="button" onClick={() => setShowNewCard(false)}
                          className="text-[13px] text-[#6f7c8e] hover:text-[#3348ff] flex items-center gap-1 -mt-2">
                          ← Kayıtlı kartlarıma dön
                        </button>
                      )}

                      <FormField label="Kart üzerindeki isim">
                        <Input value={cardForm.cardHolderName} onChange={(e) => setCardForm({ ...cardForm, cardHolderName: e.target.value })}
                          placeholder="Ad Soyad" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
                      </FormField>
                      <FormField label="Kart numarası">
                        <Input value={cardForm.cardNumber} onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                          placeholder="5528790000000008" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
                      </FormField>
                      <div className="flex gap-3">
                        <FormField label="Ay" className="flex-1">
                          <Input value={cardForm.expireMonth} onChange={(e) => setCardForm({ ...cardForm, expireMonth: e.target.value })}
                            placeholder="12" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
                        </FormField>
                        <FormField label="Yıl" className="flex-1">
                          <Input value={cardForm.expireYear} onChange={(e) => setCardForm({ ...cardForm, expireYear: e.target.value })}
                            placeholder="2030" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
                        </FormField>
                        <FormField label="CVC" className="flex-1">
                          <Input value={cardForm.cvc} onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                            placeholder="123" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10" required />
                        </FormField>
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)}
                          className="h-4 w-4 accent-[#3348ff] rounded" />
                        <span className="text-[13px] text-[#3a4553]">Bu kartı kaydet</span>
                      </label>
                      {saveCard && (
                        <Input value={cardAlias} onChange={(e) => setCardAlias(e.target.value)}
                          placeholder="Kart takma adı (Ana kartım, İş kartım…)" className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10 -mt-2" />
                      )}
                    </>
                  )}

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <hr className="border-[#dce0e5]" />

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="secondary" onClick={() => setStep('shipping')}
                      className="gap-2 bg-[#edf0f2] text-[#14181f] hover:bg-[#dce0e5]">
                      <ChevronLeft className="size-4" /> Teslimata dön
                    </Button>
                    <Button type="submit" disabled={loading} className="gap-2 bg-primary text-white hover:bg-primary/90">
                      {loading ? 'İşleniyor…' : `${formatPrice(total)} öde`}
                      {!loading && <ChevronRight className="size-4" />}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </main>

          <aside className="md:basis-5/12 md:shrink-0 md:self-start md:sticky md:top-0">
            <OrderSummary coupon={coupon} onCouponChange={setCoupon} subtotal={subtotal} deliveryCost={deliveryCost} />
          </aside>
        </div>
      </div>
    </div>
  )
}
