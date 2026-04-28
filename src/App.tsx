import { Header } from './components/layout/Header'
import { HeroSection } from './components/sections/HeroSection'
import { PainSection } from './components/sections/PainSection'
import { OldFrameworkBreakSection } from './components/sections/OldFrameworkBreakSection'
import { NewModelSection } from './components/sections/NewModelSection'
import { FormulaSection } from './components/sections/FormulaSection'
import { ExperienceFlowSection } from './components/sections/ExperienceFlowSection'
import { AudienceFitSection } from './components/sections/AudienceFitSection'
import { TicketSection } from './components/sections/TicketSection'
import { IdentitySection } from './components/sections/IdentitySection'
import { FAQSection } from './components/sections/FAQSection'
import { FinalCTASection } from './components/sections/FinalCTASection'
import { useScrollProgress } from './hooks/useScrollProgress'

function App() {
  // 滾動深度追蹤
  useScrollProgress()

  return (
    <div className="overflow-x-hidden w-full relative">
      <Header />
      <main>
        <HeroSection />
        <PainSection />
        <OldFrameworkBreakSection />
        <NewModelSection />
        <FormulaSection />
        <ExperienceFlowSection />
        <AudienceFitSection />
        <TicketSection />
        <IdentitySection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <footer className="py-8 text-center text-mist/50 text-xs border-t border-pearl/5">
        <p>© {new Date().getFullYear()} UFCGYM TAIWAN. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
