import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Store, TrendingUp, Users, ShieldCheck } from 'lucide-react'

const perks = [
  {
    icon: Store,
    title: 'Mağazanızı ücretsiz açın',
    description: 'Satıcı hesabınızı oluşturun ve ürünlerinizi dakikalar içinde listeleyin — başlamak ücretsiz.',
  },
  {
    icon: TrendingUp,
    title: 'Milyonlarca alıcıya ulaşın',
    description: 'Ürünleriniz, büyüyen aktif alıcı kitlemize anında görünür olur.',
  },
  {
    icon: Users,
    title: 'İşinizi büyütün',
    description: 'Satıcı analitiği, promosyon araçları ve özel destek ekibine erişin.',
  },
  {
    icon: ShieldCheck,
    title: 'Güvenli ödeme',
    description: 'Her satışta güvenilir ödeme altyapımızla sorunsuz ödeme alın.',
  },
]

export function InstagramSection() {
  return (
    <section className="py-16 bg-card">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Hemen satışa başlayın</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Platformumuzda işini büyüten binlerce satıcıya katılın.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {perks.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/register">
            <Button className="h-12 px-10 rounded-[10px] bg-foreground text-background hover:bg-foreground/85 text-base font-normal">
              Mağazanı aç
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
