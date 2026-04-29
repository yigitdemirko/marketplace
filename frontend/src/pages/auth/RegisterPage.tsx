import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [buyerForm, setBuyerForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
  })

  const [sellerForm, setSellerForm] = useState({
    email: '', password: '', storeName: '', taxNumber: '', phone: '',
  })

  const handleBuyerRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await authApi.registerBuyer(buyerForm)
      localStorage.setItem('token', user.token)
      setAuth(user)
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSellerRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await authApi.registerSeller(sellerForm)
      localStorage.setItem('token', user.token)
      setAuth(user)
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="buyer">
            <TabsList className="w-full">
              <TabsTrigger value="buyer" className="flex-1">Buyer</TabsTrigger>
              <TabsTrigger value="seller" className="flex-1">Seller</TabsTrigger>
            </TabsList>

            <TabsContent value="buyer">
              <form onSubmit={handleBuyerRegister} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={buyerForm.firstName}
                      onChange={(e) => setBuyerForm({ ...buyerForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={buyerForm.lastName}
                      onChange={(e) => setBuyerForm({ ...buyerForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={buyerForm.email}
                    onChange={(e) => setBuyerForm({ ...buyerForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={buyerForm.password}
                    onChange={(e) => setBuyerForm({ ...buyerForm, password: e.target.value })}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Registering...' : 'Register as Buyer'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="seller">
              <form onSubmit={handleSellerRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Store Name</Label>
                  <Input
                    value={sellerForm.storeName}
                    onChange={(e) => setSellerForm({ ...sellerForm, storeName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={sellerForm.email}
                    onChange={(e) => setSellerForm({ ...sellerForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={sellerForm.password}
                    onChange={(e) => setSellerForm({ ...sellerForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax Number</Label>
                  <Input
                    value={sellerForm.taxNumber}
                    onChange={(e) => setSellerForm({ ...sellerForm, taxNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={sellerForm.phone}
                    onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Registering...' : 'Register as Seller'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="text-sm text-center text-muted-foreground mt-4">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline">
              Login
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}