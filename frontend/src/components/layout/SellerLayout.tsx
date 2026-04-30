import { Outlet, useRouterState, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import {
  LayoutDashboard,
  Truck,
  Package2,
  FileSpreadsheet,
  CircleDollarSign,
  Users,
  Tag,
  BarChart2,
  Settings,
  Bell,
  UserCircle,
  Search,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/seller' },
  { label: 'All orders', icon: Truck, to: '/seller/orders' },
  { label: 'Products', icon: Package2, to: '/seller/products' },
  { label: 'Invoices', icon: FileSpreadsheet, to: '/seller/invoices' },
  { label: 'Finance', icon: CircleDollarSign, to: '/seller/finance' },
  { label: 'Customers', icon: Users, to: '/seller/customers' },
  { label: 'Discounts', icon: Tag, to: '/seller/discounts' },
  { label: 'Reports', icon: BarChart2, to: '/seller/reports' },
]

const BOTTOM_NAV = [
  { label: 'Settings', icon: Settings, to: '/seller/settings' },
]

const PAGE_TITLES: Record<string, string> = {
  '/seller': 'Dashboard',
  '/seller/orders': 'All orders',
  '/seller/products': 'Products',
  '/seller/products/new': 'Add product',
  '/seller/invoices': 'Invoices',
  '/seller/finance': 'Finance',
  '/seller/customers': 'Customers',
  '/seller/discounts': 'Discounts',
  '/seller/reports': 'Reports',
  '/seller/settings': 'Settings',
}

export function SellerLayout() {
  const { location } = useRouterState()
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const isSeller = isAuthenticated && user?.accountType === 'SELLER'

  useEffect(() => {
    if (!isSeller) {
      navigate({ to: '/seller/login', replace: true })
    }
  }, [isSeller, navigate])

  if (!isSeller) return null

  const pathname = location.pathname
  const pageTitle = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || pathname.startsWith(k + '/'))
    ? PAGE_TITLES[
        Object.keys(PAGE_TITLES)
          .sort((a, b) => b.length - a.length)
          .find((k) => pathname === k || pathname.startsWith(k + '/'))!
      ]
    : 'Seller Panel'

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col flex-shrink-0 w-[240px] bg-[#f6f7f9] border-r border-[#dce0e5]">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-[#dce0e5]">
          <div className="bg-[#3348ff] rounded-[6px] w-8 h-8 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-semibold text-[#14181f] text-[16px]">Seller Panel</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 mt-1 overflow-y-auto">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
              const isActive =
                to === '/seller' ? pathname === '/seller' : pathname.startsWith(to)
              return (
                <li key={to}>
                  <Link
                    to={to as '/seller'}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[6px] text-[14px] font-medium transition-colors ${
                      isActive
                        ? 'bg-white text-[#3348ff] shadow-sm'
                        : 'text-[#6f7c8e] hover:bg-white hover:text-[#14181f]'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-[#dce0e5] mt-2 pt-2 space-y-0.5">
            {BOTTOM_NAV.map(({ label, icon: Icon, to }) => (
              <li key={to} className="list-none">
                <Link
                  to={to as '/seller'}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[6px] text-[14px] font-medium transition-colors ${
                    pathname === to
                      ? 'bg-white text-[#3348ff] shadow-sm'
                      : 'text-[#6f7c8e] hover:bg-white hover:text-[#14181f]'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top header */}
        <header className="flex items-center gap-3 px-5 h-14 border-b border-[#dce0e5] bg-white shrink-0">
          <h1 className="text-[18px] font-semibold text-[#14181f] hidden sm:block">{pageTitle}</h1>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6f7c8e]" />
              <input
                type="search"
                placeholder="Search"
                className="pl-9 pr-3 h-9 text-[14px] border border-[#dce0e5] rounded-[6px] bg-white focus:outline-none focus:border-[#3348ff] w-[200px]"
              />
            </div>
            <button className="h-9 w-9 flex items-center justify-center border border-[#dce0e5] rounded-[6px] hover:bg-[#f6f7f9] transition-colors">
              <Bell className="h-4 w-4 text-[#6f7c8e]" />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 h-9 px-3 border border-[#dce0e5] rounded-[6px] text-[13px] font-medium text-[#14181f] hover:bg-[#f6f7f9] transition-colors"
            >
              <UserCircle className="h-4 w-4 text-[#6f7c8e]" />
              {user?.email?.split('@')[0] ?? 'My account'}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 lg:p-6 bg-white overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
