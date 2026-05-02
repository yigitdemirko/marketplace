import { apiClient } from './client'
import type { Product, PageResponse, SellerStats } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}/api/v1/products/images/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Yükleme başarısız' }))
    throw new Error(error.message ?? 'Yükleme başarısız')
  }

  const data = await response.json()
  return data.url
}

export interface CreateProductRequest {
  name: string
  description: string
  price: number
  stock: number
  category: string
  brand?: string
  images?: string[]
  attributes?: Record<string, string>
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  price?: number
  stock?: number
  category?: string
  brand?: string
  images?: string[]
  attributes?: Record<string, string>
}

export interface SearchFilters {
  query?: string
  categoryId?: string
  brand?: string
  priceMin?: number
  priceMax?: number
}

export const productsApi = {
  getAll: (page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    return apiClient.get<PageResponse<Product>>(`/api/v1/products?${params}`)
  },

  getById: (id: string) =>
    apiClient.get<Product>(`/api/v1/products/${id}`),

  getByCategory: (categoryId: string, page = 0, size = 20) =>
    apiClient.get<PageResponse<Product>>(`/api/v1/products/category/${categoryId}?page=${page}&size=${size}`),

  getBySeller: (sellerId: string, page = 0, size = 20, categoryId?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (categoryId) params.set('categoryId', categoryId)
    return apiClient.get<PageResponse<Product>>(`/api/v1/products/seller/${sellerId}?${params}`)
  },

  getSellerStats: (sellerId: string) =>
    apiClient.get<SellerStats>(`/api/v1/products/seller/${sellerId}/stats`),

  getSellerCategories: (sellerId: string) =>
    apiClient.get<Array<{ categoryId: string; count: number }>>(`/api/v1/products/seller/${sellerId}/categories`),

  search: (query: string, page = 0, size = 20) =>
    apiClient.get<PageResponse<Product>>(`/api/v1/search?query=${query}&page=${page}&size=${size}`),

  searchWithFilters: (filters: SearchFilters, page = 0, size = 9, sort?: string) => {
    const params = new URLSearchParams()
    if (filters.query) params.set('query', filters.query)
    if (filters.categoryId) params.set('categoryId', filters.categoryId)
    if (filters.brand) params.set('brand', filters.brand)
    if (filters.priceMin !== undefined && filters.priceMin > 0) params.set('priceMin', filters.priceMin.toString())
    if (filters.priceMax !== undefined && filters.priceMax < 99000) params.set('priceMax', filters.priceMax.toString())
    if (sort && sort !== 'newest') params.set('sort', sort)
    params.set('page', page.toString())
    params.set('size', size.toString())
    return apiClient.get<PageResponse<Product>>(`/api/v1/search?${params}`)
  },

  create: (data: CreateProductRequest, sellerId: string) =>
    apiClient.post<Product>('/api/v1/products', data, { 'X-Seller-Id': sellerId }),

  update: (id: string, data: UpdateProductRequest, sellerId: string) =>
    apiClient.put<Product>(`/api/v1/products/${id}`, data, { 'X-Seller-Id': sellerId }),

  delete: (id: string, sellerId: string) =>
    apiClient.delete<void>(`/api/v1/products/${id}`, { 'X-Seller-Id': sellerId }),

  uploadImage: (file: File) => uploadImage(file),
}
