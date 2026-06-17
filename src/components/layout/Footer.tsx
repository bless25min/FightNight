import { motion } from 'framer-motion'
import { businessInfo, siteConfig, venues } from '../../data/landingContent'
import { seoGuides } from '../../data/seoGuides'
import { useTracking } from '../../hooks/useTracking'
import logo from '../../assets/ufcgymtaiwan_logo.svg'

type FooterProps = {
  onVenueAction?: (url: string) => void
}

export function Footer({ onVenueAction }: FooterProps = {}) {
  const { trackLineCta } = useTracking()

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
                  onClick={() => {
                    trackLineCta({
                      cta_id: 'footer-venue-line',
                      venue_id: venue.id,
                      venue_name: venue.name,
                    })
                    onVenueAction(venue.lineUrl)
                  }}
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
                  onClick={() =>
                    trackLineCta({
                      cta_id: 'footer-venue-line',
                      venue_id: venue.id,
                      venue_name: venue.name,
                    })
                  }
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

        <div className="mt-10 grid gap-5 border-t border-pearl/5 pt-6 text-sm text-mist/70 md:mt-14 md:grid-cols-[1.1fr_1.4fr]">
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.28em] text-mist/50">
              營運資訊
            </p>
            <dl className="mt-4 space-y-2 leading-relaxed">
              <div>
                <dt className="inline text-mist/45">登記公司名稱：</dt>
                <dd className="inline text-mist/82">{businessInfo.companyName}</dd>
              </div>
              <div>
                <dt className="inline text-mist/45">
                  {businessInfo.registrationLabel}：
                </dt>
                <dd className="inline text-mist/82">
                  {businessInfo.registrationNumber}
                </dd>
              </div>
              <div>
                <dt className="inline text-mist/45">官方信箱：</dt>
                <dd className="inline">
                  <a
                    href={`mailto:${businessInfo.serviceEmail}`}
                    className="text-mist/82 transition-colors hover:text-neon"
                  >
                    {businessInfo.serviceEmail}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <p className="font-heading text-xs uppercase tracking-[0.28em] text-mist/50">
              官方館場聯繫
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {businessInfo.locations.map((location) => (
                <div
                  key={location.name}
                  className="rounded-xl border border-pearl/10 bg-black/20 p-4"
                >
                  <p className="font-heading text-sm font-semibold text-pearl">
                    {location.name}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-mist/62">
                    {location.address}
                  </p>
                  <a
                    href={`tel:${location.phone.replace(/-/g, '')}`}
                    className="mt-2 inline-flex text-xs font-semibold text-neon transition-colors hover:text-neon/80"
                  >
                    {location.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-pearl/5 pt-6 text-xs text-mist/50 md:mt-14 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved.
          </p>
          <p>
            Designed by{' '}
            <a
              href="https://blessliao.25min.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mist/70 transition-colors hover:text-neon"
            >
              廖天佑
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href="/privacy-policy"
              className="transition-colors hover:text-neon"
            >
              隱私權政策
            </a>
            <a
              href="/terms-of-service"
              className="transition-colors hover:text-neon"
            >
              服務條款
            </a>
            <a
              href="/refund-policy"
              className="transition-colors hover:text-neon"
            >
              退款與取消政策
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
