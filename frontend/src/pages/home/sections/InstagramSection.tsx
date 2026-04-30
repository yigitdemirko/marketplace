import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Store, TrendingUp, Users, ShieldCheck } from 'lucide-react'

const perks = [
  {
    icon: Store,
    title: 'Open Your Store Free',
    description: 'Create your seller account and list products in minutes — no fees to get started.',
  },
  {
    icon: TrendingUp,
    title: 'Reach Millions of Buyers',
    description: 'Your products are instantly visible to our growing base of active shoppers.',
  },
  {
    icon: Users,
    title: 'Grow Your Business',
    description: 'Access seller analytics, promotions tools, and a dedicated support team.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    description: 'Get paid reliably with our trusted payment infrastructure on every sale.',
  },
]

export function InstagramSection() {
  return (
    <section className="py-16 bg-card">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Start Selling Today</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join thousands of sellers already growing their business on our platform.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
              Open Your Store
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
