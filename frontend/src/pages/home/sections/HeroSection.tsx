import { Link } from '@tanstack/react-router'
import { EMPTY_SEARCH } from '@/routes/search'
import {
  Home,
  Wrench,
  BookOpen,
  Cpu,
  Shirt,
  Bike,
  MoreHorizontal,
  ChevronRight,
  Smartphone,
  Watch,
  Footprints,
} from 'lucide-react'

const sidebarCategories = [
  { name: 'Elektronik', icon: Cpu, category: 'ELECTRONICS' },
  { name: 'Giyim', icon: Shirt, category: 'MENS_CLOTHING' },
  { name: 'Ev & Bahçe', icon: Home, category: 'HOME_OUTDOOR' },
  { name: 'Kitap & dergi', icon: BookOpen, category: 'BOOKS' },
  { name: 'Aletler', icon: Wrench, category: 'GARDEN' },
  { name: 'Spor & outdoor', icon: Bike, category: 'SPORTS_FITNESS' },
  { name: 'Saat', icon: Watch, category: 'WATCHES' },
  { name: 'Ayakkabı', icon: Footprints, category: 'SHOES' },
]

const navItems = ['Sıcak fırsatlar', 'Yeni gelenler', 'Çok satanlar', 'Hediye kutuları', 'Yardım']

export function HeroSection() {
  return (
    <section className="bg-[#f6f7f9]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-5">
        <div className="flex gap-4 lg:h-[320px]">

          {/* Left: category sidebar — desktop only */}
          <div className="hidden lg:flex w-[220px] shrink-0 bg-white border border-[#dce0e5] rounded-[6px] overflow-hidden flex-col">
            {sidebarCategories.map(({ name, icon: Icon, category }) => (
              <Link
                key={name}
                to="/search"
                search={{ ...EMPTY_SEARCH, category }}
                className="flex items-center py-[9px] px-4 text-[14px] text-[#525e6f] hover:bg-[#f6f7f9] hover:text-[#3348ff] transition-colors border-b border-[#f0f2f5] last:border-b-0"
              >
                <Icon className="h-4 w-4 text-[#6f7c8e] mr-3 shrink-0" />
                {name}
              </Link>
            ))}
            <Link
              to="/search"
              search={EMPTY_SEARCH}
              className="flex items-center justify-between py-[9px] px-4 text-[14px] text-[#14181f] font-medium hover:bg-[#f6f7f9] transition-colors mt-auto border-t border-[#dce0e5]"
            >
              <span className="flex items-center">
                <MoreHorizontal className="h-4 w-4 text-[#6f7c8e] mr-3 shrink-0" />
                Daha fazla kategori
              </span>
              <ChevronRight className="h-4 w-4 text-[#6f7c8e]" />
            </Link>
          </div>

          {/* Center: hero banner */}
          <div className="flex-1 rounded-[6px] overflow-hidden bg-gradient-to-br from-[#c9e8f5] to-[#e8f4fb] p-6 sm:p-8 flex flex-col justify-center relative min-h-[200px]">
            <p className="text-[13px] sm:text-[15px] text-[#3348ff] font-medium mb-2 uppercase tracking-wide">
              Yeni trend
            </p>
            <h2 className="text-[24px] sm:text-[28px] lg:text-[36px] font-bold text-[#14181f] leading-tight mb-2">
              Elektronik
            </h2>
            <h2 className="text-[24px] sm:text-[28px] lg:text-[36px] font-bold text-[#14181f] leading-tight mb-6">
              ürünler
            </h2>
            <Link
              to="/search"
              search={{ ...EMPTY_SEARCH, category: 'ELECTRONICS' }}
              className="border border-[#14181f] rounded-[6px] px-5 py-2 text-[14px] text-[#14181f] flex items-center gap-2 w-fit hover:bg-[#14181f] hover:text-white transition-all bg-white/60"
            >
              Daha fazla <ChevronRight className="h-4 w-4" />
            </Link>
            <Smartphone className="h-36 w-36 sm:h-48 sm:w-48 lg:h-60 lg:w-60 absolute right-6 bottom-0 opacity-15 text-[#3348ff]" />
          </div>
        </div>
      </div>

      {/* Category nav bar */}
      <div className="bg-white border-y border-[#dce0e5]">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-[44px] flex items-center gap-4 lg:gap-8 overflow-x-auto scrollbar-none">
          <Link
            to="/search"
            search={EMPTY_SEARCH}
            className="flex items-center gap-2 text-[14px] font-semibold text-[#14181f] whitespace-nowrap shrink-0"
          >
            <span className="text-[20px] leading-none">≡</span> Tüm kategoriler
          </Link>
          {navItems.map((item) => (
            <Link
              key={item}
              to="/search"
              search={EMPTY_SEARCH}
              className="text-[14px] text-[#525e6f] hover:text-[#3348ff] transition-colors whitespace-nowrap shrink-0"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
