// Maps known backend English error messages to Turkish.
// Safety net for services not yet localized; user-service messages are
// already TR at the source so this is mostly forward-compatible.
const MAP: Record<string, string> = {
  'Invalid email or password': 'E-posta veya şifre hatalı',
  'Email already exists': 'Bu e-posta zaten kayıtlı',
  'Invalid or expired refresh token': 'Geçersiz veya süresi dolmuş oturum',
  'Refresh token already revoked': 'Oturum zaten sonlandırılmış',
  'Refresh token not found': 'Oturum bulunamadı',
  'User not found': 'Kullanıcı bulunamadı',
  'An unexpected error occurred': 'Beklenmeyen bir hata oluştu',
  'An error occurred': 'Bir hata oluştu',
  'Session expired': 'Oturumunuz sona erdi',
  'Order not found': 'Sipariş bulunamadı',
  'Product not found': 'Ürün bulunamadı',
  'Insufficient stock': 'Yetersiz stok',
  'Unauthorized': 'Yetkisiz işlem',
}

export function translateError(message: string | undefined | null): string {
  if (!message) return 'Bir hata oluştu'
  return MAP[message] ?? message
}
