import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useCountdown } from '@/pages/home/hooks/useCountdown'

const TARGET = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

export function DealsSection() {
  const { days, hours, mins, secs } = useCountdown(TARGET)

  return (
    <section className="py-16 bg-foreground text-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <span className="w-5 h-10 rounded bg-primary block shrink-0" />
              <span className="text-primary font-semibold text-sm">Categories</span>
            </div>
            <h2 className="text-4xl font-semibold text-background leading-tight">
              Enhance Your<br />Music Experience
            </h2>

            <div className="flex gap-6">
              {[
                { value: days, label: 'Days' },
                { value: hours, label: 'Hours' },
                { value: mins, label: 'Mins' },
                { value: secs, label: 'Secs' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                    <span className="text-xl font-bold text-foreground tabular-nums">
                      {String(value).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-xs text-background/60 mt-2">{label}</p>
                </div>
              ))}
            </div>

            <Link
              to="/search"
              className="inline-flex items-center gap-2 h-14 px-12 rounded bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Buy Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right: decorative */}
          <div className="relative w-[400px] h-[300px] hidden lg:flex items-center justify-center shrink-0">
            <div className="absolute w-64 h-64 rounded-full bg-background/10" />
            <div className="absolute w-48 h-48 rounded-full bg-background/5" />
            <span className="text-8xl">🎵</span>
          </div>
        </div>
      </div>
    </section>
  )
}
