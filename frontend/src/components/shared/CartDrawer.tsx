import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { X, Trash2, Minus, Plus } from 'lucide-react'
import { useBasket, useRemoveBasketItem, useSetBasketItem } from '@/hooks/useBasket'
import { useCartDrawer } from '@/store/cartDrawerStore'
import { useToastStore } from '@/store/toastStore'
import { formatPrice } from '@/lib/formatPrice'

export function CartDrawer() {
  const { isOpen, close } = useCartDrawer()
  const { items, totalItems, totalAmount } = useBasket()
  const removeItem = useRemoveBasketItem()
  const updateQuantity = useSetBasketItem()
  const showToast = useToastStore((s) => s.show)
  const navigate = useNavigate()

  // lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const handleCheckout = () => {
    close()
    navigate({ to: '/checkout' })
  }

  const handleViewCart = () => {
    close()
    navigate({ to: '/cart' })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sepetim"
        className={`fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-[540px] flex-col bg-white border-l border-[#b6c1ca] shadow-[0px_4px_30px_0px_rgba(0,0,0,0.1)] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#dce0e5] pl-6 pr-3">
          <h2 className="text-[20px] font-semibold text-[#14181f]">
            Sepetim ({totalItems})
          </h2>
          <button
            onClick={close}
            aria-label="Sepeti kapat"
            className="flex size-8 items-center justify-center rounded-full bg-[#f6f7f9] text-[#525e6f] hover:bg-[#edf0f2] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#6f7c8e]">
              <p className="text-base">Sepetiniz boş</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-[18px] border-b border-[#dce0e5] pb-5"
                >
                  {/* Product image */}
                  <div className="size-[100px] shrink-0 overflow-hidden rounded-lg bg-[#eceff2]">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col gap-[22px] min-w-0">
                    {/* Name + delete */}
                    <div className="flex items-start gap-2">
                      <div className="flex flex-1 flex-col gap-1 min-w-0">
                        <p className="truncate text-[15px] font-normal leading-[1.4] tracking-[-0.3px] text-[#14181f]">
                          {item.name}
                        </p>
                        <p className="text-[15px] text-[#525e6f] tracking-[-0.3px]">
                          Adet: {item.quantity}
                        </p>
                      </div>
                      <button
                        onClick={() => { removeItem.mutate(item.productId); showToast('Ürün sepetten çıkarıldı') }}
                        aria-label={`${item.name} ürününü kaldır`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#dce0e5] bg-white text-[#525e6f] hover:bg-[#f6f7f9] transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {/* Qty stepper + price */}
                    <div className="flex items-center gap-3">
                      {/* Stepper */}
                      <div className="flex h-8 w-[110px] items-center justify-center gap-1 rounded-md border border-[#dce0e5] bg-white px-1">
                        <button
                          onClick={() => updateQuantity.mutate({ productId: item.productId, quantity: item.quantity - 1 })}
                          aria-label="Adeti azalt"
                          className="flex size-[26px] shrink-0 items-center justify-center rounded-md bg-[#e0edff] text-[#3348ff] hover:bg-[#c7dfff] transition-colors"
                        >
                          <Minus className="size-3.5" strokeWidth={2.5} />
                        </button>
                        <span className="flex-1 text-center text-[15px] text-[#14181f] leading-[1.4]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => { updateQuantity.mutate({ productId: item.productId, quantity: item.quantity + 1 }); showToast('Adet artırıldı') }}
                          aria-label="Adeti artır"
                          className="flex size-[26px] shrink-0 items-center justify-center rounded-md bg-[#e0edff] text-[#3348ff] hover:bg-[#c7dfff] transition-colors"
                        >
                          <Plus className="size-3.5" strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Line price */}
                      <span className="text-[15px] text-[#525e6f] tracking-[-0.3px] whitespace-nowrap">
                        {formatPrice(item.currentPrice)} × {item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Subtotal */}
              <div className="flex items-center justify-between text-[18px] font-medium text-[#14181f]">
                <span>Ara toplam:</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#dce0e5] bg-[#f6f7f9] px-6 py-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="flex flex-1 h-12 items-center justify-center rounded-lg bg-primary text-white text-[18px] font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Hemen öde
          </button>
          <button
            onClick={handleViewCart}
            className="flex flex-1 h-12 items-center justify-center rounded-lg border border-[#dce0e5] bg-white text-[18px] font-medium text-[#14181f] hover:bg-[#f6f7f9] transition-colors"
          >
            Sepete git
          </button>
        </div>
      </div>
    </>
  )
}
