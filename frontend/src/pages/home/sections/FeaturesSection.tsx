import { Truck, Headphones, ShieldCheck } from 'lucide-react'

const features = [
  {
    icon: Truck,
    title: 'FREE AND FAST DELIVERY',
    description: 'Free delivery for all orders over $140',
  },
  {
    icon: Headphones,
    title: '24/7 CUSTOMER SERVICE',
    description: 'Friendly 24/7 customer support',
  },
  {
    icon: ShieldCheck,
    title: 'MONEY BACK GUARANTEE',
    description: 'We return money within 30 days',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-12 lg:gap-24">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center ring-8 ring-foreground/5">
                <Icon className="h-7 w-7 text-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm tracking-wide">{title}</p>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
