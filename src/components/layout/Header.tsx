import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { siteConfig } from '../../data/landingContent'
import { Button } from '../ui/Button'
import logo from '../../assets/ufcgymtaiwan_logo.svg'

function getCurrentRoutePath() {
  if (typeof window === 'undefined') return '/'

  const hashPath = window.location.hash.replace(/^#/, '')
  if (hashPath.startsWith('/')) return hashPath

  return window.location.pathname
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = getCurrentRoutePath()
  const isOffersPage =
    pathname.startsWith('/offers')
  const isTrainingPlanPage =
    pathname.startsWith('/training-plan')
  const isEventPage =
    pathname === '/' || pathname.startsWith('/single-session-event')
  const isGuidePage =
    pathname.startsWith('/guides/')
  const isUtilityPage =
    isGuidePage ||
    pathname.startsWith('/privacy-policy') ||
    pathname.startsWith('/terms-of-service') ||
    pathname.startsWith('/refund-policy')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const ctaLabel = isTrainingPlanPage
    ? '選路徑與梯次'
    : isEventPage
      ? '把這一晚留下來'
    : isOffersPage
      ? '選課程方案場次'
      : isUtilityPage
        ? '查看 拳擊／泰拳專項課程計畫'
        : '選日期購買'
  const ctaTargetId = isTrainingPlanPage
    ? 'training-plan-routes'
    : isEventPage
      ? 'event-entry'
    : isOffersPage
      ? 'offers-plans'
      : 'single-session-pass'
  const ctaHref = isUtilityPage ? '/offers' : `#${ctaTargetId}`
  const contentClass = 'max-w-6xl mx-auto px-3 sm:px-8'
  const headerClass = scrolled
    ? 'glass py-2 md:py-3'
    : 'bg-transparent py-3 md:py-5'
  const logoClass = 'h-7 md:h-9'

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerClass}`}
    >
      <div className={`${contentClass} flex items-center justify-between`}>
        <a
          href={
            isOffersPage || isTrainingPlanPage || isUtilityPage
              ? '/'
              : isEventPage
                ? '#event-hero'
                : '#hero'
          }
          onClick={(e) => {
            if (!isOffersPage && !isTrainingPlanPage && !isUtilityPage) {
              e.preventDefault()
              scrollTo(isEventPage ? 'event-hero' : 'hero')
            }
          }}
          className="flex items-center"
        >
          <img
            src={logo}
            alt={siteConfig.brandName}
            className={logoClass}
          />
        </a>

        {isOffersPage ? (
          <Button
            size="sm"
            href={ctaHref}
            onClick={() => {
              if (!isUtilityPage) scrollTo(ctaTargetId)
            }}
            data-cta="header-cta"
          >
            {ctaLabel}
          </Button>
        ) : (
          <Button
            size="sm"
            href={ctaHref}
            onClick={() => {
              if (!isUtilityPage) scrollTo(ctaTargetId)
            }}
            data-cta="header-cta"
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </motion.header>
  )
}

