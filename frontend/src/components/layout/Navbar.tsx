import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ClipboardList, Heart, ShoppingBag, UserCircle, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const isBuyer = isAuthenticated && user?.accountType === 'BUYER'
  const totalItems = useCartStore((state) => state.totalItems())
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All category')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate({ to: '/search', search: { q: query.trim() } })
    } else {
      navigate({ to: '/search' })
    }
  }

  return (
    <nav className="bg-white border-b border-[#dce0e5] sticky top-0 z-50 h-[64px]">
      <div className="max-w-[1280px] mx-auto px-8 h-full flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-[#3348ff] rounded-[6px] w-8 h-8 flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-bold text-[#14181f] text-[16px]">Brandname</span>
        </Link>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="flex flex-1 border border-[#3348ff] rounded-[6px] h-10 overflow-hidden"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find product"
            className="flex-1 px-3 text-[15px] text-[#14181f] placeholder:text-[#6f7c8e] outline-none border-none bg-transparent"
          />
          <div className="w-px bg-[#dce0e5] self-stretch" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border-l border-[#dce0e5] px-3 text-[15px] text-[#525e6f] bg-transparent outline-none cursor-pointer"
          >
            <option>All category</option>
            <option>Electronics</option>
            <option>Clothing</option>
            <option>Home &amp; Outdoor</option>
            <option>Books</option>
            <option>Sports</option>
          </select>
          <button
            type="submit"
            className="bg-[#3348ff] hover:bg-[#2236e0] text-white px-5 h-full text-[15px] font-medium transition-colors"
          >
            Search
          </button>
        </form>

        {/* Right icons */}
        <div className="flex items-center gap-5 ml-auto shrink-0">
          {/* Orders */}
          {isBuyer ? (
            <Link to="/orders" className="flex flex-col items-center gap-0.5 cursor-pointer">
              <ClipboardList className="h-5 w-5 text-[#6f7c8e]" />
              <span className="text-[11px] text-[#6f7c8e]">Orders</span>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <ClipboardList className="h-5 w-5 text-[#6f7c8e]" />
              <span className="text-[11px] text-[#6f7c8e]">Orders</span>
            </div>
          )}

          {/* Saved */}
          <div className="flex flex-col items-center gap-0.5 cursor-pointer">
            <Heart className="h-5 w-5 text-[#6f7c8e]" />
            <span className="text-[11px] text-[#6f7c8e]">Saved</span>
          </div>

          {/* Cart */}
          <Link to="/cart" className="flex flex-col items-center gap-0.5 relative">
            <div className="relative">
              <ShoppingBag className="h-5 w-5 text-[#6f7c8e]" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#fa3434] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#6f7c8e]">My cart</span>
          </Link>

          {/* Account */}
          {isBuyer ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-0.5">
                <UserCircle className="h-5 w-5 text-[#6f7c8e]" />
                <span className="text-[11px] text-[#6f7c8e] max-w-[64px] truncate">
                  {user?.email?.substring(0, 8)}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex flex-col items-center gap-0.5 cursor-pointer"
              >
                <LogOut className="h-5 w-5 text-[#6f7c8e]" />
                <span className="text-[11px] text-[#6f7c8e]">Logout</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex flex-col items-center gap-0.5">
              <UserCircle className="h-5 w-5 text-[#6f7c8e]" />
              <span className="text-[11px] text-[#6f7c8e]">Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
