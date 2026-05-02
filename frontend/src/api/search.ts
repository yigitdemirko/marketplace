import { apiClient } from './client'
import type { PageResponse } from '@/types'

export interface SearchResult {
  id: string
  name: string
  categoryId: string
  price: number
  images: string[]
  brand?: string
}

export const searchApi = {
  suggest: (query: string) =>
    apiClient.get<PageResponse<SearchResult>>(
      `/api/v1/search?query=${encodeURIComponent(query)}&size=6`,
    ),
}
