import { apiClient } from './client'
import type { Order } from '@/types'

export interface CreateOrderRequest {
  items: {
    productId: string
    quantity: number
  }[]
  shippingAddress: string
  idempotencyKey: string
}

export interface SellerStats {
  totalOrders: number
  grossRevenue: number
  pendingShipment: number
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

  getSellerOrders: (sellerId: string, status?: string) =>
    apiClient.get<Order[]>(
      status ? `/api/v1/orders/seller?status=${status}` : '/api/v1/orders/seller',
      { 'X-Seller-Id': sellerId },
    ),

  getSellerStats: (sellerId: string) =>
    apiClient.get<SellerStats>('/api/v1/orders/seller/stats', { 'X-Seller-Id': sellerId }),

  markAsShipped: (orderId: string, sellerId: string) =>
    apiClient.patch<Order>(`/api/v1/orders/${orderId}/ship`, {}, { 'X-Seller-Id': sellerId }),

  markAsDelivered: (orderId: string, sellerId: string) =>
    apiClient.patch<Order>(`/api/v1/orders/${orderId}/deliver`, {}, { 'X-Seller-Id': sellerId }),
}