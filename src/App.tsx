import { useEffect, useState } from 'react'
import { Header } from './components/layout/Header'
import { HeroSection } from './components/sections/HeroSection'
import { PainSection } from './components/sections/PainSection'
import { OldFrameworkBreakSection } from './components/sections/OldFrameworkBreakSection'
import { NewModelSection } from './components/sections/NewModelSection'
import { FormulaSection } from './components/sections/FormulaSection'
import { ExperienceFlowSection } from './components/sections/ExperienceFlowSection'
import { TicketSection } from './components/sections/TicketSection'
import { IdentitySection } from './components/sections/IdentitySection'
import { FAQSection } from './components/sections/FAQSection'
import { FinalCTASection } from './components/sections/FinalCTASection'
import { Footer } from './components/layout/Footer'
import { BootCampPage } from './pages/BootCampPage'
import { OffersPage } from './pages/OffersPage'
import { useScrollProgress } from './hooks/useScrollProgress'

function HomePage() {
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
        <TicketSection />
        <IdentitySection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  const [pathname, setPathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/',
  )

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (pathname.startsWith('/offers')) {
    return <OffersPage />
  }

  if (pathname.startsWith('/boot-camp')) {
    return <BootCampPage />
  }

  return <HomePage />
}

export default App
