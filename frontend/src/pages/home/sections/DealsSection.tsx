import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const TARGET = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

const dealImage = 'https://www.figma.com/api/mcp/asset/4049e18f-25b0-4761-8425-d100dd14592c'

function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now())
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      mins: Math.floor((diff / (1000 * 60)) % 60),
      secs: Math.floor((diff / 1000) % 60),
    }
  }
  const [time, setTime] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

export function DealsSection() {
  const { days, hours, mins, secs } = useCountdown(TARGET)

  return (
    <section className="py-16 bg-card">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="space-y-7">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-3">Deals of the Month</h2>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                It is a long established fact that a reader will be distracted by the readable
                content of a page when looking at its layout. The point of using placeholder text.
              </p>
            </div>

            <div className="flex gap-4">
              {[
                { value: days, label: 'Days' },
                { value: hours, label: 'Hours' },
                { value: mins, label: 'Mins' },
                { value: secs, label: 'Secs' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="w-16 h-16 border-2 border-foreground rounded flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground tabular-nums">
                      {String(value).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
                </div>
              ))}
            </div>

            <Link to="/search">
              <Button className="h-12 px-8 rounded-[10px] bg-foreground text-background hover:bg-foreground/85 text-base font-normal gap-2">
                View All Products <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Right: image */}
          <div className="relative h-[420px] rounded-[10px] overflow-hidden bg-muted hidden lg:block">
            <img
              src={dealImage}
              alt="Deals of the month"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
