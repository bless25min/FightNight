import { motion, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { ticketSectionContent, siteConfig } from '../../data/landingContent'
import { useTracking } from '../../hooks/useTracking'
import { Button } from '../ui/Button'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionWrapper } from '../ui/SectionWrapper'

export function TicketSection() {
  const { trackTicketView, trackTicketCta } = useTracking()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const tracked = useRef(false)

  useEffect(() => {
    if (isInView && !tracked.current) {
      tracked.current = true
      trackTicketView()
    }
  }, [isInView, trackTicketView])

  return (
    <SectionWrapper id="ticket">
      <div ref={ref}>
        <SectionHeading
          title={ticketSectionContent.title}
          subtitle={ticketSectionContent.subtitle}
        />

        <p className="text-center text-sm md:text-base text-mist/70 max-w-2xl mx-auto -mt-2 mb-8 md:mb-12">
          {ticketSectionContent.description}
        </p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto overflow-hidden rounded-3xl border border-pearl/10 glass p-6 md:p-10"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-neon/10 blur-[90px]" />
            <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-blaze/10 blur-[110px]" />
          </div>

          <div className="relative">
            <p className="text-center text-xs md:text-sm font-heading tracking-[0.3em] text-neon/80 uppercase">
              {ticketSectionContent.teaserHint}
            </p>

            <h3 className="mt-4 text-center text-2xl md:text-3xl font-heading font-bold text-pearl">
              {ticketSectionContent.previewTitle}
            </h3>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {ticketSectionContent.previewItems.map((item, i) => (
                <div
                  key={item}
                  className={`rounded-2xl border border-pearl/10 bg-black/20 px-4 py-5 text-center ${
                    i % 2 === 0 ? 'md:translate-y-2' : ''
                  }`}
                >
                  <div className="text-sm md:text-base font-heading font-semibold text-pearl">
                    {item}
                  </div>
                  <div className="mt-2 text-xs text-mist/60">
                    LINE Login 後解鎖
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                onClick={() => trackTicketCta('offers-entry')}
                href={siteConfig.offersUrl}
                data-cta="ticket-offers-entry"
              >
                {ticketSectionContent.unifiedCtaLabel}
              </Button>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-sm md:text-base text-mist/60 max-w-2xl mx-auto mt-8 md:mt-12">
          {ticketSectionContent.footnote}
        </p>
      </div>
    </SectionWrapper>
  )
}
