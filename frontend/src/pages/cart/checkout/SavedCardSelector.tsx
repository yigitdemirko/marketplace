import { useQuery } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'
import { profileApi } from '@/api/profile'
import { cn } from '@/lib/utils'
import type { SavedCard } from '@/types'

export function SavedCardSelector({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const { data: cards = [] } = useQuery({
    queryKey: ['profile', 'cards'],
    queryFn: profileApi.getCards,
  })

  if (cards.length === 0) return null

  return (
    <div className="mb-5">
      <p className="text-[13px] font-medium text-[#6f7c8e] mb-3 flex items-center gap-1.5">
        <CreditCard className="h-3.5 w-3.5" /> Kayıtlı kartlarım
      </p>
      <div className="space-y-2">
        {cards.map((card: SavedCard) => (
          <label
            key={card.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors',
              selected === card.id ? 'border-[#3348ff] bg-[#f0f2ff]' : 'border-[#dce0e5] bg-white hover:bg-[#f7f8f9]',
            )}
          >
            <input
              type="radio"
              name="saved-card"
              checked={selected === card.id}
              onChange={() => onSelect(card.id)}
              className="accent-[#3348ff]"
            />
            <div>
              <p className="text-[13px] font-medium text-[#14181f]">{card.alias} — {card.cardHolder}</p>
              <p className="text-[12px] text-[#6f7c8e] font-mono">•••• •••• •••• {card.last4} &nbsp; {card.expireMonth}/{card.expireYear}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
