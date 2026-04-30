import { apiClient } from './client'
import type { Product, PageResponse, SellerStats } from '@/types'

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

export const productsApi = {
  getAll: (page = 0, size = 20) =>
    apiClient.get<PageResponse<Product>>(`/api/v1/products?page=${page}&size=${size}`),

  getById: (id: string) =>
    apiClient.get<Product>(`/api/v1/products/${id}`),

  getByCategory: (categoryId: string, page = 0, size = 20) =>
    apiClient.get<PageResponse<Product>>(`/api/v1/products/category/${categoryId}?page=${page}&size=${size}`),

  getBySeller: (sellerId: string, page = 0, size = 20) =>
    apiClient.get<PageResponse<Product>>(`/api/v1/products/seller/${sellerId}?page=${page}&size=${size}`),

  getSellerStats: (sellerId: string) =>
    apiClient.get<SellerStats>(`/api/v1/products/seller/${sellerId}/stats`),

  search: (query: string, page = 0, size = 20) =>
    apiClient.get<PageResponse<Product>>(`/api/v1/search?query=${query}&page=${page}&size=${size}`),

  create: (data: CreateProductRequest, sellerId: string) =>
    apiClient.post<Product>('/api/v1/products', data, { 'X-Seller-Id': sellerId }),

  update: (id: string, data: UpdateProductRequest, sellerId: string) =>
    apiClient.put<Product>(`/api/v1/products/${id}`, data, { 'X-Seller-Id': sellerId }),

  delete: (id: string, sellerId: string) =>
    apiClient.delete<void>(`/api/v1/products/${id}`, { 'X-Seller-Id': sellerId }),

  uploadImage: (file: File) => uploadImage(file),
}