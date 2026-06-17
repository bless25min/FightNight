import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import {
  singleSessionPassPlan,
  ticketSectionContent,
} from '../../data/landingContent'
import { useLiffGate } from '../../hooks/useLiffGate'
import { useTracking } from '../../hooks/useTracking'
import { getLineRequestContext } from '../../lib/lineContext'
import { LockedContent } from '../ui/LockedContent'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionWrapper } from '../ui/SectionWrapper'
import { StickyActionBar } from '../ui/StickyActionBar'
import { WeeklyScheduleSection } from './WeeklyScheduleSection'

const lockedOfferBadgeLabel = '首堂可免費體驗'

type FirstPurchaseOfferState = 'idle' | 'checking' | 'eligible' | 'ineligible' | 'error'

export function TicketSection() {
  const {
    track,
    trackTicketView,
    trackTicketCta,
    trackGateAccess,
  } = useTracking()
  const { gateState, requestGateAccess, loginUrl } =
    useLiffGate()
  const ref = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const tracked = useRef(false)
  const [firstPurchaseOfferState, setFirstPurchaseOfferState] =
    useState<FirstPurchaseOfferState>('idle')

  useEffect(() => {
    if (isInView && !tracked.current) {
      tracked.current = true
      trackTicketView()
    }
  }, [isInView, trackTicketView])

  useEffect(() => {
    if (gateState.status !== 'unlocked') {
      return
    }

    let active = true

    fetch('/api/shopline/first-purchase-offer', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        lineContext: getLineRequestContext(),
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active) return
        const eligible = data?.eligible === true
        setFirstPurchaseOfferState(eligible ? 'eligible' : 'ineligible')
        track({
          event: 'first_purchase_offer_check',
          params: {
            offer_code: '618_MIDYEAR_FIRST_PURCHASE_HALF',
            eligible,
            reason: typeof data?.reason === 'string' ? data.reason : '',
          },
        })
      })
      .catch(() => {
        if (!active) return
        setFirstPurchaseOfferState('error')
      })

    return () => {
      active = false
    }
  }, [gateState.status, track])

  useEffect(() => {
    if (gateState.status !== 'unlocked') return

    const params = new URLSearchParams(window.location.search)
    const shouldFocusTicket =
      params.get('entry') === 'ticket' ||
      window.location.hash === '#ticket' ||
      window.location.hash === '#single-session-pass'

    if (!shouldFocusTicket) return

    window.setTimeout(() => {
      titleRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      window.history.replaceState(null, '', `${window.location.pathname}#single-session-pass`)
    }, 120)
  }, [gateState.status])

  const scrollToSchedule = () => {
    document
      .getElementById('single-session-free-trial-schedule')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleViewFirstPurchaseOffer = () => {
    track({
      event: 'free_trial_training_plan_bridge_click',
      params: {
        offer_eligible: firstPurchaseOfferState === 'eligible',
      },
    })

    window.history.pushState({}, '', '/offers?from=free-trial')
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 0)
  }
  const handleGateAction = () => {
    track({
      event: 'ticket_schedule_gate_click',
      params: {
        gate_status: gateState.status,
      },
    })
    trackGateAccess('ticket_section', gateState.status)
    if (loginUrl && ['loading', 'logged-out'].includes(gateState.status)) {
      window.location.href = loginUrl
      return
    }
    void requestGateAccess()
  }
  return (
    <SectionWrapper id="ticket">
      <div ref={ref}>
        <div id="single-session-pass" ref={titleRef} className="scroll-mt-24 md:scroll-mt-28">
          <SectionHeading
            title={ticketSectionContent.title}
            subtitle={ticketSectionContent.subtitle}
          />
        </div>

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
            {gateState.status !== 'unlocked' && (
              <LockedContent
                gateState={gateState}
                title="LINE 登入解鎖首堂免費體驗"
                description="登入後查看目前可免費預約的 UFC GYM 夜間體驗體適能課程。"
                onGateAction={handleGateAction}
                loginUrl={loginUrl}
                lockedEyebrow="FREE TRIAL"
                actionLabel={
                  gateState.status === 'not-friend'
                    ? undefined
                    : '登入解鎖 首次體驗/近期場次'
                }
                actionNote="每人僅限一次。"
              >
                <div />
              </LockedContent>
            )}

            {gateState.status === 'unlocked' && (
              <div className="mt-8">
                <WeeklyScheduleSection
                  id="single-session-free-trial-schedule"
                  activeCategory="SINGLE_SESSION"
                  categories={['SINGLE_SESSION']}
                  showCategoryTabs={false}
                  showVenueFilter
                  title="選一堂想進場的課"
                  subtitle="填完聯絡資料後會直接保留此場預約，LINE 會同步送出免費體驗確認卡。"
                  embedded
                  bookingIntent="choice"
                  firstPurchaseOfferEligible={firstPurchaseOfferState === 'eligible'}
                  freeTrialCtaLabel="免費保留這堂"
                  freeTrialBadgeLabel={lockedOfferBadgeLabel}
                  onFreeTrialAddOnClick={handleViewFirstPurchaseOffer}
                />
              </div>
            )}

          </div>
        </motion.div>

        {gateState.status === 'unlocked' && (
          <StickyActionBar
            eyebrow="已解鎖"
            title="選一堂想進場的課"
            detail="首堂免費體驗"
            actionLabel="看課程"
            onAction={() => {
              trackTicketCta(singleSessionPassPlan.id)
              scrollToSchedule()
            }}
          />
        )}

      </div>
    </SectionWrapper>
  )
}

