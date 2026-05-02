import { apiClient } from './client'

export interface BasketItem {
  productId: string
  quantity: number
  name: string | null
  imageUrl: string | null
  brand: string | null
  sellerId: string | null
  currentPrice: number | null
  lineTotal: number | null
  availableStock: number | null
  available: boolean
  unavailableReason: string | null
}

export interface BasketResponse {
  userId: string
  items: BasketItem[]
  totalItems: number
  totalAmount: number
  hydrated: boolean
  updatedAt: string
}

export interface MergePayload {
  items: Array<{ productId: string; quantity: number }>
}

export const basketApi = {
  get: () => apiClient.get<BasketResponse>('/api/v1/basket'),

  addItem: (productId: string, quantity: number) =>
    apiClient.post<BasketResponse>('/api/v1/basket/items', { productId, quantity }),

  setItem: (productId: string, quantity: number) =>
    apiClient.patch<BasketResponse>(`/api/v1/basket/items/${productId}`, { quantity }),

  removeItem: (productId: string) =>
    apiClient.delete<BasketResponse>(`/api/v1/basket/items/${productId}`),

  clear: () => apiClient.delete<void>('/api/v1/basket'),

  merge: (payload: MergePayload) =>
    apiClient.post<BasketResponse>('/api/v1/basket/merge', payload),
}
