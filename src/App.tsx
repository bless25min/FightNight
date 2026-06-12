import { useEffect, useRef, useState } from 'react'
import { BootCampPage } from './pages/BootCampPage'
import { FightNightEventPage } from './pages/FightNightEventPage'
import { FightNightIntroPage } from './pages/FightNightIntroPage'
import { OffersPage } from './pages/OffersPage'
import { PaymentResultPage } from './pages/PaymentResultPage'
import { AdminPage } from './pages/AdminPage'
import { SeoGuidePage } from './pages/SeoGuidePage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { RefundPolicyPage } from './pages/RefundPolicyPage'
import { trackPageView } from './lib/analytics'

const CLIENT_BUILD_MARK = 'inventory-guard-20260522a'

function getCurrentRoutePath() {
  if (typeof window === 'undefined') return '/'

  const hashPath = window.location.hash.replace(/^#/, '')
  if (
    hashPath.startsWith('/offers') ||
    hashPath.startsWith('/boot-camp') ||
    hashPath.startsWith('/fight-night-event') ||
    hashPath.startsWith('/fight-night-intro') ||
    hashPath.startsWith('/payment/success') ||
    hashPath.startsWith('/admin') ||
    hashPath.startsWith('/privacy-policy') ||
    hashPath.startsWith('/refund-policy') ||
    hashPath.startsWith('/guides/')
  ) {
    return hashPath
  }

  const pathname = window.location.pathname
  if (pathname.endsWith('/offers.html')) return '/offers'
  if (pathname.endsWith('/boot-camp.html')) return '/boot-camp'
  if (pathname.endsWith('/fight-night-event.html')) return '/fight-night-event'
  if (pathname.endsWith('/fight-night-intro.html')) return '/fight-night-intro'
  if (pathname.endsWith('/admin.html')) return '/admin'
  if (pathname.endsWith('/privacy-policy.html')) return '/privacy-policy'
  if (pathname.endsWith('/refund-policy.html')) return '/refund-policy'

  return pathname
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
    document.documentElement.dataset.clientBuild = CLIENT_BUILD_MARK
  }, [])

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

  if (pathname.startsWith('/fight-night-event')) {
    return <FightNightEventPage />
  }

  if (pathname.startsWith('/fight-night-intro')) {
    return <FightNightIntroPage />
  }

  if (pathname.startsWith('/payment/success')) {
    return <PaymentResultPage />
  }

  if (pathname.startsWith('/guides/')) {
    const slug = pathname.replace(/^\/guides\//, '').split('/')[0]
    return <SeoGuidePage slug={decodeURIComponent(slug)} />
  }

  if (pathname.startsWith('/admin')) {
    return <AdminPage />
  }

  if (pathname.startsWith('/privacy-policy')) {
    return <PrivacyPolicyPage />
  }

  if (pathname.startsWith('/refund-policy')) {
    return <RefundPolicyPage />
  }

  return <FightNightEventPage />
}

export default App
