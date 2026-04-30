import { Package, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import type { SellerStats } from '@/types'

interface Props {
  stats?: SellerStats
  isLoading: boolean
}

const CARD_BASE =
  'flex items-start gap-3 p-4 rounded-[8px] border border-[#dce0e5] bg-white'

export function CatalogStatsCards({ stats, isLoading }: Props) {
  const items = [
    {
      label: 'Total products',
      value: stats?.total ?? 0,
      icon: Package,
      iconBg: 'bg-[#eef0ff]',
      iconColor: 'text-[#3348ff]',
    },
    {
      label: 'In stock',
      value: stats?.inStock ?? 0,
      icon: CheckCircle2,
      iconBg: 'bg-[#e6f7ee]',
      iconColor: 'text-[#00a81c]',
    },
    {
      label: 'Out of stock',
      value: stats?.outOfStock ?? 0,
      icon: AlertCircle,
      iconBg: 'bg-[#ffeaea]',
      iconColor: 'text-[#fa3434]',
    },
    {
      label: 'Low stock',
      value: stats?.lowStock ?? 0,
      icon: AlertTriangle,
      iconBg: 'bg-[#fff4e0]',
      iconColor: 'text-[#f59e0b]',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {items.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
        <div key={label} className={CARD_BASE}>
          <div className={`w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <p className="text-[12px] text-[#6f7c8e] mb-0.5">{label}</p>
            {isLoading ? (
              <div className="h-7 w-16 bg-[#f6f7f9] animate-pulse rounded" />
            ) : (
              <p className="text-[22px] font-semibold text-[#14181f] leading-none">{value}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
