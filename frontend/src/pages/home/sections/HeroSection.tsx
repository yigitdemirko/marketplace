import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const heroImage = 'https://www.figma.com/api/mcp/asset/4803ceb1-b82f-484f-8c5f-05d6e893a3b0'

export function HeroSection() {
  return (
    <section className="bg-background overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="flex items-center min-h-[580px] relative">
          {/* Left content */}
          <div className="relative z-10 max-w-[480px] py-16">
            <p className="italic text-muted-foreground text-base mb-3">Classic Exclusive</p>
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
              Women's<br />Collection
            </h1>
            <p className="text-2xl font-medium text-primary mb-8">UPTO 40% OFF</p>
            <Link to="/search">
              <Button className="h-12 px-8 rounded-[10px] bg-foreground text-background hover:bg-foreground/85 text-base font-normal gap-2">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Faded background text */}
          <span className="absolute right-[260px] top-1/2 -translate-y-1/2 text-[180px] font-extrabold text-foreground/[0.04] select-none pointer-events-none leading-none hidden lg:block">
            BEST
          </span>

          {/* Right: model image */}
          <div className="absolute right-0 top-0 h-full w-[52%] hidden lg:block">
            <img
              src={heroImage}
              alt="Women's Collection"
              className="w-full h-full object-cover object-[center_10%]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
