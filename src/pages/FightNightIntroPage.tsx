import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { ExperienceFlowSection } from '../components/sections/ExperienceFlowSection'
import { FAQSection } from '../components/sections/FAQSection'
import { FinalCTASection } from '../components/sections/FinalCTASection'
import { FormulaSection } from '../components/sections/FormulaSection'
import { HeroSection } from '../components/sections/HeroSection'
import { IdentitySection } from '../components/sections/IdentitySection'
import { NewModelSection } from '../components/sections/NewModelSection'
import { OldFrameworkBreakSection } from '../components/sections/OldFrameworkBreakSection'
import { PainSection } from '../components/sections/PainSection'
import { TicketSection } from '../components/sections/TicketSection'

export function FightNightIntroPage() {
  return (
    <div className="relative w-full overflow-x-hidden">
      <Header />
      <main>
        <HeroSection />
        <PainSection />
        <OldFrameworkBreakSection />
        <NewModelSection />
        <FormulaSection />
        <ExperienceFlowSection />
        <TicketSection />
        <IdentitySection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  )
}
