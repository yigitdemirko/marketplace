import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/api/orders'
import { paymentsApi } from '@/api/payments'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatPrice'

type CheckoutStep = 'shipping' | 'payment'
type DeliveryMethod = 'pickup' | 'standard' | 'express'

const DELIVERY_OPTIONS: {
  id: DeliveryMethod
  label: string
  description: string
  cost: number
}[] = [
  { id: 'pickup', label: 'Mağazadan teslim', description: 'En yakın şubeden', cost: 0 },
  { id: 'standard', label: 'Standart kargo', description: 'Sipariş sonrası 7-10 gün', cost: 9 },
  { id: 'express', label: 'Hızlı kargo', description: 'Sipariş sonrası 1-2 gün', cost: 25 },
]

const TAX_RATE = 0.038

function FormField({
  label,
  optional,
  children,
  className,
}: {
  label: string
  optional?: boolean
  children: React.ReactNode
  className?: string
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

function OrderSummary({
  coupon,
  onCouponChange,
  subtotal,
  deliveryCost,
}: {
  coupon: string
  onCouponChange: (v: string) => void
  subtotal: number
  deliveryCost: number
}) {
  const { items } = useCartStore()
  const discount: number = 0
  const tax = subtotal * TAX_RATE
  const total = subtotal + deliveryCost + tax - discount

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
              <span className="text-sm text-[#6f7c8e] whitespace-nowrap">
                {formatPrice(item.price * item.quantity)}
              </span>
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
        <button
          type="button"
          className="h-10 rounded-lg border border-[#dce0e5] bg-white px-4 text-sm font-medium text-[#14181f] hover:bg-white/80 transition-colors"
        >
          Uygula
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        <li className="flex items-center justify-between text-sm text-[#14181f]">
          <span>Ara toplam:</span>
          <span>{formatPrice(subtotal)}</span>
        </li>
        <li className="flex items-center justify-between text-sm text-[#14181f]">
          <span>İndirim:</span>
          <span>{discount === 0 ? formatPrice(0) : `- ${formatPrice(discount)}`}</span>
        </li>
        <li className="flex items-center justify-between text-sm text-[#14181f]">
          <span>Kargo:</span>
          <span>{formatPrice(deliveryCost)}</span>
        </li>
        <li className="flex items-center justify-between text-sm text-[#14181f]">
          <span>KDV:</span>
          <span>{formatPrice(tax)}</span>
        </li>
      </ul>

      <hr className="my-4 border-[#dce0e5]" />

      <dl className="flex items-center justify-between">
        <dt className="text-[#14181f]">Toplam:</dt>
        <dd className="font-semibold text-xl text-[#14181f]">{formatPrice(total)}</dd>
      </dl>
    </div>
  )
}

export function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [step, setStep] = useState<CheckoutStep>('shipping')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup')
  const [coupon, setCoupon] = useState('')

  const [contact, setContact] = useState({
    name: '',
    surname: '',
    email: user?.email ?? '',
  })

  const [shippingForm, setShippingForm] = useState({
    city: '',
    postalCode: '',
    addressLine1: '',
    addressLine2: '',
  })

  const [cardForm, setCardForm] = useState({
    cardHolderName: '',
    cardNumber: '',
    expireMonth: '',
    expireYear: '',
    cvc: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isAuthenticated) {
    navigate({ to: '/login' })
    return null
  }

  const deliveryCost = DELIVERY_OPTIONS.find((o) => o.id === deliveryMethod)!.cost
  const subtotal = totalAmount()
  const tax = subtotal * TAX_RATE
  const total = subtotal + deliveryCost + tax

  const handlePlaceOrder = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('Sipariş vermek için giriş yapmalısınız.')
      return
    }
    if (items.length === 0) {
      setError('Sepetiniz boş.')
      return
    }

    setLoading(true)
    try {
      const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const shippingAddress = [
        shippingForm.addressLine1,
        shippingForm.addressLine2,
        shippingForm.city,
        shippingForm.postalCode,
      ]
        .filter(Boolean)
        .join(', ')

      const order = await ordersApi.create(
        {
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          shippingAddress,
          idempotencyKey,
        },
        user.userId,
      )

      await paymentsApi.process(
        { orderId: order.id, idempotencyKey: `pay-${idempotencyKey}`, ...cardForm },
        user.userId,
      )

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
          {/* Main form area — md:7/12 */}
          <main className="md:basis-7/12 md:shrink-0">
            <div className="py-10 md:mr-10">
              {step === 'shipping' ? (
                <form
                  id="shipping-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setStep('payment')
                  }}
                >
                  {/* Contact information */}
                  <article className="mb-5">
                    <h4 className="mb-5 text-xl font-semibold text-[#14181f]">İletişim bilgileri</h4>
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4 mb-6">
                      <FormField label="Ad">
                        <Input
                          value={contact.name}
                          onChange={(e) => setContact({ ...contact, name: e.target.value })}
                          placeholder="Buraya yazın"
                          className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                          required
                        />
                      </FormField>
                      <FormField label="Soyad">
                        <Input
                          value={contact.surname}
                          onChange={(e) => setContact({ ...contact, surname: e.target.value })}
                          placeholder="Buraya yazın"
                          className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                          required
                        />
                      </FormField>
                      <FormField label="E-posta" className="md:col-span-2">
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) => setContact({ ...contact, email: e.target.value })}
                          placeholder="Buraya yazın"
                          className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                          required
                        />
                      </FormField>
                    </fieldset>
                    <hr className="border-[#dce0e5]" />
                  </article>

                  {/* Shipping address */}
                  <article className="mb-5">
                    <h4 className="mb-5 text-xl font-semibold text-[#14181f]">Teslimat adresi</h4>

                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4 mb-4">
                      <FormField label="Şehir">
                        <Input
                          value={shippingForm.city}
                          onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                          placeholder="Şehir adı girin"
                          className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                          required
                        />
                      </FormField>

                      <FormField label="Posta kodu">
                        <Input
                          value={shippingForm.postalCode}
                          onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                          placeholder=""
                          className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                          required
                        />
                      </FormField>

                      <FormField label="Adres satırı 1" className="md:col-span-2">
                        <Input
                          value={shippingForm.addressLine1}
                          onChange={(e) => setShippingForm({ ...shippingForm, addressLine1: e.target.value })}
                          placeholder="Sokak adı, bina"
                          className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                          required
                        />
                      </FormField>

                      <FormField label="Adres satırı 2" className="md:col-span-2">
                        <Input
                          value={shippingForm.addressLine2}
                          onChange={(e) => setShippingForm({ ...shippingForm, addressLine2: e.target.value })}
                          placeholder="Daire, kat (isteğe bağlı)"
                          className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                        />
                      </FormField>
                    </fieldset>

                    <p className="mb-3 text-sm text-[#14181f]">Teslimat seçeneği</p>

                    <fieldset className="flex flex-col sm:flex-row gap-2">
                      {DELIVERY_OPTIONS.map((option) => {
                        const selected = deliveryMethod === option.id
                        return (
                          <label
                            key={option.id}
                            className={cn(
                              'flex flex-1 items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                              selected ? 'border-primary bg-blue-50' : 'border-[#dce0e5] bg-white',
                            )}
                          >
                            <input
                              type="radio"
                              name="delivery-type"
                              checked={selected}
                              onChange={() => setDeliveryMethod(option.id)}
                              className="mt-1 accent-primary"
                            />
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
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => navigate({ to: '/cart' })}
                      className="gap-2 bg-[#edf0f2] text-[#14181f] hover:bg-[#dce0e5]"
                    >
                      <ChevronLeft className="size-4" />
                      Sepete dön
                    </Button>
                    <Button type="submit" className="gap-2 bg-primary text-white hover:bg-primary/90">
                      Ödemeye geç
                      <ChevronRight className="size-4" />
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

                  <FormField label="Kart üzerindeki isim">
                    <Input
                      value={cardForm.cardHolderName}
                      onChange={(e) => setCardForm({ ...cardForm, cardHolderName: e.target.value })}
                      placeholder="Ad Soyad"
                      className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                      required
                    />
                  </FormField>

                  <FormField label="Kart numarası">
                    <Input
                      value={cardForm.cardNumber}
                      onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                      placeholder="5528790000000008"
                      className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                      required
                    />
                  </FormField>

                  <div className="flex gap-3">
                    <FormField label="Ay" className="flex-1">
                      <Input
                        value={cardForm.expireMonth}
                        onChange={(e) => setCardForm({ ...cardForm, expireMonth: e.target.value })}
                        placeholder="12"
                        className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                        required
                      />
                    </FormField>
                    <FormField label="Yıl" className="flex-1">
                      <Input
                        value={cardForm.expireYear}
                        onChange={(e) => setCardForm({ ...cardForm, expireYear: e.target.value })}
                        placeholder="2030"
                        className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                        required
                      />
                    </FormField>
                    <FormField label="CVC" className="flex-1">
                      <Input
                        value={cardForm.cvc}
                        onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                        placeholder="123"
                        className="bg-white border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                        required
                      />
                    </FormField>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <hr className="border-[#dce0e5]" />

                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setStep('shipping')}
                      className="gap-2 bg-[#edf0f2] text-[#14181f] hover:bg-[#dce0e5]"
                    >
                      <ChevronLeft className="size-4" />
                      Teslimata dön
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

          {/* Summary panel — md:5/12, sticky so it stays anchored across steps */}
          <aside className="md:basis-5/12 md:shrink-0 md:self-start md:sticky md:top-0">
            <OrderSummary
              coupon={coupon}
              onCouponChange={setCoupon}
              subtotal={subtotal}
              deliveryCost={deliveryCost}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
