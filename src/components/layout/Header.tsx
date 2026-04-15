import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { siteConfig } from '../../data/landingContent'
import { Button } from '../ui/Button'
import logo from '../../assets/ufcgymtaiwan_logo.svg'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault()
            scrollTo('hero')
          }}
          className="flex items-center"
        >
          <img
            src={logo}
            alt={siteConfig.brandName}
            className="h-7 md:h-9"
          />
        </a>

        {/* CTA */}
        <Button
          size="sm"
          onClick={() => scrollTo('ticket')}
          data-cta="header-cta"
        >
          立即搶位
        </Button>
      </div>
    </motion.header>
  )
}
