import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { sellerPath } from '@/lib/sellerBase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const heroImage = 'https://www.figma.com/api/mcp/asset/4803ceb1-b82f-484f-8c5f-05d6e893a3b0'

export function SellerLoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await authApi.login({ email, password })

      if (user.accountType !== 'SELLER') {
        setError('Bu e-posta bir alıcı hesabına kayıtlı. Lütfen alıcı giriş sayfasını kullanın.')
        return
      }

      localStorage.setItem('token', user.token)
      setAuth(user)

      const params = new URLSearchParams(window.location.search)
      navigate({ to: (params.get('redirect') ?? sellerPath('')) as '/seller' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block relative w-[58%] shrink-0 bg-[#f0eeeb] overflow-hidden">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-[center_15%]"
        />
      </div>

      <div className="flex flex-1 flex-col justify-center overflow-y-auto bg-card px-8 py-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-[445px] mx-auto space-y-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#3348ff] rounded-[6px] w-8 h-8 flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-[#14181f] text-[16px]">Satıcı Paneli</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Satıcı girişi</h1>
            <p className="text-base text-muted-foreground">Mağazanızı yönetmek için giriş yapın</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-foreground">
                  E-posta adresi
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="magaza@ornek.com"
                  required
                  className="h-14 rounded-[10px] border-foreground/25 px-4 text-base focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-foreground">
                  Şifre
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 rounded-[10px] border-foreground/25 px-4 text-base focus-visible:ring-primary"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-[10px] bg-foreground text-background hover:bg-foreground/85 text-base font-normal"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Satıcı hesabınız yok mu?{' '}
              <a href="/seller/register" className="text-primary hover:underline font-medium">
                Satıcı olarak kayıt ol
              </a>
            </p>

            <p className="text-sm text-center text-muted-foreground">
              Alışveriş mi yapacaksınız?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                Alıcı girişi
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
