import { Link } from '@tanstack/react-router'
import { ShoppingCart, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const totalItems = useCartStore((state) => state.totalItems())

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">
          Marketplace
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/search">
            <Button variant="ghost" size="sm">
              Products
            </Button>
          </Link>

          {isAuthenticated ? (
            <>
              {/* {user?.accountType === 'SELLER' && (
                <Link to="/seller/products">
                  <Button variant="ghost" size="sm">
                    <Package className="h-4 w-4 mr-1" />
                    My Products
                  </Button>
                </Link>
              )} */}

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
                <Button variant="ghost" size="sm">
                  Login
                </Button>
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