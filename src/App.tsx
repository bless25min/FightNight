import { Header } from './components/layout/Header'
import { HeroSection } from './components/sections/HeroSection'
import { PainSection } from './components/sections/PainSection'
import { OldFrameworkBreakSection } from './components/sections/OldFrameworkBreakSection'
import { NewModelSection } from './components/sections/NewModelSection'
import { CoreValueSection } from './components/sections/CoreValueSection'
import { FormulaSection } from './components/sections/FormulaSection'
import { GlovesSection } from './components/sections/GlovesSection'
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
    <>
      <Header />
      <main>
        <HeroSection />
        <PainSection />
        <OldFrameworkBreakSection />
        <NewModelSection />
        <CoreValueSection />
        <FormulaSection />
        <ExperienceFlowSection />
        <GlovesSection />
        <AudienceFitSection />
        <TicketSection />
        <IdentitySection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <footer className="py-8 text-center text-mist/50 text-xs border-t border-pearl/5">
        <p>© {new Date().getFullYear()} UFCGYM TAIWAN. All rights reserved.</p>
      </footer>
    </>
  )
}

export default App
