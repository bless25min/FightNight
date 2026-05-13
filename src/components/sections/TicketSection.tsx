import { motion, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import {
  fightNightPassPlan,
  ticketSectionContent,
  venues,
} from '../../data/landingContent'
import { useLiffGate } from '../../hooks/useLiffGate'
import { useTracking } from '../../hooks/useTracking'
import { Button } from '../ui/Button'
import { LockedContent } from '../ui/LockedContent'
import { PlanCard } from '../ui/PlanCard'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionWrapper } from '../ui/SectionWrapper'
import { StickyActionBar } from '../ui/StickyActionBar'
import { WeeklyScheduleSection } from './WeeklyScheduleSection'

const venueLandmarks: Record<string, string> = {
  'venue-dunnan': '忠孝敦化站',
  'venue-neihu': '港墘站',
  'venue-taichung': '勤美誠品綠園道',
}

function venueDisplayName(fullName: string) {
  const idx = fullName.indexOf('—')
  return idx >= 0 ? fullName.slice(idx + 1).trim() : fullName
}

function FightNightVenueSummary() {
  return (
    <div className="mt-7 md:mt-8 rounded-2xl border border-pearl/10 bg-black/25 p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs md:text-sm font-heading tracking-[0.22em] text-neon/80 uppercase">
          上課地點
        </p>
        <p className="text-xs text-mist/55">
          三館可選
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="rounded-xl border border-pearl/10 bg-black/25 px-3.5 py-3"
          >
            <p className="text-sm font-heading font-semibold text-pearl">
              {venueDisplayName(venue.name)}
            </p>
            <p className="mt-1 text-xs text-mist/70">
              {venueLandmarks[venue.id] ?? venue.transit}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

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

  useEffect(() => {
    if (gateState.status !== 'unlocked') return

    const params = new URLSearchParams(window.location.search)
    const shouldFocusTicket =
      params.get('entry') === 'ticket' || window.location.hash === '#ticket'

    if (!shouldFocusTicket) return

    window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.replaceState(null, '', `${window.location.pathname}#ticket`)
    }, 120)
  }, [gateState.status])

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

                <FightNightVenueSummary />

                <div className="mt-10 md:mt-12">
                  <WeeklyScheduleSection
                    id="fight-night-schedule"
                    activeCategory="FIGHT_NIGHT"
                    categories={['FIGHT_NIGHT']}
                    showCategoryTabs={false}
                    title="本週可報名 Fight Night"
                    subtitle="先選一堂你能到場的時間，再完成預留。"
                    embedded
                  />
                </div>
              </div>
            </LockedContent>

            {gateState.status === 'unlocked' && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="ghost"
                  href="#identity"
                  data-cta="ticket-offers-entry"
                >
                  了解 Boot Camp 方案
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {gateState.status === 'unlocked' && (
          <StickyActionBar
            eyebrow="已解鎖"
            title="Fight Night Pass"
            detail="NT$980 / 堂"
            actionLabel="購買"
            onAction={() => {
              trackTicketCta(fightNightPassPlan.id)
              void openWhenUnlocked(fightNightPassPlan.checkoutUrl)
            }}
          />
        )}

      </div>
    </SectionWrapper>
  )
}
