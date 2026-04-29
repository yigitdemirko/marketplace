import { apiClient } from './client'
import type { Order } from '@/types'

export interface CreateOrderRequest {
  items: {
    productId: string
    sellerId: string
    quantity: number
    unitPrice: number
  }[]
  shippingAddress: string
  idempotencyKey: string
}

export const ordersApi = {
  create: (data: CreateOrderRequest, userId: string) =>
    apiClient.post<Order>('/api/v1/orders', data, { 'X-User-Id': userId }),

  getAll: (userId: string) =>
    apiClient.get<Order[]>('/api/v1/orders', { 'X-User-Id': userId }),

  getById: (orderId: string, userId: string) =>
    apiClient.get<Order>(`/api/v1/orders/${orderId}`, { 'X-User-Id': userId }),

  cancel: (orderId: string, userId: string) =>
    apiClient.delete<Order>(`/api/v1/orders/${orderId}`, { 'X-User-Id': userId }),
}