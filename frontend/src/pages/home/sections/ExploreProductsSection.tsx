import { Truck, Headphones, ShieldCheck } from 'lucide-react'

const features = [
  {
    icon: Truck,
    title: 'Free Worldwide Shipping',
    subtitle: 'On orders over $100',
  },
  {
    icon: Headphones,
    title: '24/7 Customer Support',
    subtitle: 'Always here to help',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    subtitle: '100% protected transactions',
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-[#f6f7f9] border-t border-[#dce0e5]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, subtitle }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="bg-[#14181f] rounded-full p-3 shrink-0">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-[15px] text-[#14181f]">{title}</p>
                <p className="text-[14px] text-[#6f7c8e]">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Keep old export for backward compatibility
export function ExploreProductsSection() {
  return <FeaturesSection />
}
