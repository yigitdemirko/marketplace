import { apiClient } from './client'
import type { User } from '@/types'

export interface LoginRequest {
  email: string
  password: string
}

export interface BuyerRegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface SellerRegisterRequest {
  email: string
  password: string
  storeName: string
  taxNumber: string
  phone: string
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<User>('/api/v1/auth/login', data),

  registerBuyer: (data: BuyerRegisterRequest) =>
    apiClient.post<User>('/api/v1/auth/buyer/register', data),

  registerSeller: (data: SellerRegisterRequest) =>
    apiClient.post<User>('/api/v1/auth/seller/register', data),

  me: () =>
    apiClient.get<User>('/api/v1/auth/me'),

  logout: () =>
    apiClient.post<void>('/api/v1/auth/logout', null),

  logoutAll: () =>
    apiClient.post<void>('/api/v1/auth/logout-all', null),
}