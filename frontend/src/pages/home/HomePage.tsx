import { HeroSection } from '@/pages/home/sections/HeroSection'
import { FlashSalesSection } from '@/pages/home/sections/FlashSalesSection'
import { HomeOutdoorSection, ElectronicsSection } from '@/pages/home/sections/CategoriesSection'
import { RecommendedSection } from '@/pages/home/sections/BestsellerSection'
import { SellerCTASection } from '@/pages/home/sections/DealsSection'
import { Footer } from '@/components/layout/Footer'

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <FlashSalesSection />
      <HomeOutdoorSection />
      <ElectronicsSection />
      <RecommendedSection />
      <SellerCTASection />
      <Footer />
    </div>
  )
}
