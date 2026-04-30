import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Leslie Alexander',
    initials: 'LA',
    rating: 4,
    review:
      'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more.',
  },
  {
    name: 'Jacob Jones',
    initials: 'JJ',
    rating: 5,
    review:
      'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more.',
  },
  {
    name: 'Jenny Wilson',
    initials: 'JW',
    rating: 4,
    review:
      'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more.',
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-foreground">What our Customer say's</h2>
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
                <p className="font-medium text-foreground text-sm">{t.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
