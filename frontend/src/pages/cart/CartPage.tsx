import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cartStore'

export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalAmount, totalItems } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <p className="text-muted-foreground">Add some products to get started</p>
        <Button onClick={() => window.location.href = '/'}>
          Continue Shopping
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cart ({totalItems()} items)</h1>
        <Button variant="ghost" size="sm" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.productId}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ₺{item.price.toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-right font-medium mt-2">
                ₺{(item.price * item.quantity).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal ({totalItems()} items)</span>
            <span>₺{totalAmount().toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>₺{totalAmount().toFixed(2)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => window.location.href = '/checkout'}
          >
            Proceed to Checkout
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}