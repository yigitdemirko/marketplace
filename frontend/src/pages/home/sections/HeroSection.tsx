import { Link } from '@tanstack/react-router'
import {
  Car,
  Home,
  Wrench,
  BookOpen,
  Cpu,
  Shirt,
  Bike,
  MoreHorizontal,
  ChevronRight,
  Smartphone,
} from 'lucide-react'

const sidebarCategories = [
  { name: 'Automobiles', icon: Car },
  { name: 'Home appliance', icon: Home },
  { name: 'Tools, equipment', icon: Wrench },
  { name: 'Books & magazines', icon: BookOpen },
  { name: 'Electronic gadgets', icon: Cpu },
  { name: 'Clothing and wear', icon: Shirt },
  { name: 'Sports and outdoor', icon: Bike },
]

const navItems = ['Hot offers', 'Services', 'Bestsellers', 'Gift boxes', 'Help']

export function HeroSection() {
  return (
    <section className="bg-[#f6f7f9]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-5 lg:h-[344px]">
          {/* Left: category sidebar */}
          <div className="hidden lg:flex w-[220px] shrink-0 bg-white border border-[#dce0e5] rounded-[6px] overflow-hidden flex-col">
            {sidebarCategories.map(({ name, icon: Icon }) => (
              <Link
                key={name}
                to="/search"
                className="flex items-center justify-between py-2 px-4 text-[15px] text-[#525e6f] hover:bg-[#f6f7f9] transition-colors"
              >
                <span className="flex items-center">
                  <Icon className="h-4 w-4 text-[#6f7c8e] mr-3 shrink-0" />
                  {name}
                </span>
              </Link>
            ))}
            <Link
              to="/search"
              className="flex items-center justify-between py-2 px-4 text-[15px] text-[#14181f] font-medium hover:bg-[#f6f7f9] transition-colors mt-auto border-t border-[#dce0e5]"
            >
              <span className="flex items-center">
                <MoreHorizontal className="h-4 w-4 text-[#6f7c8e] mr-3 shrink-0" />
                More category
              </span>
              <ChevronRight className="h-4 w-4 text-[#6f7c8e]" />
            </Link>
          </div>

          {/* Center: hero banner */}
          <div className="flex-1 rounded-[6px] overflow-hidden bg-gradient-to-br from-[#c9e8f5] to-[#e8f4fb] p-8 flex flex-col justify-center relative min-h-[220px] lg:min-h-0">
            <p className="text-[15px] text-[#525e6f] mb-2">New trending</p>
            <h2 className="text-[22px] lg:text-[32px] font-bold text-[#14181f] leading-tight mb-6">
              Electronic<br />items
            </h2>
            <Link
              to="/search"
              className="border border-[#14181f] rounded-[6px] px-4 py-2 text-[15px] text-[#14181f] flex items-center gap-2 w-fit hover:bg-[#14181f] hover:text-white transition-all bg-transparent"
            >
              Learn more <ChevronRight className="h-4 w-4" />
            </Link>
            <Smartphone className="h-48 w-48 absolute right-8 bottom-0 opacity-20 text-[#3348ff]" />
          </div>

          {/* Right: promo banner */}
          <div className="hidden lg:block w-[260px] shrink-0 rounded-[6px] overflow-hidden relative bg-[#1a1a2e]">
            <div className="absolute inset-0 bg-gradient-to-bl from-[#3348ff]/20 to-transparent pointer-events-none" />
            <div className="relative z-10 p-6 flex flex-col justify-center h-full">
              <p className="text-[13px] text-white/60 mb-2">Sell on</p>
              <h3 className="text-[22px] font-bold text-white leading-tight mb-1">
                Become a Seller
              </h3>
              <p className="text-[15px] text-white/70 mb-6">Start earning today</p>
              <Link
                to="/register"
                className="bg-[#3348ff] hover:bg-[#2236e0] text-white rounded-[6px] px-4 py-2 text-[15px] font-medium w-fit transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Category nav bar */}
      <div className="bg-white border-b border-[#dce0e5]">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-[46px] flex items-center gap-3 lg:gap-6 overflow-x-auto">
          <span className="flex items-center gap-2 text-[15px] font-medium text-[#14181f]">
            <span className="text-[18px] leading-none">≡</span> All category
          </span>
          {navItems.map((item) => (
            <Link
              key={item}
              to="/search"
              className="text-[15px] text-[#525e6f] hover:text-[#3348ff] transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
