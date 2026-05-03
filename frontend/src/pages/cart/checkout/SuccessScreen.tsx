import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function SuccessScreen() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-5xl">🎉</div>
      <h2 className="text-2xl font-bold">Siparişiniz alındı!</h2>
      <p className="text-muted-foreground">Siparişiniz başarıyla oluşturuldu.</p>
      <Button onClick={() => navigate({ to: '/orders' })}>Siparişlerimi gör</Button>
    </div>
  )
}
