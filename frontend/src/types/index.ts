export interface User {
    userId: string
    email: string
    accountType: 'BUYER' | 'SELLER'
    token: string
  }
  
  export interface Product {
    id: string
    sellerId: string
    name: string
    description: string
    price: number
    stock: number
    categoryId: string
    images: string[]
    attributes: Record<string, string>
    active: boolean
    createdAt: string
    updatedAt: string
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