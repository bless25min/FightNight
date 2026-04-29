import { motion, useInView } from 'framer-motion'
import { useRef, useEffect } from 'react'
import {
  ticketPlans,
  ticketSectionContent,
  siteConfig,
} from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { SectionHeading } from '../ui/SectionHeading'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useTracking } from '../../hooks/useTracking'

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
  }, [isInView])

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto items-start">
          {ticketPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              data-ticket={plan.id}
              className={`relative rounded-2xl p-5 md:p-8 border transition-all duration-300 overflow-hidden ${
                plan.highlight
                  ? 'glass border-neon/40 glow-neon md:scale-105'
                  : 'glass border-pearl/10 hover:border-pearl/20'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant={plan.highlight ? 'highlight' : 'gold'}>
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <h3 className="text-2xl font-heading font-bold mt-1 md:mt-2 mb-1">
                {plan.name}
              </h3>
              <p className="text-sm text-mist mb-3">{plan.subtitle}</p>

              <p className="text-sm md:text-base text-pearl/85 leading-relaxed mb-5 md:mb-6 min-h-[3rem]">
                {plan.teaserCopy}
              </p>

              {/* 遮罩價格 */}
              <div className="mb-4 md:mb-5 relative">
                <span
                  className="text-3xl md:text-4xl font-heading font-black text-pearl/40 select-none tracking-widest"
                  aria-hidden
                >
                  {ticketSectionContent.maskedPrice}
                </span>
                <span className="sr-only">價格將於 LINE 登入後顯示</span>
              </div>

              {/* features 局部露出（前兩項清楚，剩下用霧面遮罩） */}
              <div className="relative mb-5 md:mb-6">
                <ul className="space-y-2 md:space-y-3">
                  {plan.features.slice(0, 2).map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-mist"
                    >
                      <span className="text-neon mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                  {plan.features.slice(2).map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-mist/40 blur-[3px] select-none"
                      aria-hidden
                    >
                      <span className="text-neon/40 mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-obsidian/80 to-transparent" />
              </div>

              <p className="text-xs text-mist/50 mb-3 text-center">
                {ticketSectionContent.teaserHint}
              </p>

              <Button
                variant={plan.ctaVariant}
                className="w-full"
                onClick={() => trackTicketCta(plan.id)}
                href={siteConfig.offersUrl}
                data-cta={`ticket-${plan.id}`}
                data-ticket={plan.id}
              >
                {ticketSectionContent.unifiedCtaLabel}
              </Button>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm md:text-base text-mist/60 max-w-2xl mx-auto mt-8 md:mt-12">
          {ticketSectionContent.footnote}
        </p>
      </div>
    </SectionWrapper>
  )
}
