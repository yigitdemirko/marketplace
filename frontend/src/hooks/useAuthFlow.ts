import { useQueryClient } from '@tanstack/react-query'
import { basketApi } from '@/api/basket'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { BASKET_QUERY_KEY } from './useBasket'
import type { User } from '@/types'

/**
 * Wraps setAuth/logout with basket merge + cache invalidation behavior.
 * Use these instead of calling useAuthStore.setAuth / logout directly so the
 * server basket and the local anon cart stay in sync.
 */
export function useAuthFlow() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const logoutStore = useAuthStore((s) => s.logout)
  const qc = useQueryClient()

  const onLoginSuccess = async (user: User) => {
    if (user.accountType === 'BUYER') {
      const localItems = useCartStore.getState().items
      if (localItems.length > 0) {
        try {
          await basketApi.merge({
            items: localItems.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
            })),
          })
        } catch (err) {
          console.warn('Basket merge failed, continuing login', err)
        }
        useCartStore.getState().clearCart()
      }
    }
    setAuth(user)
    qc.invalidateQueries({ queryKey: BASKET_QUERY_KEY })
  }

  const onLogout = () => {
    useCartStore.getState().clearCart()
    qc.removeQueries({ queryKey: BASKET_QUERY_KEY })
    logoutStore()
  }

  return { onLoginSuccess, onLogout }
}
