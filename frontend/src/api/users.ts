import { apiClient } from './client'

export interface SellerPublicProfile {
  storeName: string
}

export const usersApi = {
  getSellerProfile: (userId: string) =>
    apiClient.get<SellerPublicProfile>(`/api/v1/users/seller/${userId}`),
}
