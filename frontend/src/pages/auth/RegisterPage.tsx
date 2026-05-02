import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const heroImage = 'https://www.figma.com/api/mcp/asset/4049e18f-25b0-4761-8425-d100dd14592c'

const inputClass = 'h-14 rounded-[10px] border-foreground/25 px-4 text-base focus-visible:ring-primary'

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await authApi.registerBuyer(form)
      localStorage.setItem('token', user.token)
      setAuth(user)
      const params = new URLSearchParams(window.location.search)
      navigate({ to: params.get('redirect') ?? '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
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
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      </div>

      <div className="flex flex-1 flex-col justify-center overflow-y-auto bg-card px-8 py-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-[445px] mx-auto space-y-8">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-foreground">Hesap oluştur</h1>
            <p className="text-base text-muted-foreground">Lütfen bilgilerinizi girin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs text-foreground">
                    Ad
                  </Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Robert"
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs text-foreground">
                    Soyad
                  </Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Fox"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-foreground">
                  E-posta adresi
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="robertfox@example.com"
                  required
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-foreground">
                  Şifre
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                  className="size-5 rounded accent-primary cursor-pointer"
                />
                <span className="text-base text-foreground">
                  <span className="font-bold">Kullanım koşullarını</span> kabul ediyorum
                </span>
              </label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-[10px] bg-foreground text-background hover:bg-foreground/85 text-base font-normal"
            >
              {loading ? 'Hesap oluşturuluyor...' : 'Kayıt ol'}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Zaten hesabınız var mı?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                Giriş yap
              </a>
            </p>

            <p className="text-sm text-center text-muted-foreground">
              Platformumuzda satış yapmak ister misiniz?{' '}
              <a href="/seller/register" className="text-primary hover:underline font-medium">
                Satıcı olarak kayıt ol
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
