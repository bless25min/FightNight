import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { siteConfig } from '../../data/landingContent'
import { Button } from '../ui/Button'
import logo from '../../assets/ufcgymtaiwan_logo.svg'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const isOffersPage =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/offers')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const ctaLabel = isOffersPage
    ? '查看 Boot Camp 方案'
    : '購買 Fight Night Pass'
  const ctaTargetId = isOffersPage ? 'offers-plans' : 'ticket'
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
          href={isOffersPage ? '/' : '#hero'}
          onClick={(e) => {
            if (!isOffersPage) {
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
