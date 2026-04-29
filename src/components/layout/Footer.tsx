import { motion } from 'framer-motion'
import { siteConfig, venues } from '../../data/landingContent'
import logo from '../../assets/ufcgymtaiwan_logo.svg'

export function Footer() {
  return (
    <footer className="border-t border-pearl/10 bg-abyss/60">
      <div className="max-w-6xl mx-auto px-3 sm:px-8 py-10 md:py-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 md:mb-12">
          <img src={logo} alt={siteConfig.brandName} className="h-7 md:h-9" />
          <p className="text-sm md:text-base text-mist font-heading tracking-wide">
            場館資訊
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {venues.map((venue, i) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-pearl/10 bg-black/30 p-5 md:p-6 flex flex-col gap-3"
            >
              <h3 className="text-base md:text-lg font-heading font-semibold text-pearl">
                {venue.name}
              </h3>
              <div className="space-y-1.5 text-sm text-mist/80 leading-relaxed flex-1">
                <p>{venue.address}</p>
                <p className="text-mist/60">{venue.transit}</p>
              </div>
              <a
                href={venue.lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-neon hover:text-neon/80 transition-colors mt-1"
              >
                加入好友
                <span aria-hidden>→</span>
              </a>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 md:mt-14 pt-6 border-t border-pearl/5 text-center text-xs text-mist/50">
          © {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
