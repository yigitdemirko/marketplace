import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { productsApi } from '@/api/products'

const DEALS_END = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

const DISCOUNT_LABELS = ['-25%', '-12%', '-33%', '-15%', '-25%']

function useCountdown(target: Date) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, target.getTime() - now.getTime())
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  }
}

interface CountdownBoxProps {
  value: number
  label: string
}

function CountdownBox({ value, label }: CountdownBoxProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="min-w-[44px] h-[44px] bg-[#f6f7f9] border border-[#dce0e5] rounded-[6px] flex items-center justify-center font-semibold text-[18px] text-[#14181f] tabular-nums px-2">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-[11px] text-[#6f7c8e]">{label}</span>
    </div>
  )
}

export function FlashSalesSection() {
  const navigate = useNavigate()
  const { days, hours, mins, secs } = useCountdown(DEALS_END)

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'deals'],
    queryFn: () => productsApi.getAll(0, 5),
  })

  return (
    <section className="bg-white py-8">
      <div className="max-w-[1280px] mx-auto px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[24px] font-semibold text-[#14181f]">Deals and offers</h2>
            <span className="text-[15px] text-[#6f7c8e]">Hygiene equipments</span>
          </div>

          {/* Countdown */}
          <div className="flex items-end gap-2">
            <CountdownBox value={days} label="Days" />
            <span className="text-[18px] font-semibold text-[#14181f] mb-5">:</span>
            <CountdownBox value={hours} label="Hours" />
            <span className="text-[18px] font-semibold text-[#14181f] mb-5">:</span>
            <CountdownBox value={mins} label="Mins" />
            <span className="text-[18px] font-semibold text-[#14181f] mb-5">:</span>
            <CountdownBox value={secs} label="Secs" />
          </div>
        </div>

        {/* Products */}
        {isLoading && (
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[240px] bg-[#f6f7f9] animate-pulse rounded-[8px]" />
            ))}
          </div>
        )}

        {data && data.content.length > 0 && (
          <div className="grid grid-cols-5 gap-4">
            {data.content.slice(0, 5).map((product, index) => (
              <div
                key={product.id}
                className="bg-white border border-[#dce0e5] rounded-[8px] overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative"
                onClick={() =>
                  navigate({ to: '/products/$productId', params: { productId: product.id } })
                }
              >
                {/* Discount badge */}
                <span className="absolute top-2 left-2 bg-[#fa3434] text-white text-[12px] font-semibold px-2 py-0.5 rounded-[4px] z-10">
                  {DISCOUNT_LABELS[index % DISCOUNT_LABELS.length]}
                </span>

                {/* Image */}
                <div className="aspect-square bg-[#f6f7f9] overflow-hidden flex items-center justify-center">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="px-3 py-3">
                  <p className="text-[15px] text-[#14181f] truncate">{product.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
