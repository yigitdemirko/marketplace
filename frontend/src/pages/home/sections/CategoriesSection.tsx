import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const categories = [
  { name: 'Casual Men', items: 12, bg: 'bg-secondary' },
  { name: "Women's Bags", items: 24, bg: 'bg-accent/40' },
  { name: 'Ethnic Shop', items: 18, bg: 'bg-primary/15' },
  { name: 'Kids Wear', items: 9, bg: 'bg-muted' },
]

export function CategoriesSection() {
  return (
    <section className="py-16 bg-card">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">Shop by Categories</h2>
          <div className="flex gap-2">
            <button className="w-9 h-9 border border-foreground/20 rounded flex items-center justify-center hover:border-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="w-9 h-9 bg-foreground text-background rounded flex items-center justify-center">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link to="/search" key={cat.name} className="group">
              <div className={`rounded-[10px] overflow-hidden ${cat.bg} aspect-[3/4] mb-3 flex items-end`}>
                <div className="w-full p-4 bg-gradient-to-t from-background/50 to-transparent">
                  <p className="text-sm text-muted-foreground">{cat.items} Items</p>
                </div>
              </div>
              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                {cat.name}
              </p>
              <p className="text-sm text-primary mt-0.5">Shop Now →</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
