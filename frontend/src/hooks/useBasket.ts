import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { basketApi, type BasketItem } from '@/api/basket'

export const BASKET_QUERY_KEY = ['basket'] as const

export interface UnifiedBasketItem {
  productId: string
  quantity: number
  name: string
  imageUrl: string | null
  brand: string | null
  sellerId: string | null
  currentPrice: number
  lineTotal: number
  availableStock: number | null
  available: boolean
  unavailableReason: string | null
}

export interface UseBasketResult {
  items: UnifiedBasketItem[]
  totalItems: number
  totalAmount: number
  isAnonymous: boolean
  hydrated: boolean
  isLoading: boolean
}

function fromServer(item: BasketItem): UnifiedBasketItem {
  return {
    productId: item.productId,
    quantity: item.quantity,
    name: item.name ?? '(unavailable)',
    imageUrl: item.imageUrl,
    brand: item.brand,
    sellerId: item.sellerId,
    currentPrice: item.currentPrice ?? 0,
    lineTotal: item.lineTotal ?? 0,
    availableStock: item.availableStock,
    available: item.available,
    unavailableReason: item.unavailableReason,
  }
}

export function useBasket(): UseBasketResult {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const localItems = useCartStore((s) => s.items)

  const query = useQuery({
    queryKey: BASKET_QUERY_KEY,
    queryFn: () => basketApi.get(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  if (isAuthenticated) {
    const data = query.data
    const items = (data?.items ?? []).map(fromServer)
    return {
      items,
      totalItems: data?.totalItems ?? 0,
      totalAmount: data?.totalAmount ?? 0,
      isAnonymous: false,
      hydrated: data?.hydrated ?? true,
      isLoading: query.isLoading,
    }
  }

  const items: UnifiedBasketItem[] = localItems.map((it) => ({
    productId: it.productId,
    quantity: it.quantity,
    name: it.name,
    imageUrl: it.image ?? null,
    brand: null,
    sellerId: it.sellerId,
    currentPrice: it.price,
    lineTotal: it.price * it.quantity,
    availableStock: null,
    available: true,
    unavailableReason: null,
  }))
  const totalAmount = items.reduce((sum, i) => sum + i.lineTotal, 0)
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  return { items, totalItems, totalAmount, isAnonymous: true, hydrated: true, isLoading: false }
}

export interface AddItemArgs {
  productId: string
  quantity: number
  // Snapshot needed for anonymous users
  snapshot?: { name: string; price: number; sellerId: string; image?: string }
}

export function useAddBasketItem() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const localAdd = useCartStore((s) => s.addItem)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, quantity, snapshot }: AddItemArgs) => {
      if (isAuthenticated) {
        await basketApi.addItem(productId, quantity)
        return
      }
      if (!snapshot) {
        throw new Error('Anonymous add requires snapshot')
      }
      localAdd({
        productId,
        sellerId: snapshot.sellerId,
        name: snapshot.name,
        price: snapshot.price,
        image: snapshot.image,
        quantity,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BASKET_QUERY_KEY })
    },
  })
}

export function useSetBasketItem() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const localUpdate = useCartStore((s) => s.updateQuantity)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      if (isAuthenticated) {
        await basketApi.setItem(productId, quantity)
        return
      }
      localUpdate(productId, quantity)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BASKET_QUERY_KEY })
    },
  })
}

export function useRemoveBasketItem() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const localRemove = useCartStore((s) => s.removeItem)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      if (isAuthenticated) {
        await basketApi.removeItem(productId)
        return
      }
      localRemove(productId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BASKET_QUERY_KEY })
    },
  })
}

export function useClearBasket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const localClear = useCartStore((s) => s.clearCart)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        await basketApi.clear()
        return
      }
      localClear()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BASKET_QUERY_KEY })
    },
  })
}
