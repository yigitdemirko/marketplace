import { apiClient } from './client'

export type NotificationType =
  | 'ORDER_CREATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'ORDER_CANCELLED'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  link?: string | null
  read: boolean
  createdAt: string
}

export interface NotificationPage {
  content: Notification[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const notificationsApi = {
  list: (params: { unread?: boolean; page?: number; size?: number } = {}) => {
    const query = new URLSearchParams()
    if (params.unread) query.set('unread', 'true')
    if (params.page !== undefined) query.set('page', String(params.page))
    if (params.size !== undefined) query.set('size', String(params.size))
    const qs = query.toString()
    return apiClient.get<NotificationPage>(`/api/v1/notifications${qs ? `?${qs}` : ''}`)
  },

  unreadCount: () =>
    apiClient.get<{ count: number }>('/api/v1/notifications/unread-count'),

  markRead: (id: string) =>
    apiClient.post<void>(`/api/v1/notifications/${id}/read`, {}),

  markAllRead: () =>
    apiClient.post<void>('/api/v1/notifications/read-all', {}),
}
