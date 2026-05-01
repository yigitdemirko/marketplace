export function formatPrice(amount: number | string | undefined | null, locale: 'EN' | 'TR'): string {
  const num = Number(amount ?? 0)
  if (locale === 'TR') {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(num)
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
}
