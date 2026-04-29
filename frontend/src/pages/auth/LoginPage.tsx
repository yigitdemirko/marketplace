import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const heroImage = 'https://www.figma.com/api/mcp/asset/4803ceb1-b82f-484f-8c5f-05d6e893a3b0'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await authApi.login({ email, password })
      localStorage.setItem('token', user.token)
      setAuth(user)

      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect')
      navigate({ to: redirect ?? '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: Hero Image */}
      <div className="hidden lg:block relative w-[58%] shrink-0 bg-[#f0eeeb] overflow-hidden">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-[center_15%]"
        />
      </div>

      {/* Right: Login Form */}
      <div className="flex flex-1 flex-col justify-center bg-card px-8 py-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-[445px] mx-auto space-y-8">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-foreground">Welcome 👋</h1>
            <p className="text-base text-muted-foreground">Please login here</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="robertfox@example.com"
                  required
                  className="h-14 rounded-[10px] border-foreground/25 px-4 text-base focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-foreground">
                  Password
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-5 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-base text-foreground">Remember Me</span>
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm text-foreground hover:text-primary transition-colors"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-[10px] bg-foreground text-background hover:bg-foreground/85 text-base font-normal"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <a href="/register" className="text-primary hover:underline font-medium">
                Register
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
