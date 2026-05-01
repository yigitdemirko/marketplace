import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const heroImage = 'https://www.figma.com/api/mcp/asset/4049e18f-25b0-4761-8425-d100dd14592c'

const inputClass = 'h-14 rounded-[10px] border-foreground/25 px-4 text-base focus-visible:ring-primary'

export function SellerRegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    storeName: '',
    taxNumber: '',
    phone: '',
  })

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await authApi.registerSeller(form)
      localStorage.setItem('token', user.token)
      setAuth(user)
      const params = new URLSearchParams(window.location.search)
      navigate({ to: params.get('redirect') ?? '/seller' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#3348ff] rounded-[6px] w-8 h-8 flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-[#14181f] text-[16px]">Seller Panel</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Create Seller Account</h1>
            <p className="text-base text-muted-foreground">Start selling on Bilbo's</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="storeName" className="text-xs text-foreground">
                  Store Name
                </Label>
                <Input
                  id="storeName"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  placeholder="My Store"
                  required
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="store@example.com"
                  required
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-foreground">
                  Password
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

              <div className="space-y-1.5">
                <Label htmlFor="taxNumber" className="text-xs text-foreground">
                  Tax Number
                </Label>
                <Input
                  id="taxNumber"
                  value={form.taxNumber}
                  onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                  placeholder="1234567890"
                  required
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs text-foreground">
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+90 555 000 0000"
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
                  I agree to the <span className="font-bold">Terms & Conditions</span>
                </span>
              </label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-[10px] bg-foreground text-background hover:bg-foreground/85 text-base font-normal"
            >
              {loading ? 'Creating account...' : 'Create Seller Account'}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have a seller account?{' '}
              <a href="/seller/login" className="text-primary hover:underline font-medium">
                Login
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
