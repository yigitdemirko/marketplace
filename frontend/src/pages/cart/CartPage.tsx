import { Trash2, Plus, Minus, ShoppingBag, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalAmount, totalItems } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate({ to: '/login' })
    } else {
      navigate({ to: '/checkout' })
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="rounded-full bg-muted p-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <p className="text-muted-foreground text-sm">Add some products to get started</p>
        <Button onClick={() => navigate({ to: '/' })}>Continue Shopping</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Shopping Cart
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({totalItems()} items)
          </span>
        </h1>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground hover:text-destructive">
          Clear all
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 bg-card rounded-xl p-4 ring-1 ring-foreground/10"
            >
              {/* Image */}
              <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-snug line-clamp-2">{item.name}</p>
                <p className="text-primary font-bold mt-1">₺{item.price.toFixed(2)}</p>

                <div className="flex items-center gap-3 mt-3">
                  {/* Quantity stepper */}
                  <div className="flex items-center rounded-lg overflow-hidden ring-1 ring-border">
                    <button
                      className={cn(
                        'h-7 w-7 flex items-center justify-center transition-colors',
                        'hover:bg-muted text-muted-foreground hover:text-foreground',
                        item.quantity <= 1 && 'opacity-50 pointer-events-none',
                      )}
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      className="h-7 w-7 flex items-center justify-center transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.productId)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Line total */}
              <div className="shrink-0 text-right">
                <p className="font-bold text-sm">₺{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl ring-1 ring-foreground/10 p-5 sticky top-6">
            <h2 className="font-bold text-base mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({totalItems()} items)</span>
                <span>₺{totalAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-primary font-medium">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>₺{totalAmount().toFixed(2)}</span>
              </div>
            </div>

            <Button className="w-full mt-5" onClick={handleCheckout}>
              Proceed to Checkout
            </Button>

            <Button
              variant="ghost"
              className="w-full mt-2 text-muted-foreground"
              onClick={() => navigate({ to: '/' })}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
