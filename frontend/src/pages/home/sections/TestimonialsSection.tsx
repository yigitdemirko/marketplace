import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Leslie Alexander',
    role: 'Buyer',
    initials: 'LA',
    rating: 5,
    review:
      'Found exactly what I was looking for at a great price. The seller shipped fast and the product matched the description perfectly. Will definitely buy again.',
  },
  {
    name: 'Jacob Jones',
    role: 'Seller',
    initials: 'JJ',
    rating: 5,
    review:
      'As a seller this platform has been amazing. Setting up my store was easy and I started getting orders within days. The buyer base is huge and growing.',
  },
  {
    name: 'Jenny Wilson',
    role: 'Buyer',
    initials: 'JW',
    rating: 4,
    review:
      'Great variety of products across so many categories. I use it for everything from electronics to home goods. Prices are competitive and checkout is smooth.',
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">What our Community say's</h2>
            <p className="text-muted-foreground text-sm mt-1">Trusted by buyers and sellers alike</p>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 border border-foreground/20 rounded flex items-center justify-center hover:border-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="w-9 h-9 bg-foreground text-background rounded flex items-center justify-center">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-card rounded-[10px] p-6 border border-border space-y-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < t.rating ? 'fill-primary text-primary' : 'fill-muted text-muted'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.review}</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
