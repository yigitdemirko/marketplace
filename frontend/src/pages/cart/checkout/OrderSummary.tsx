import { Package } from 'lucide-react'
import { useBasket } from '@/hooks/useBasket'
import { formatPrice } from '@/lib/formatPrice'

export const TAX_RATE = 0.038

export function OrderSummary({ coupon, onCouponChange, subtotal, deliveryCost }: {
  coupon: string
  onCouponChange: (v: string) => void
  subtotal: number
  deliveryCost: number
}) {
  const { items } = useBasket()
  const tax = subtotal * TAX_RATE

  return (
    <div className="p-5 md:p-10 bg-[#f6f7f9] h-full">
      <p className="font-medium mb-6 text-[#14181f]">Sipariş özeti</p>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <figure key={item.productId} className="flex gap-3">
            <div className="size-[72px] shrink-0 overflow-hidden rounded-lg bg-white border border-[#dce0e5] flex items-center justify-center">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="size-full object-contain mix-blend-multiply" />
              ) : (
                <Package className="size-6 text-[#cbd3db]" />
              )}
            </div>
            <figcaption className="flex flex-1 flex-col gap-0.5 min-w-0">
              <p className="font-medium text-[#14181f] text-sm leading-tight line-clamp-2">{item.name}</p>
              <p className="text-sm text-[#6f7c8e]">Adet: {item.quantity}</p>
            </figcaption>
            <div className="text-right">
              <span className="text-sm text-[#6f7c8e] whitespace-nowrap">{formatPrice(item.lineTotal)}</span>
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
