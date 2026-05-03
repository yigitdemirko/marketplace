import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'
import { profileApi } from '@/api/profile'
import { cn } from '@/lib/utils'
import type { SavedAddress } from '@/types'

export function SavedAddressSelector({ onSelect }: { onSelect: (addr: SavedAddress) => void }) {
  const { data: addresses = [] } = useQuery({
    queryKey: ['profile', 'addresses'],
    queryFn: profileApi.getAddresses,
  })
  const [selected, setSelected] = useState<string>(() => {
    const def = addresses.find((a: SavedAddress) => a.isDefault)
    return def?.id ?? addresses[0]?.id ?? ''
  })

  if (addresses.length === 0) return null

  return (
    <div className="mb-5">
      <p className="text-[13px] font-medium text-[#6f7c8e] mb-3 flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5" /> Kayıtlı adreslerim
      </p>
      <div className="space-y-2">
        {addresses.map((addr: SavedAddress) => (
          <label
            key={addr.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors',
              selected === addr.id ? 'border-[#3348ff] bg-[#f0f2ff]' : 'border-[#dce0e5] bg-white hover:bg-[#f7f8f9]',
            )}
          >
            <input
              type="radio"
              name="saved-address"
              checked={selected === addr.id}
              onChange={() => { setSelected(addr.id); onSelect(addr) }}
              className="mt-0.5 accent-[#3348ff]"
            />
            <div>
              <p className="text-[13px] font-medium text-[#14181f]">{addr.title} — {addr.fullName}</p>
              <p className="text-[12px] text-[#6f7c8e]">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city} {addr.postalCode}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
