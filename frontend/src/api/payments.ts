import { apiClient } from './client'
import type { Payment } from '@/types'

export interface ProcessPaymentRequest {
  orderId: string
  idempotencyKey: string
  cardHolderName: string
  cardNumber: string
  expireMonth: string
  expireYear: string
  cvc: string
}

export const paymentsApi = {
  process: (data: ProcessPaymentRequest, userId: string) =>
    apiClient.post<Payment>('/api/v1/payments', data, { 'X-User-Id': userId }),

  getByOrderId: (orderId: string) =>
    apiClient.get<Payment>(`/api/v1/payments/order/${orderId}`),
}