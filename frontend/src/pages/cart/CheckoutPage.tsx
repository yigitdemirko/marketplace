import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/api/orders'
import { paymentsApi } from '@/api/payments'

export function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCartStore()
  const { user } = useAuthStore()

  const [shippingAddress, setShippingAddress] = useState('')
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

  const handleCheckout = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

    try {
      const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).slice(2)}`

      const order = await ordersApi.create({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress,
        idempotencyKey,
      }, user.userId)

      await paymentsApi.process({
        orderId: order.id,
        userId: user.userId,
        amount: totalAmount(),
        idempotencyKey: `pay-${idempotencyKey}`,
        ...cardForm,
      })

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
        <Button onClick={() => window.location.href = '/orders'}>
          View Orders
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <form onSubmit={handleCheckout} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter your shipping address"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Card Holder Name</Label>
              <Input
                value={cardForm.cardHolderName}
                onChange={(e) => setCardForm({ ...cardForm, cardHolderName: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Card Number</Label>
              <Input
                value={cardForm.cardNumber}
                onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                placeholder="5528790000000008"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Input
                  value={cardForm.expireMonth}
                  onChange={(e) => setCardForm({ ...cardForm, expireMonth: e.target.value })}
                  placeholder="12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  value={cardForm.expireYear}
                  onChange={(e) => setCardForm({ ...cardForm, expireYear: e.target.value })}
                  placeholder="2030"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>CVC</Label>
                <Input
                  value={cardForm.cvc}
                  onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                  placeholder="123"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Items ({items.length})</span>
              <span>₺{totalAmount().toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₺{totalAmount().toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Processing...' : `Pay ₺${totalAmount().toFixed(2)}`}
        </Button>
      </form>
    </div>
  )
}