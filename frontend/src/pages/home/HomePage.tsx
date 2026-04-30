import { HeroSection } from './sections/HeroSection'
import { CategoriesSection } from './sections/CategoriesSection'
import { BestsellerSection } from './sections/BestsellerSection'
import { DealsSection } from './sections/DealsSection'
import { TestimonialsSection } from './sections/TestimonialsSection'
import { InstagramSection } from './sections/InstagramSection'
import { FeaturesSection } from './sections/FeaturesSection'
import { Footer } from '@/components/layout/Footer'

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <CategoriesSection />
      <BestsellerSection />
      <DealsSection />
      <TestimonialsSection />
      <InstagramSection />
      <FeaturesSection />
      <Footer />
    </div>
  )
}
