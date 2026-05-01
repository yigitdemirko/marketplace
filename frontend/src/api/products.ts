import { apiClient } from './client'
import type { Product, PageResponse, SellerStats, ProductLocale } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function uploadImage(file: File): Promise<string> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}/api/v1/products/images/upload`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }))
    throw new Error(error.message ?? 'Upload failed')
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
  locale: ProductLocale
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
  locale?: ProductLocale
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
  locale?: ProductLocale
}

export const productsApi = {
  getAll: (page = 0, size = 20, locale?: ProductLocale) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (locale) params.set('locale', locale)
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

  getSellerLocales: (sellerId: string) =>
    apiClient.get<Array<{ locale: ProductLocale; count: number }>>(`/api/v1/products/seller/${sellerId}/locales`),

  search: (query: string, page = 0, size = 20) =>
    apiClient.get<PageResponse<Product>>(`/api/v1/search?query=${query}&page=${page}&size=${size}`),

  searchWithFilters: (filters: SearchFilters, page = 0, size = 9, sort?: string) => {
    const params = new URLSearchParams()
    if (filters.query) params.set('query', filters.query)
    if (filters.categoryId) params.set('categoryId', filters.categoryId)
    if (filters.brand) params.set('brand', filters.brand)
    if (filters.priceMin !== undefined && filters.priceMin > 0) params.set('priceMin', filters.priceMin.toString())
    if (filters.priceMax !== undefined && filters.priceMax < 99000) params.set('priceMax', filters.priceMax.toString())
    if (filters.locale) params.set('locale', filters.locale)
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