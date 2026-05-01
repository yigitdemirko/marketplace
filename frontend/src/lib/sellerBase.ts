export const SELLER_BASE = window.location.hostname.startsWith('seller.') ? '' : '/seller'

export function sellerPath(path: string): string {
  const full = SELLER_BASE + path
  return full === '' ? '/' : full
}
