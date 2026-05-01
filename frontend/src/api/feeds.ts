import { apiClient } from './client'
import type { ImportJob, PageResponse } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function uploadFeed(file: File, sellerId: string, locale: 'EN' | 'TR'): Promise<ImportJob> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'X-Seller-Id': sellerId,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('locale', locale)

  const response = await fetch(`${BASE_URL}/api/v1/feeds/import`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }))
    throw new Error(error.message ?? 'Upload failed')
  }

  return response.json()
}

export const feedsApi = {
  import: (file: File, sellerId: string, locale: 'EN' | 'TR') => uploadFeed(file, sellerId, locale),

  getImports: (sellerId: string, page = 0, size = 10) =>
    apiClient.get<PageResponse<ImportJob>>(
      `/api/v1/feeds/imports?page=${page}&size=${size}`,
      { 'X-Seller-Id': sellerId },
    ),

  getImport: (jobId: string, sellerId: string) =>
    apiClient.get<ImportJob>(`/api/v1/feeds/imports/${jobId}`, {
      'X-Seller-Id': sellerId,
    }),
}
