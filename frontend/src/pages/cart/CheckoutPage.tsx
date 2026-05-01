import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/api/orders'
import { paymentsApi } from '@/api/payments'
import { cn } from '@/lib/utils'

type CheckoutStep = 'shipping' | 'payment'
type ShippingMethod = 'standard' | 'express' | 'overnight'

const SHIPPING_OPTIONS: { id: ShippingMethod; label: string; description: string; cost: number }[] = [
  { id: 'standard', label: 'Standard shipping', description: 'Postal Service, 5-7 days', cost: 14 },
  { id: 'express', label: 'Express shipping', description: 'Air cargo, 3-4 days', cost: 25 },
  { id: 'overnight', label: 'Overnight shipping', description: 'Next day delivery', cost: 45 },
]

function FormField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <Label className="mb-1.5 text-sm font-medium text-[#14181f]">{label}</Label>
      {children}
    </div>
  )
}

function CartSummary({
  coupon,
  onCouponChange,
  subtotal,
  shippingCost,
}: {
  coupon: string
  onCouponChange: (v: string) => void
  subtotal: number
  shippingCost: number
}) {
  const { items } = useCartStore()
  const discount: number = 0
  const total = subtotal + shippingCost - discount

  return (
    <aside className="w-[380px] shrink-0 border-l border-[#dce0e5] bg-[#f6f7f9] flex flex-col">
      {/* Items */}
      <div className="flex flex-col gap-6 p-8 pb-0">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-3">
            <div className="size-[72px] shrink-0 overflow-hidden rounded-lg border border-[#b6c1ca] bg-white">
              {item.image ? (
                <img src={item.image} alt={item.name} className="size-full object-cover" />
              ) : (
                <div className="size-full bg-muted" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <p className="text-sm font-medium text-[#14181f] truncate">{item.name}</p>
              <p className="text-sm text-[#525e6f] truncate">Qty: {item.quantity}</p>
              <p className="text-sm text-[#525e6f] text-right">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div className="mx-8 mt-6 flex border-t border-[#b6c1ca] pt-5">
        <input
          type="text"
          value={coupon}
          onChange={(e) => onCouponChange(e.target.value)}
          placeholder="Coupon"
          className="flex-1 rounded-l-lg border border-r-0 border-[#dce0e5] bg-white px-3 py-2 text-sm text-[#14181f] placeholder:text-[#6f7c8e] outline-none h-10"
        />
        <button
          type="button"
          className="h-10 rounded-r-lg border border-[#dce0e5] bg-white px-3 text-sm font-medium text-[#14181f] hover:bg-muted/50 transition-colors"
        >
          Apply
        </button>
      </div>

      {/* Price breakdown */}
      <div className="mx-8 mt-0 flex flex-col gap-3 border-t border-[#b6c1ca] py-5">
        <div className="flex items-center justify-between text-sm text-[#14181f]">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-[#14181f]">
          <span>Discount:</span>
          <span>{discount === 0 ? '0' : `-$${discount.toFixed(2)}`}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-[#14181f]">
          <span>Shipping cost:</span>
          <span>${shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-semibold text-[#14181f]">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </aside>
  )
}

export function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [step, setStep] = useState<CheckoutStep>('shipping')
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard')
  const [coupon, setCoupon] = useState('')

  const [contact, setContact] = useState({
    fullName: user ? `${user.email.split('@')[0]}` : '',
    email: user?.email ?? '',
    phone: '',
    marketingOptIn: false,
  })

  const [shippingForm, setShippingForm] = useState({
    country: 'Turkey',
    city: '',
    address: '',
    postalCode: '',
    comment: '',
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

  const shippingCost = SHIPPING_OPTIONS.find((o) => o.id === shippingMethod)!.cost
  const subtotal = totalAmount()

  const handlePlaceOrder = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

    try {
      const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const shippingAddress = [shippingForm.address, shippingForm.city, shippingForm.postalCode, shippingForm.country]
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
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold">Order Placed!</h2>
        <p className="text-muted-foreground">Your order has been successfully placed.</p>
        <Button onClick={() => navigate({ to: '/orders' })}>View Orders</Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-white">
      {/* Main form area */}
      <div className="flex-1 px-20 py-9 overflow-y-auto">
        <div className="max-w-[680px]">
          {step === 'shipping' ? (
            <form
              id="shipping-form"
              onSubmit={(e) => {
                e.preventDefault()
                setStep('payment')
              }}
              className="flex flex-col gap-6"
            >
              {/* Contact information */}
              <section className="flex flex-col gap-5">
                <h2 className="text-lg font-semibold text-[#14181f]">Contact information</h2>

                <FormField label="Full name">
                  <Input
                    value={contact.fullName}
                    onChange={(e) => setContact({ ...contact, fullName: e.target.value })}
                    placeholder="First name Last name"
                    className="bg-[#f6f7f9] border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                    required
                  />
                </FormField>

                <div className="flex gap-3">
                  <FormField label="Email address" className="flex-1">
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      placeholder="name@example.com"
                      className="bg-[#f6f7f9] border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                      required
                    />
                  </FormField>
                  <FormField label="Phone number" className="flex-1">
                    <Input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      placeholder="+90 (555) 123-4567"
                      className="bg-[#f6f7f9] border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                    />
                  </FormField>
                </div>

                <label className="flex cursor-pointer items-center gap-2 py-1 select-none">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={contact.marketingOptIn}
                    onClick={() => setContact({ ...contact, marketingOptIn: !contact.marketingOptIn })}
                    className={cn(
                      'size-6 shrink-0 rounded flex items-center justify-center border-2 transition-colors',
                      contact.marketingOptIn
                        ? 'bg-primary border-primary'
                        : 'border-[#dce0e5] bg-white',
                    )}
                  >
                    {contact.marketingOptIn && <Check className="size-3.5 text-white" strokeWidth={3} />}
                  </button>
                  <span className="text-sm text-[#14181f]">Send me weekly offers</span>
                </label>
              </section>

              <Separator className="bg-[#dce0e5]" />

              {/* Shipping address */}
              <section className="flex flex-col gap-5">
                <h2 className="text-lg font-semibold text-[#14181f]">Shipping address</h2>

                <div className="flex gap-3">
                  <FormField label="Country" className="flex-1">
                    <div className="relative">
                      <select
                        value={shippingForm.country}
                        onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                        className="h-10 w-full appearance-none rounded-lg border border-[#dce0e5] bg-[#f6f7f9] px-3 text-sm text-[#14181f] outline-none focus:ring-2 focus:ring-ring/40"
                      >
                        <option>Turkey</option>
                        <option>United States</option>
                        <option>Germany</option>
                        <option>United Kingdom</option>
                        <option>France</option>
                        <option>Netherlands</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#525e6f]" />
                    </div>
                  </FormField>
                  <FormField label="City" className="flex-1">
                    <Input
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                      placeholder="Enter city name"
                      className="bg-[#f6f7f9] border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Address">
                  <Input
                    value={shippingForm.address}
                    onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                    placeholder="Street, Building, Apt"
                    className="bg-[#f6f7f9] border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                    required
                  />
                </FormField>

                <FormField label="Postal code" className="w-[202px]">
                  <Input
                    value={shippingForm.postalCode}
                    onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                    placeholder="Enter zip or postal"
                    className="bg-[#f6f7f9] border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                  />
                </FormField>

                <FormField label="Additional comment">
                  <textarea
                    value={shippingForm.comment}
                    onChange={(e) => setShippingForm({ ...shippingForm, comment: e.target.value })}
                    placeholder="Comment to order"
                    rows={4}
                    className="w-full resize-none rounded-lg border border-[#dce0e5] bg-[#f6f7f9] px-3 py-2 text-sm text-[#14181f] placeholder:text-[#929eaa] outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </FormField>
              </section>

              {/* Shipping options */}
              <div className="flex gap-3">
                {SHIPPING_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setShippingMethod(option.id)}
                    className={cn(
                      'flex flex-1 items-start justify-between gap-3 rounded-lg border p-3 text-left shadow-sm transition-colors',
                      shippingMethod === option.id
                        ? 'border-primary bg-blue-50'
                        : 'border-[#dce0e5] bg-white',
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-[#14181f] tracking-tight">{option.label}</span>
                      <span className="text-xs text-[#6f7c8e]">{option.description}</span>
                    </div>
                    <div
                      className={cn(
                        'mt-0.5 size-5 shrink-0 rounded-full border-2 flex items-center justify-center',
                        shippingMethod === option.id
                          ? 'border-primary'
                          : 'border-[#b6c1ca]',
                      )}
                    >
                      {shippingMethod === option.id && (
                        <div className="size-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <Separator className="bg-[#dce0e5]" />

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate({ to: '/cart' })}
                  className="gap-2 bg-[#edf0f2] text-[#14181f] hover:bg-[#dce0e5]"
                >
                  <ChevronLeft className="size-4" />
                  Back to cart
                </Button>
                <Button type="submit" className="gap-2 bg-primary text-white hover:bg-primary/90">
                  Continue to payment
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePlaceOrder} className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-[#14181f]">Payment details</h2>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-semibold mb-1">Test card</p>
                <p className="font-mono">5528790000000008 &nbsp; 12 / 2030 &nbsp; CVC: 123</p>
              </div>

              <FormField label="Card holder name">
                <Input
                  value={cardForm.cardHolderName}
                  onChange={(e) => setCardForm({ ...cardForm, cardHolderName: e.target.value })}
                  placeholder="John Doe"
                  className="bg-[#f6f7f9] border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                  required
                />
              </FormField>

              <FormField label="Card number">
                <Input
                  value={cardForm.cardNumber}
                  onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                  placeholder="5528790000000008"
                  className="bg-[#f6f7f9] border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                  required
                />
              </FormField>

              <div className="flex gap-3">
                <FormField label="Month" className="flex-1">
                  <Input
                    value={cardForm.expireMonth}
                    onChange={(e) => setCardForm({ ...cardForm, expireMonth: e.target.value })}
                    placeholder="12"
                    className="bg-[#f6f7f9] border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                    required
                  />
                </FormField>
                <FormField label="Year" className="flex-1">
                  <Input
                    value={cardForm.expireYear}
                    onChange={(e) => setCardForm({ ...cardForm, expireYear: e.target.value })}
                    placeholder="2030"
                    className="bg-[#f6f7f9] border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                    required
                  />
                </FormField>
                <FormField label="CVC" className="flex-1">
                  <Input
                    value={cardForm.cvc}
                    onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                    placeholder="123"
                    className="bg-[#f6f7f9] border-[#dce0e5] placeholder:text-[#929eaa] h-10"
                    required
                  />
                </FormField>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Separator className="bg-[#dce0e5]" />

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep('shipping')}
                  className="gap-2 bg-[#edf0f2] text-[#14181f] hover:bg-[#dce0e5]"
                >
                  <ChevronLeft className="size-4" />
                  Back to shipping
                </Button>
                <Button type="submit" disabled={loading} className="gap-2 bg-primary text-white hover:bg-primary/90">
                  {loading ? 'Processing…' : `Pay $${(subtotal + shippingCost).toFixed(2)}`}
                  {!loading && <ChevronRight className="size-4" />}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Cart summary sidebar */}
      <CartSummary
        coupon={coupon}
        onCouponChange={setCoupon}
        subtotal={subtotal}
        shippingCost={shippingCost}
      />
    </div>
  )
}
