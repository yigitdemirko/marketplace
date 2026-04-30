import { HeroSection } from '@/pages/home/sections/HeroSection'
import { FlashSalesSection } from '@/pages/home/sections/FlashSalesSection'
import { CategoriesSection } from '@/pages/home/sections/CategoriesSection'
import { BestsellerSection } from '@/pages/home/sections/BestsellerSection'
import { DealsSection } from '@/pages/home/sections/DealsSection'
import { ExploreProductsSection } from '@/pages/home/sections/ExploreProductsSection'
import { NewArrivalSection } from '@/pages/home/sections/NewArrivalSection'
import { FeaturesSection } from '@/pages/home/sections/FeaturesSection'
import { Footer } from '@/components/layout/Footer'

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <FlashSalesSection />
      <CategoriesSection />
      <BestsellerSection />
      <DealsSection />
      <ExploreProductsSection />
      <NewArrivalSection />
      <FeaturesSection />
      <Footer />
    </div>
  )
}
