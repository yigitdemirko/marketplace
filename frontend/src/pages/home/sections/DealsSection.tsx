import { Link } from '@tanstack/react-router'
import { CheckCircle2 } from 'lucide-react'

const benefits = [
  'Zero setup fees — start for free',
  'Reach millions of buyers worldwide',
  'Secure payments & seller protection',
]

const stats = [
  { number: '10K+', label: 'Sellers' },
  { number: '1M+', label: 'Products' },
  { number: '500K+', label: 'Buyers' },
  { number: '98%', label: 'Satisfaction' },
]

export function SellerCTASection() {
  return (
    <section className="bg-[#1a1a2e] py-12">
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left side */}
          <div>
            <p className="text-[13px] text-[#3348ff] font-semibold uppercase mb-3 tracking-wide">
              Join the marketplace
            </p>
            <h2 className="text-[32px] font-bold text-white leading-snug mb-4">
              Start Selling on<br />Marketplace
            </h2>
            <p className="text-[16px] text-white/70 leading-relaxed mb-8">
              Join thousands of sellers reaching millions of buyers. Set up your store in minutes
              and grow your business.
            </p>

            <ul className="space-y-3 mb-8">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#3348ff] shrink-0" />
                  <span className="text-[15px] text-white/80">{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className="bg-[#3348ff] hover:bg-[#2236e0] text-white h-[48px] px-8 rounded-[8px] font-medium text-[16px] inline-flex items-center gap-2 transition-colors"
            >
              Start selling today
            </Link>
          </div>

          {/* Right side stats */}
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-[12px] p-8 border border-white/20">
              <div className="grid grid-cols-2 gap-6">
                {stats.map(({ number, label }) => (
                  <div key={label} className="text-center">
                    <p className="font-bold text-[28px] text-white">{number}</p>
                    <p className="text-[14px] text-white/60">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Keep old export for backward compatibility
export function DealsSection() {
  return <SellerCTASection />
}
