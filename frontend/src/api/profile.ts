import { apiClient } from './client'
import type { SavedAddress, SavedCard } from '@/types'

export interface SaveAddressRequest {
  title: string
  fullName: string
  city: string
  postalCode: string
  addressLine1: string
  addressLine2?: string
}

export interface SaveCardRequest {
  alias: string
  cardHolder: string
  last4: string
  expireMonth: string
  expireYear: string
}

export const profileApi = {
  getAddresses: () =>
    apiClient.get<SavedAddress[]>('/api/v1/profile/addresses'),

  addAddress: (data: SaveAddressRequest) =>
    apiClient.post<SavedAddress>('/api/v1/profile/addresses', data),

  deleteAddress: (id: string) =>
    apiClient.delete<void>(`/api/v1/profile/addresses/${id}`),

  setDefaultAddress: (id: string) =>
    apiClient.patch<SavedAddress>(`/api/v1/profile/addresses/${id}/default`, null),

  getCards: () =>
    apiClient.get<SavedCard[]>('/api/v1/profile/cards'),

  addCard: (data: SaveCardRequest) =>
    apiClient.post<SavedCard>('/api/v1/profile/cards', data),

  deleteCard: (id: string) =>
    apiClient.delete<void>(`/api/v1/profile/cards/${id}`),

  setDefaultCard: (id: string) =>
    apiClient.patch<SavedCard>(`/api/v1/profile/cards/${id}/default`, null),
}
