import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useBasket, useClearBasket } from '@/hooks/useBasket'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/api/orders'
import { paymentsApi } from '@/api/payments'
import { profileApi, type SaveAddressRequest, type SaveCardRequest } from '@/api/profile'
import { formatPrice } from '@/lib/formatPrice'
import { OrderSummary, TAX_RATE } from './checkout/OrderSummary'
import { ShippingStep } from './checkout/ShippingStep'
import { PaymentStep, type CardForm } from './checkout/PaymentStep'
import { SuccessScreen } from './checkout/SuccessScreen'
import { DELIVERY_OPTIONS, type DeliveryMethod } from './checkout/delivery'

const PAYMENT_MAX_AMOUNT = Number(import.meta.env.VITE_PAYMENT_MAX_AMOUNT ?? 100000)
const PAYMENT_MAX_AMOUNT_WARN = PAYMENT_MAX_AMOUNT * 0.9

type CheckoutStep = 'shipping' | 'payment'

export function CheckoutPage() {
  const { ready, isAuthenticated } = useRequireAuth()
  const { items, totalAmount } = useBasket()
  const clearCart = useClearBasket()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [step, setStep] = useState<CheckoutStep>('shipping')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup')
  const [coupon, setCoupon] = useState('')

  const [contact, setContact] = useState({ name: '', surname: '', email: user?.email ?? '' })
  const [shippingForm, setShippingForm] = useState({ city: '', postalCode: '', addressLine1: '', addressLine2: '' })
  const [cardForm, setCardForm] = useState<CardForm>({ cardHolderName: '', cardNumber: '', expireMonth: '', expireYear: '', cvc: '' })

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

  if (!ready) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg mx-auto max-w-[1280px] my-10" />
  }
  if (!isAuthenticated) return null

  const deliveryCost = DELIVERY_OPTIONS.find((o) => o.id === deliveryMethod)!.cost
  const subtotal = totalAmount
  const tax = subtotal * TAX_RATE
  const total = subtotal + deliveryCost + tax
  const overLimit = total > PAYMENT_MAX_AMOUNT
  const nearLimit = total > PAYMENT_MAX_AMOUNT_WARN && !overLimit

  const handlePlaceOrder = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    if (!user || items.length === 0) return
    if (overLimit) {
      setError(`Sepet tutarı ${formatPrice(PAYMENT_MAX_AMOUNT)} limitini aşıyor. Lütfen ürün çıkarın.`)
      return
    }

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

      clearCart.mutate()
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme başarısız')
    } finally {
      setLoading(false)
    }
  }

  if (success) return <SuccessScreen />

  return (
    <div className="bg-white min-h-[calc(100vh-64px)]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row">
          <main className="md:basis-7/12 md:shrink-0">
            <div className="py-10 md:mr-10">
              {overLimit && (
                <div className="mb-5 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
                  Sepet tutarınız {formatPrice(PAYMENT_MAX_AMOUNT)} limitini aşıyor. Sipariş oluşturulamaz.
                </div>
              )}
              {nearLimit && (
                <div className="mb-5 rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-700">
                  Sepet tutarınız {formatPrice(PAYMENT_MAX_AMOUNT)} limitine yaklaşıyor.
                </div>
              )}
              {step === 'shipping' ? (
                <ShippingStep
                  contact={contact}
                  setContact={setContact}
                  shippingForm={shippingForm}
                  setShippingForm={setShippingForm}
                  deliveryMethod={deliveryMethod}
                  setDeliveryMethod={setDeliveryMethod}
                  hasAddresses={hasAddresses}
                  showNewAddress={showNewAddress}
                  setShowNewAddress={setShowNewAddress}
                  saveAddress={saveAddress}
                  setSaveAddress={setSaveAddress}
                  addressTitle={addressTitle}
                  setAddressTitle={setAddressTitle}
                  error={error}
                  setError={setError}
                  onNext={() => setStep('payment')}
                />
              ) : (
                <PaymentStep
                  cardForm={cardForm}
                  setCardForm={setCardForm}
                  hasCards={hasCards}
                  showNewCard={showNewCard}
                  setShowNewCard={setShowNewCard}
                  selectedSavedCardId={selectedSavedCardId}
                  setSelectedSavedCardId={setSelectedSavedCardId}
                  saveCard={saveCard}
                  setSaveCard={setSaveCard}
                  cardAlias={cardAlias}
                  setCardAlias={setCardAlias}
                  loading={loading}
                  total={total}
                  error={error}
                  onBack={() => setStep('shipping')}
                  onSubmit={handlePlaceOrder}
                />
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
