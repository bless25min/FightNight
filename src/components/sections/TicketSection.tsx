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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto items-start">
          {ticketPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              data-ticket={plan.id}
              className={`relative rounded-2xl p-6 md:p-8 border transition-all duration-300 ${
                plan.highlight
                  ? 'glass border-neon/40 glow-neon md:scale-105'
                  : 'glass border-pearl/10 hover:border-pearl/20'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant={plan.highlight ? 'highlight' : 'gold'}>
                    {plan.badge}
                  </Badge>
                </div>
              )}

              {/* 票種名稱 */}
              <h3 className="text-2xl font-heading font-bold mt-2 mb-1">
                {plan.name}
              </h3>
              <p className="text-sm text-mist mb-6">{plan.subtitle}</p>

              {/* 價格 */}
              <div className="mb-6">
                <span className="text-3xl md:text-4xl font-heading font-black text-pearl">
                  {plan.price}
                </span>
              </div>

              {/* 功能列表 */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-mist"
                  >
                    <span className="text-neon mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.ctaVariant}
                className="w-full"
                onClick={() => trackTicketCta(plan.id)}
                href={siteConfig.ticketUrl}
                data-cta={`ticket-${plan.id}`}
                data-ticket={plan.id}
              >
                {plan.ctaLabel}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
