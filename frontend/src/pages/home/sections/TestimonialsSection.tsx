import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Leyla Aydın',
    role: 'Alıcı',
    initials: 'LA',
    rating: 5,
    review:
      'Aradığımı tam olarak harika bir fiyata buldum. Satıcı hızlı kargoladı ve ürün açıklamayla bire bir uyuştu. Kesinlikle tekrar alışveriş yapacağım.',
  },
  {
    name: 'Cem Yıldız',
    role: 'Satıcı',
    initials: 'CY',
    rating: 5,
    review:
      'Bir satıcı olarak bu platform harika. Mağazamı kurmak çok kolay oldu ve birkaç gün içinde sipariş almaya başladım. Alıcı kitlesi büyük ve sürekli büyüyor.',
  },
  {
    name: 'Zeynep Kaya',
    role: 'Alıcı',
    initials: 'ZK',
    rating: 4,
    review:
      'Çok geniş kategoriler ve ürün çeşitliliği var. Elektronikten ev eşyalarına kadar her şey için kullanıyorum. Fiyatlar rekabetçi ve ödeme akışı sorunsuz.',
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Kullanıcılarımız ne diyor</h2>
            <p className="text-muted-foreground text-sm mt-1">Alıcı ve satıcılar Bilbo's'a güveniyor</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
