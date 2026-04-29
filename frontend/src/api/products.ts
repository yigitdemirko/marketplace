import { apiClient } from './client'
import type { Product, PageResponse } from '@/types'

export interface CreateProductRequest {
  name: string
  description: string
  price: number
  stock: number
  categoryId: string
  images?: string[]
  attributes?: Record<string, string>
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  price?: number
  stock?: number
  categoryId?: string
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

  search: (query: string, page = 0, size = 20) =>
    apiClient.get<PageResponse<Product>>(`/api/v1/search?query=${query}&page=${page}&size=${size}`),

  create: (data: CreateProductRequest, sellerId: string) =>
    apiClient.post<Product>('/api/v1/products', data, { 'X-Seller-Id': sellerId }),

  update: (id: string, data: UpdateProductRequest, sellerId: string) =>
    apiClient.put<Product>(`/api/v1/products/${id}`, data, { 'X-Seller-Id': sellerId }),

  delete: (id: string, sellerId: string) =>
    apiClient.delete<void>(`/api/v1/products/${id}`, { 'X-Seller-Id': sellerId }),
}