import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { siteConfig } from '../../data/landingContent'
import { Button } from '../ui/Button'
import logo from '../../assets/ufcgymtaiwan_logo.svg'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '/'
  const isOffersPage =
    pathname.startsWith('/offers')
  const isBootCampPage =
    pathname.startsWith('/boot-camp')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const ctaLabel = isBootCampPage
    ? '查看可購買梯次'
    : isOffersPage
      ? '選 Boot Camp 場次'
      : '選日期購買'
  const ctaTargetId = isBootCampPage
    ? 'boot-camp-booking'
    : isOffersPage
      ? 'offers-plans'
      : 'ticket'
  const ctaHref = `#${ctaTargetId}`

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass py-2 md:py-3' : 'bg-transparent py-3 md:py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-8 flex items-center justify-between">
        <a
          href={isOffersPage || isBootCampPage ? '/' : '#hero'}
          onClick={(e) => {
            if (!isOffersPage && !isBootCampPage) {
              e.preventDefault()
              scrollTo('hero')
            }
          }}
          className="flex items-center"
        >
          <img
            src={logo}
            alt={siteConfig.brandName}
            className="h-7 md:h-9"
          />
        </a>

        {isOffersPage ? (
          <Button
            size="sm"
            href={ctaHref}
            onClick={() => scrollTo(ctaTargetId)}
            data-cta="header-cta"
          >
            {ctaLabel}
          </Button>
        ) : (
          <Button
            size="sm"
            href={ctaHref}
            onClick={() => scrollTo(ctaTargetId)}
            data-cta="header-cta"
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </motion.header>
  )
}
