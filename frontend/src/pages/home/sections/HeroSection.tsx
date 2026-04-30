import { Link } from '@tanstack/react-router'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { useState } from 'react'

const categories = [
  { name: "Woman's Fashion", hasDropdown: true },
  { name: "Men's Fashion", hasDropdown: true },
  { name: 'Electronics' },
  { name: 'Home & Lifestyle' },
  { name: 'Medicine' },
  { name: 'Sports & Outdoor' },
  { name: "Baby's & Toys" },
  { name: 'Groceries & Pets' },
  { name: 'Health & Beauty' },
]

const SLIDE_COUNT = 5

export function HeroSection() {
  const [active, setActive] = useState(0)

  return (
    <section className="bg-background border-b border-border">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left: category sidebar */}
          <aside className="hidden lg:block w-[220px] shrink-0 border-r border-border pr-6">
            <ul className="space-y-3">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <Link
                    to="/search"
                    className="flex items-center justify-between text-sm text-foreground/80 hover:text-foreground transition-colors py-0.5"
                  >
                    <span>{cat.name}</span>
                    {cat.hasDropdown && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          {/* Right: hero banner */}
          <div className="flex-1 relative rounded-[4px] overflow-hidden bg-foreground min-h-[344px] flex items-center">
            <div className="relative z-10 px-12 py-10 max-w-[380px]">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-background text-xs font-bold">🍎</span>
                </div>
                <span className="text-background/80 text-sm">iPhone 14 Series</span>
              </div>
              <h2 className="text-4xl font-semibold text-background leading-tight mb-6">
                Up to 10%<br />off Voucher
              </h2>
              <Link to="/search" className="inline-flex items-center gap-2 text-background text-sm border-b border-background/60 hover:border-background pb-0.5 transition-colors">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Placeholder product visual */}
            <div className="absolute right-0 top-0 h-full w-[55%] flex items-center justify-center opacity-20">
              <div className="w-64 h-64 rounded-full bg-white/10" />
            </div>

            {/* Dots */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`rounded-full transition-all ${
                    i === active
                      ? 'w-5 h-2.5 bg-primary'
                      : 'w-2.5 h-2.5 bg-background/30 hover:bg-background/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
