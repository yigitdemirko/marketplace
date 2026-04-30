import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ShoppingCart, User, LogOut, Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const totalItems = useCartStore((state) => state.totalItems())
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate({ to: '/search', search: { q: query.trim() } })
    } else {
      navigate({ to: '/search' })
    }
  }

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold shrink-0">
          Marketplace
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex flex-1 max-w-2xl">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="flex-1 h-10 rounded-r-none rounded-l-[10px] border-r-0 focus-visible:ring-0 text-sm"
          />
          <Button
            type="submit"
            className="h-10 px-4 rounded-l-none rounded-r-[10px] bg-primary hover:bg-primary/90 text-white shrink-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {isAuthenticated ? (
            <>
              {user?.accountType === 'SELLER' && (
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/seller/products' })}>
                  <Package className="h-4 w-4 mr-1" />
                  My Products
                </Button>
              )}

              {user?.accountType === 'BUYER' && (
                <Link to="/cart">
                  <Button variant="ghost" size="sm" className="relative">
                    <ShoppingCart className="h-4 w-4" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              <Link to="/orders">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  Orders
                </Button>
              </Link>

              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
