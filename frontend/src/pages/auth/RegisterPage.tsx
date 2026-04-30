import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const heroImage = 'https://www.figma.com/api/mcp/asset/4049e18f-25b0-4761-8425-d100dd14592c'

type UserType = 'buyer' | 'seller'

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState<UserType>('buyer')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [buyerForm, setBuyerForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
  })

  const [sellerForm, setSellerForm] = useState({
    email: '', password: '', storeName: '', taxNumber: '', phone: '',
  })

  const handleUserTypeChange = (type: UserType) => {
    setUserType(type)
    setError('')
  }

  const handleBuyerRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await authApi.registerBuyer(buyerForm)
      localStorage.setItem('token', user.token)
      setAuth(user)
      const params = new URLSearchParams(window.location.search)
      navigate({ to: params.get('redirect') ?? '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSellerRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await authApi.registerSeller(sellerForm)
      localStorage.setItem('token', user.token)
      setAuth(user)
      const params = new URLSearchParams(window.location.search)
      navigate({ to: params.get('redirect') ?? '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'h-14 rounded-[10px] border-foreground/25 px-4 text-base focus-visible:ring-primary'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Hero Image */}
      <div className="hidden lg:block relative w-[58%] shrink-0 bg-[#f0eeeb] overflow-hidden">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      </div>

      {/* Right: Register Form */}
      <div className="flex flex-1 flex-col justify-center overflow-y-auto bg-card px-8 py-12 lg:px-16 xl:px-24">
        <div className="w-full max-w-[445px] mx-auto space-y-8">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-foreground">Create New Account</h1>
            <p className="text-base text-muted-foreground">Please enter details</p>
          </div>

          {/* Buyer / Seller toggle */}
          <div className="flex rounded-[10px] border border-foreground/25 p-1 gap-1">
            <button
              type="button"
              onClick={() => handleUserTypeChange('buyer')}
              className={`flex-1 h-11 rounded-[7px] text-sm font-medium transition-all ${
                userType === 'buyer'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={() => handleUserTypeChange('seller')}
              className={`flex-1 h-11 rounded-[7px] text-sm font-medium transition-all ${
                userType === 'seller'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Seller
            </button>
          </div>

          {userType === 'buyer' ? (
            <form onSubmit={handleBuyerRegister} className="space-y-7">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs text-foreground">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={buyerForm.firstName}
                      onChange={(e) => setBuyerForm({ ...buyerForm, firstName: e.target.value })}
                      placeholder="Robert"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs text-foreground">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={buyerForm.lastName}
                      onChange={(e) => setBuyerForm({ ...buyerForm, lastName: e.target.value })}
                      placeholder="Fox"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={buyerForm.email}
                    onChange={(e) => setBuyerForm({ ...buyerForm, email: e.target.value })}
                    placeholder="robertfox@example.com"
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
                    value={buyerForm.password}
                    onChange={(e) => setBuyerForm({ ...buyerForm, password: e.target.value })}
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
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <a href="/login" className="text-primary hover:underline font-medium">
                  Login
                </a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSellerRegister} className="space-y-7">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="storeName" className="text-xs text-foreground">
                    Store Name
                  </Label>
                  <Input
                    id="storeName"
                    value={sellerForm.storeName}
                    onChange={(e) => setSellerForm({ ...sellerForm, storeName: e.target.value })}
                    placeholder="My Store"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sellerEmail" className="text-xs text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="sellerEmail"
                    type="email"
                    value={sellerForm.email}
                    onChange={(e) => setSellerForm({ ...sellerForm, email: e.target.value })}
                    placeholder="store@example.com"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sellerPassword" className="text-xs text-foreground">
                    Password
                  </Label>
                  <Input
                    id="sellerPassword"
                    type="password"
                    value={sellerForm.password}
                    onChange={(e) => setSellerForm({ ...sellerForm, password: e.target.value })}
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
                    value={sellerForm.taxNumber}
                    onChange={(e) => setSellerForm({ ...sellerForm, taxNumber: e.target.value })}
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
                    value={sellerForm.phone}
                    onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
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
                {loading ? 'Creating account...' : 'Sign Up as Seller'}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <a href="/login" className="text-primary hover:underline font-medium">
                  Login
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
