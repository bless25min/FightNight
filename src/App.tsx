import { useEffect, useRef, useState } from 'react'
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
import { PaymentResultPage } from './pages/PaymentResultPage'
import { useScrollProgress } from './hooks/useScrollProgress'
import { trackPageView } from './lib/analytics'

function getCurrentRoutePath() {
  if (typeof window === 'undefined') return '/'

  const hashPath = window.location.hash.replace(/^#/, '')
  if (hashPath.startsWith('/offers') || hashPath.startsWith('/boot-camp')) {
    return hashPath
  }

  const pathname = window.location.pathname
  if (pathname.endsWith('/offers.html')) return '/offers'
  if (pathname.endsWith('/boot-camp.html')) return '/boot-camp'

  return pathname
}

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

function useInteractionHintLifecycle() {
  useEffect(() => {
    const selector = '[data-interaction-hint], [data-swipe-hint]'

    const markInteracted = (target: EventTarget | Element | null) => {
      if (!(target instanceof Element)) return
      const element = target.closest<HTMLElement>(selector)
      element?.setAttribute('data-interacted', 'true')
    }

    const handlePointerDown = (event: PointerEvent) => {
      markInteracted(event.target)
    }

    const handleFocusIn = (event: FocusEvent) => {
      markInteracted(event.target)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        ['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
          event.key,
        )
      ) {
        markInteracted(document.activeElement)
      }
    }

    const handleScroll = (event: Event) => {
      markInteracted(event.target)
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('focusin', handleFocusIn, true)
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('focusin', handleFocusIn, true)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [])
}

function App() {
  const [pathname, setPathname] = useState(getCurrentRoutePath)
  const trackedInitialPageView = useRef(false)
  useInteractionHintLifecycle()

  useEffect(() => {
    if (!trackedInitialPageView.current) {
      trackedInitialPageView.current = true
      return
    }

    trackPageView(`${window.location.pathname}${window.location.search}${window.location.hash}`)
  }, [pathname])

  useEffect(() => {
    const onRouteChange = () => setPathname(getCurrentRoutePath())

    window.addEventListener('popstate', onRouteChange)
    window.addEventListener('hashchange', onRouteChange)

    return () => {
      window.removeEventListener('popstate', onRouteChange)
      window.removeEventListener('hashchange', onRouteChange)
    }
  }, [])

  if (pathname.startsWith('/offers')) {
    return <OffersPage />
  }

  if (pathname.startsWith('/boot-camp')) {
    return <BootCampPage />
  }

  if (pathname.startsWith('/payment/success')) {
    return <PaymentResultPage />
  }

  return <HomePage />
}

export default App
