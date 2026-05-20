import { motion } from 'framer-motion'
import { siteConfig, venues } from '../../data/landingContent'
import { seoGuides } from '../../data/seoGuides'
import logo from '../../assets/ufcgymtaiwan_logo.svg'

type FooterProps = {
  onVenueAction?: (url: string) => void
}

export function Footer({ onVenueAction }: FooterProps = {}) {
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
              <div className="space-y-1.5 text-sm text-mist/80 leading-relaxed">
                <p>{venue.address}</p>
                <p className="text-mist/60">{venue.transit}</p>
              </div>
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-pearl/10 bg-black/40">
                <iframe
                  src={venue.mapEmbedUrl}
                  title={`${venue.name} 地圖`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
              {onVenueAction ? (
                <button
                  type="button"
                  onClick={() => onVenueAction(venue.lineUrl)}
                  data-interaction-hint
                  className="interaction-hint inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-neon hover:text-neon/80 transition-colors mt-1"
                >
                  加入好友
                  <span aria-hidden>→</span>
                </button>
              ) : (
                <a
                  href={venue.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-interaction-hint
                  className="interaction-hint inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-neon hover:text-neon/80 transition-colors mt-1"
                >
                  加入好友
                  <span aria-hidden>→</span>
                </a>
              )}
            </motion.div>
          ))}
        </div>

        <div
          id="footer-guides"
          className="mt-10 md:mt-14 border-t border-pearl/5 pt-6"
        >
          <p className="font-heading text-xs uppercase tracking-[0.28em] text-mist/50">
            搜尋指南
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            {seoGuides.map((guide) => (
              <a
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="rounded-xl border border-pearl/10 bg-black/20 p-4 transition-colors hover:border-neon/30 hover:bg-neon/10"
              >
                <span className="font-heading text-sm font-semibold text-pearl">
                  {guide.footerLabel}
                </span>
                <span className="mt-2 block text-xs leading-relaxed text-mist/58">
                  {guide.footerDescription}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 md:mt-14 pt-6 border-t border-pearl/5 text-center text-xs text-mist/50">
          © {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
