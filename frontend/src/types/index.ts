export interface User {
    userId: string
    email: string
    accountType: 'BUYER' | 'SELLER'
    storeName?: string
    firstName?: string
    lastName?: string
  }

  export interface SavedAddress {
    id: string
    title: string
    fullName: string
    city: string
    postalCode: string
    addressLine1: string
    addressLine2?: string
    isDefault: boolean
  }

  export interface SavedCard {
    id: string
    alias: string
    cardHolder: string
    last4: string
    expireMonth: string
    expireYear: string
    isDefault: boolean
  }
  
  export interface Product {
    id: string
    sellerId: string
    name: string
    description: string
    price: number
    stock: number
    categoryId: string
    brand?: string
    images: string[]
    attributes: Record<string, string>
    active: boolean
    createdAt: string
    updatedAt: string
  }

  export interface SellerStats {
    total: number
    inStock: number
    outOfStock: number
    lowStock: number
  }

  export type ImportStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED'

  export interface ImportRowError {
    index: number
    productId: string | null
    message: string
  }

  export interface ImportJob {
    id: string
    sellerId: string
    fileName: string
    totalItems: number
    successCount: number
    failureCount: number
    status: ImportStatus
    errors: ImportRowError[]
    createdAt: string
    completedAt: string | null
  }
  
  export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    pageNumber: number
    pageSize: number
    first: boolean
    last: boolean
  }
  
  export interface OrderItem {
    id: string
    productId: string
    sellerId: string
    quantity: number
    unitPrice: number
  }
  
  export interface Order {
    id: string
    userId: string
    status: 'PENDING' | 'STOCK_RESERVING' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
    totalAmount: number
    shippingAddress: string
    idempotencyKey: string
    items: OrderItem[]
    createdAt: string
    updatedAt: string
  }
  
  export interface Payment {
    id: string
    orderId: string
    userId: string
    amount: number
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
    idempotencyKey: string
    iyzicoPaymentId: string
    failureReason: string
    createdAt: string
    updatedAt: string
  }
  
  export interface CartItem {
    productId: string
    sellerId: string
    name: string
    price: number
    quantity: number
    image?: string
  }