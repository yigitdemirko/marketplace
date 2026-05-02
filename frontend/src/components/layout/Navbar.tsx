import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ShoppingBag, UserCircle, LogOut, Menu, X, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useCartDrawer } from '@/store/cartDrawerStore'
import { useToastStore } from '@/store/toastStore'
import { searchApi } from '@/api/search'
import { authApi } from '@/api/auth'
import { formatPrice } from '@/lib/formatPrice'
import { NotificationBell } from './NotificationBell'

const CART_DRAWER_EXCLUDED = ['/cart', '/checkout']

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const showToast = useToastStore((s) => s.show)
  const isBuyer = isAuthenticated && user?.accountType === 'BUYER'
  const totalItems = useCartStore((state) => state.totalItems())
  const navigate = useNavigate()
  const { location } = useRouterState()
  const openDrawer = useCartDrawer((s) => s.open)

  const [query, setQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 250)

  const { data: suggestData } = useQuery({
    queryKey: ['suggest', debouncedQuery],
    queryFn: () => searchApi.suggest(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 10_000,
  })

  const suggestions = suggestData?.content ?? []

  // close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setHighlighted(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCartClick = (e: React.MouseEvent) => {
    const isExcluded =
      CART_DRAWER_EXCLUDED.includes(location.pathname) ||
      location.pathname.startsWith('/orders')
    if (!isExcluded) {
      e.preventDefault()
      openDrawer()
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    setShowSuggestions(false)
    setMobileMenuOpen(false)
    if (!q) return
    navigate({
      to: '/search',
      search: () => ({ q, category: undefined, brand: undefined, priceMin: undefined, priceMax: undefined, sort: undefined, page: undefined }),
    })
  }

  const handleSuggestionClick = useCallback((name: string) => {
    setQuery(name)
    setShowSuggestions(false)
    setHighlighted(-1)
    navigate({
      to: '/search',
      search: () => ({ q: name, category: undefined, brand: undefined, priceMin: undefined, priceMax: undefined, sort: undefined, page: undefined }),
    })
  }, [navigate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, -1))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      handleSuggestionClick(suggestions[highlighted].name)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlighted(-1)
    }
  }

  const isDropdownVisible = showSuggestions && debouncedQuery.trim().length >= 2 && suggestions.length > 0

  return (
    <nav className="bg-white border-b border-[#dce0e5] sticky top-0 z-50">
      {/* Main bar */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-[64px] flex items-center gap-4 lg:gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-[#3348ff] rounded-[6px] w-8 h-8 flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-bold text-[#14181f] text-[16px]">Bilbo's</span>
        </Link>

        {/* Desktop search bar with autocomplete */}
        <div ref={searchRef} className="hidden lg:block flex-1 relative">
          <form
            onSubmit={handleSearch}
            className="flex border border-[#3348ff] rounded-[6px] h-10 overflow-hidden"
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
                setHighlighted(-1)
              }}
              onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Ürün ara"
              autoComplete="off"
              className="flex-1 px-3 text-[15px] text-[#14181f] placeholder:text-[#6f7c8e] outline-none border-none bg-transparent"
            />
            <button
              type="submit"
              className="bg-[#3348ff] hover:bg-[#2236e0] text-white px-4 h-full flex items-center gap-1.5 text-[15px] font-medium transition-colors"
            >
              <Search className="h-4 w-4" />
              Ara
            </button>
          </form>

          {/* Suggestions dropdown */}
          {isDropdownVisible && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-[#dce0e5] rounded-[8px] shadow-lg z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s.name) }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === highlighted ? 'bg-[#f0f2ff]' : 'hover:bg-[#f7f8f9]'
                  }`}
                >
                  <div className="w-9 h-9 shrink-0 rounded-[6px] bg-[#f7f8f9] overflow-hidden flex items-center justify-center">
                    {s.images?.[0] ? (
                      <img src={s.images[0]} alt={s.name} className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                      <Search className="h-3.5 w-3.5 text-[#b6c1ca]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[#14181f] truncate">{s.name}</p>
                  </div>
                  <span className="text-[13px] text-[#6f7c8e] shrink-0">{formatPrice(s.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop right icons */}
        <div className="hidden lg:flex items-center gap-5 ml-auto shrink-0">
          <Link to="/cart" onClick={handleCartClick} className="flex flex-col items-center gap-0.5 relative">
            <div className="relative">
              <ShoppingBag className="h-6 w-6 text-[#6f7c8e]" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#fa3434] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#6f7c8e]">Sepetim</span>
          </Link>

          {isBuyer ? (
            <div className="flex items-center gap-5">
              <NotificationBell />
              <Link to="/account" className="flex flex-col items-center gap-0.5">
                <UserCircle className="h-6 w-6 text-[#6f7c8e]" />
                <span className="text-[11px] text-[#6f7c8e] max-w-[80px] truncate">
                  {user?.firstName ? `Hoşgeldin ${user.firstName}!` : user?.email?.split('@')[0]}
                </span>
              </Link>
              <button
                onClick={() => { authApi.logout().finally(() => { logout(); showToast('Çıkış yapıldı'); }) }}
                className="flex flex-col items-center gap-0.5 cursor-pointer"
              >
                <LogOut className="h-6 w-6 text-[#6f7c8e]" />
                <span className="text-[11px] text-[#6f7c8e]">Çıkış</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <UserCircle className="h-6 w-6 text-[#6f7c8e]" />
              <div className="flex items-center gap-1">
                <Link to="/login" className="text-[11px] text-[#6f7c8e] hover:text-[#3348ff] transition-colors">
                  Giriş yap
                </Link>
                <span className="text-[11px] text-[#dce0e5]">|</span>
                <Link to="/register" className="text-[11px] text-[#6f7c8e] hover:text-[#3348ff] transition-colors">
                  Kayıt ol
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Mobile right: cart + hamburger */}
        <div className="flex lg:hidden items-center gap-3 ml-auto shrink-0">
          <Link to="/cart" onClick={handleCartClick} className="relative">
            <ShoppingBag className="h-6 w-6 text-[#6f7c8e]" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#fa3434] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                {totalItems}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-1 text-[#14181f]"
            aria-label="Menüyü aç/kapat"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#dce0e5] bg-white px-4 py-4 space-y-4">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün ara"
              className="flex-1 border border-[#dce0e5] rounded-[6px] px-3 h-10 text-[15px] text-[#14181f] placeholder:text-[#6f7c8e] outline-none"
            />
            <button
              type="submit"
              className="bg-[#3348ff] hover:bg-[#2236e0] text-white px-4 h-10 rounded-[6px] text-[15px] font-medium transition-colors"
            >
              Ara
            </button>
          </form>

          {/* Mobile nav links */}
          <div className="flex items-center justify-around border-t border-[#dce0e5] pt-4">
            {isBuyer ? (
              <button
                onClick={() => { authApi.logout().finally(() => { logout(); showToast('Çıkış yapıldı'); setMobileMenuOpen(false) }) }}
                className="flex flex-col items-center gap-1"
              >
                <LogOut className="h-6 w-6 text-[#6f7c8e]" />
                <span className="text-[12px] text-[#6f7c8e]">Çıkış</span>
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center gap-1"
                >
                  <UserCircle className="h-6 w-6 text-[#6f7c8e]" />
                  <span className="text-[12px] text-[#6f7c8e]">Giriş yap</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center gap-1"
                >
                  <UserCircle className="h-6 w-6 text-[#6f7c8e]" />
                  <span className="text-[12px] text-[#6f7c8e]">Kayıt ol</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
