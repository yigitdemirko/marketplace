import { Truck, RefreshCcw, Headphones, CreditCard } from 'lucide-react'

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'Free shipping for orders above $150',
  },
  {
    icon: RefreshCcw,
    title: 'Money Guarantee',
    description: 'Within 30 days for an exchange',
  },
  {
    icon: Headphones,
    title: 'Online Support',
    description: '24 hours a day, 7 days a week',
  },
  {
    icon: CreditCard,
    title: 'Flexible Payment',
    description: 'Pay with multiple credit cards',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-12 bg-background border-t border-border">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
