import { useEffect, useRef, useState } from 'react'
import { SingleSessionEventPage } from './pages/SingleSessionEventPage'
import { OffersPage } from './pages/OffersPage'
import { PaymentResultPage } from './pages/PaymentResultPage'
import { AdminPage } from './pages/AdminPage'
import { SeoGuidePage } from './pages/SeoGuidePage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { RefundPolicyPage } from './pages/RefundPolicyPage'
import { TermsOfServicePage } from './pages/TermsOfServicePage'
import { trackPageView } from './lib/analytics'
import { FloatingConsultButtons } from './components/ui/FloatingConsultButtons'

const CLIENT_BUILD_MARK = 'inventory-guard-20260522a'

function getCurrentRoutePath() {
  if (typeof window === 'undefined') return '/'

  const hashPath = window.location.hash.replace(/^#/, '')
  if (
    hashPath.startsWith('/offers') ||
    hashPath.startsWith('/paid-event') ||
    hashPath.startsWith('/payment/success') ||
    hashPath.startsWith('/admin') ||
    hashPath.startsWith('/privacy-policy') ||
    hashPath.startsWith('/terms-of-service') ||
    hashPath.startsWith('/refund-policy') ||
    hashPath.startsWith('/guides/')
  ) {
    return hashPath
  }

  const pathname = window.location.pathname
  if (pathname.endsWith('/offers.html')) return '/offers'
  if (pathname.endsWith('/paid-event.html')) return '/paid-event'
  if (pathname.endsWith('/admin.html')) return '/admin'
  if (pathname.endsWith('/privacy-policy.html')) return '/privacy-policy'
  if (pathname.endsWith('/terms-of-service.html')) return '/terms-of-service'
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

function shouldShowFloatingConsult(pathname: string) {
  return (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/privacy-policy') &&
    !pathname.startsWith('/terms-of-service') &&
    !pathname.startsWith('/refund-policy') &&
    !pathname.startsWith('/guides/')
  )
}

function getFloatingConsultPlacement(pathname: string) {
  if (pathname.startsWith('/offers')) return 'offers'
  if (pathname.startsWith('/payment/success')) return 'payment_result'
  return 'landing'
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

  let page

  if (pathname.startsWith('/offers')) {
    page = <OffersPage />
  } else if (pathname.startsWith('/paid-event')) {
    page = <SingleSessionEventPage bookingMode="paid" />
  } else if (pathname.startsWith('/payment/success')) {
    page = <PaymentResultPage />
  } else if (pathname.startsWith('/guides/')) {
    const slug = pathname.replace(/^\/guides\//, '').split('/')[0]
    page = <SeoGuidePage slug={decodeURIComponent(slug)} />
  } else if (pathname.startsWith('/admin')) {
    page = <AdminPage />
  } else if (pathname.startsWith('/privacy-policy')) {
    page = <PrivacyPolicyPage />
  } else if (pathname.startsWith('/terms-of-service')) {
    page = <TermsOfServicePage />
  } else if (pathname.startsWith('/refund-policy')) {
    page = <RefundPolicyPage />
  } else {
    page = <SingleSessionEventPage bookingMode="free-trial" />
  }

  return (
    <>
      {page}
      {shouldShowFloatingConsult(pathname) ? (
        <FloatingConsultButtons
          placement={getFloatingConsultPlacement(pathname)}
        />
      ) : null}
    </>
  )
}

export default App
