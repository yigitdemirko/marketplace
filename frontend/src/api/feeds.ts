import { apiClient } from './client'
import type { ImportJob, PageResponse } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function uploadFeed(file: File, sellerId: string): Promise<ImportJob> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}/api/v1/feeds/import`, {
    method: 'POST',
    headers: { 'X-Seller-Id': sellerId },
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Yükleme başarısız' }))
    throw new Error(error.message ?? 'Yükleme başarısız')
  }

  return response.json()
}

export const feedsApi = {
  import: (file: File, sellerId: string) => uploadFeed(file, sellerId),

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
