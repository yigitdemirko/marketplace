export type DeliveryMethod = 'pickup' | 'standard' | 'express'

export const DELIVERY_OPTIONS: { id: DeliveryMethod; label: string; description: string; cost: number }[] = [
  { id: 'pickup', label: 'Mağazadan teslim', description: 'En yakın şubeden', cost: 0 },
  { id: 'standard', label: 'Standart kargo', description: 'Sipariş sonrası 7-10 gün', cost: 9 },
  { id: 'express', label: 'Hızlı kargo', description: 'Sipariş sonrası 1-2 gün', cost: 25 },
]
