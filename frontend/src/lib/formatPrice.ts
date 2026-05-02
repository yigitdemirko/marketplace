export function formatPrice(amount: number | string | undefined | null): string {
  const num = Number(amount ?? 0)
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(num)
}
