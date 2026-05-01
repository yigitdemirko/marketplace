import { useCartDrawer } from '@/store/cartDrawerStore'
import { useToastStore } from '@/store/toastStore'

const MOBILE_BREAKPOINT = 768

export function useAddedToCartFeedback() {
  const openDrawer = useCartDrawer((s) => s.open)
  const showToast = useToastStore((s) => s.show)

  return () => {
    if (typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT) {
      showToast('Added to cart')
    } else {
      openDrawer()
    }
  }
}
