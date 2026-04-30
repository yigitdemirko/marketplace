import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Smartphone, Monitor, Watch, Camera, Headphones, Gamepad2 } from 'lucide-react'

const categories = [
  { name: 'Phones', icon: Smartphone },
  { name: 'Computers', icon: Monitor },
  { name: 'SmartWatch', icon: Watch },
  { name: 'Camera', icon: Camera },
  { name: 'HeadPhones', icon: Headphones },
  { name: 'Gaming', icon: Gamepad2 },
]

export function CategoriesSection() {
  return (
    <section className="py-10 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-5 h-10 rounded bg-primary block shrink-0" />
              <span className="text-primary font-semibold text-sm">Categories</span>
            </div>
            <h2 className="text-3xl font-semibold text-foreground">Browse By Category</h2>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="w-11 h-11 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="w-11 h-11 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {categories.map(({ name, icon: Icon }) => (
            <Link
              to="/search"
              key={name}
              className="group border border-border rounded flex flex-col items-center justify-center py-6 gap-3 hover:bg-primary hover:border-primary transition-all"
            >
              <Icon className="h-10 w-10 text-foreground group-hover:text-white transition-colors" />
              <span className="text-sm text-foreground group-hover:text-white transition-colors">
                {name}
              </span>
            </Link>
          ))}
        </div>

        <div className="border-b border-border mt-10" />
      </div>
    </section>
  )
}
