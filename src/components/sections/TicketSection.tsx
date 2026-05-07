import { motion, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import {
  fightNightPassPlan,
  ticketSectionContent,
  siteConfig,
} from '../../data/landingContent'
import { useLiffGate } from '../../hooks/useLiffGate'
import { useTracking } from '../../hooks/useTracking'
import { Button } from '../ui/Button'
import { LockedContent } from '../ui/LockedContent'
import { PlanCard } from '../ui/PlanCard'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionWrapper } from '../ui/SectionWrapper'

export function TicketSection() {
  const { trackTicketView, trackTicketCta } = useTracking()
  const { gateState, requestGateAccess, openWhenUnlocked, liffUrl } =
    useLiffGate()
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
            <LockedContent
              gateState={gateState}
              title="登入後查看完整費用資訊"
              liffUrl={liffUrl}
              onGateAction={() => void requestGateAccess()}
            >
              <div>
                <div>
                  <div className="mx-auto max-w-xl">
                    <PlanCard
                      plan={fightNightPassPlan}
                    onCtaAction={(url, planId) => {
                      trackTicketCta(planId)
                      void openWhenUnlocked(url)
                      }}
                    />
                  </div>
                </div>
              </div>
            </LockedContent>

            {gateState.status === 'unlocked' && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="ghost"
                  href={siteConfig.offersUrl}
                  data-cta="ticket-offers-entry"
                >
                  查看 Fight Night + Boot Camp 方案
                </Button>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </SectionWrapper>
  )
}
