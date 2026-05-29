import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import {
  fightNightPassPlan,
  siteConfig,
  ticketSectionContent,
} from '../../data/landingContent'
import { useLiffGate } from '../../hooks/useLiffGate'
import { useTracking } from '../../hooks/useTracking'
import { getLineRequestContext } from '../../lib/lineContext'
import { Button } from '../ui/Button'
import { LockedContent } from '../ui/LockedContent'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionWrapper } from '../ui/SectionWrapper'
import { StickyActionBar } from '../ui/StickyActionBar'
import { WeeklyScheduleSection } from './WeeklyScheduleSection'

const featuredPreviewCourseNames = ['拳擊體適能', '泰拳體適能', '戰鬥體適能']
const offerCtaLabel = '查看首購半價與可訂場次'
const offerCtaNote = 'LINE 登入用來確認首購資格，不會自動付款。'

type FirstPurchaseOfferState = 'idle' | 'checking' | 'eligible' | 'ineligible' | 'error'

export function TicketSection() {
  const {
    track,
    trackTicketView,
    trackTicketCta,
    trackGateAccess,
    trackSecondaryCta,
  } = useTracking()
  const { gateState, requestGateAccess, loginUrl } =
    useLiffGate()
  const ref = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const tracked = useRef(false)
  const offerPreviewTracked = useRef(false)
  const [firstPurchaseOfferState, setFirstPurchaseOfferState] =
    useState<FirstPurchaseOfferState>('idle')

  useEffect(() => {
    if (isInView && !tracked.current) {
      tracked.current = true
      trackTicketView()
    }
  }, [isInView, trackTicketView])

  useEffect(() => {
    if (!isInView || gateState.status === 'unlocked' || offerPreviewTracked.current) {
      return
    }

    offerPreviewTracked.current = true
    track({
      event: 'first_purchase_offer_preview_view',
      params: {
        offer_code: '618_MIDYEAR_FIRST_PURCHASE_HALF',
        preview_courses: featuredPreviewCourseNames.join(','),
      },
      metaStandardEvent: 'ViewContent',
      lineEventName: 'OfferPreview',
    })
  }, [gateState.status, isInView, track])

  useEffect(() => {
    if (gateState.status !== 'unlocked') {
      setFirstPurchaseOfferState('idle')
      return
    }

    let active = true
    setFirstPurchaseOfferState('checking')

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
          metaStandardEvent: eligible ? 'Lead' : undefined,
          lineEventName: eligible ? 'OfferEligible' : undefined,
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
      params.get('entry') === 'ticket' || window.location.hash === '#ticket'

    if (!shouldFocusTicket) return

    window.setTimeout(() => {
      titleRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      window.history.replaceState(null, '', `${window.location.pathname}#ticket`)
    }, 120)
  }, [gateState.status])

  const scrollToSchedule = () => {
    document
      .getElementById('fight-night-schedule')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const handleGateAction = () => {
    track({
      event: 'first_purchase_offer_cta_click',
      params: {
        offer_code: '618_MIDYEAR_FIRST_PURCHASE_HALF',
        gate_status: gateState.status,
      },
      metaStandardEvent: 'Lead',
      lineEventName: 'OfferClick',
    })
    trackGateAccess('ticket_section', gateState.status)
    if (!loginUrl) void requestGateAccess()
  }
  const bootCampHref =
    typeof window !== 'undefined' &&
    (window.location.pathname.endsWith('.html') ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === 'localhost')
      ? '/boot-camp.html'
      : siteConfig.bootCampUrl

  return (
    <SectionWrapper id="ticket">
      <div ref={ref}>
        <div ref={titleRef} className="scroll-mt-24 md:scroll-mt-28">
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
              <div className="mb-8">
                <WeeklyScheduleSection
                  id="fight-night-preview-schedule"
                  activeCategory="FIGHT_NIGHT"
                  categories={['FIGHT_NIGHT']}
                  showCategoryTabs={false}
                  showVenueFilter={false}
                  title="先看本週 3 場精選"
                  subtitle="拳擊體適能、泰拳體適能、戰鬥體適能，先選一個你有感覺的一晚。"
                  embedded
                  displayLimit={3}
                  featuredCourseNames={featuredPreviewCourseNames}
                  isPurchaseLocked
                  lockedPurchaseCtaLabel={offerCtaLabel}
                  lockedPurchaseNote={offerCtaNote}
                  onLockedPurchase={handleGateAction}
                />
                <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-relaxed text-mist/55">
                  先看 3 場精選；登入後可查看 618 首購半價資格與更多可線上預訂場次。
                </p>
              </div>
            )}

            <LockedContent
              gateState={gateState}
              title="618 年中慶首購半價"
              description="LINE 登入後確認首購資格、即時剩餘名額與目前開放線上預訂的場次。"
              loginUrl={loginUrl}
              onGateAction={handleGateAction}
              lockedEyebrow="首購限時優惠"
              actionLabel={offerCtaLabel}
              actionNote={offerCtaNote}
            >
              <div>
                {firstPurchaseOfferState === 'checking' ||
                firstPurchaseOfferState === 'idle' ? (
                  <p className="rounded-2xl border border-neon/18 bg-neon/8 px-4 py-5 text-center text-sm leading-relaxed text-mist/72">
                    正在確認 618 首購半價資格...
                  </p>
                ) : firstPurchaseOfferState === 'error' ? (
                  <p className="rounded-2xl border border-blaze/30 bg-blaze/10 px-4 py-5 text-center text-sm leading-relaxed text-blaze">
                    首購資格暫時無法確認，請重新登入 LINE 或稍後再試。
                  </p>
                ) : (
                  <WeeklyScheduleSection
                    id="fight-night-schedule"
                    activeCategory="FIGHT_NIGHT"
                    categories={['FIGHT_NIGHT']}
                    showCategoryTabs={false}
                    showVenueFilter
                    title="目前開放線上預訂的場次"
                    subtitle={
                      firstPurchaseOfferState === 'eligible'
                        ? '618 年中慶首購半價已套用，先選你方便到場的館別、日期與時段。'
                        : '先選你方便到場的館別、日期與時段。'
                    }
                    embedded
                    firstPurchaseOfferEligible={firstPurchaseOfferState === 'eligible'}
                  />
                )}
                {firstPurchaseOfferState === 'ineligible' && (
                  <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-relaxed text-mist/55">
                    此 LINE 帳號已有網站購買紀錄，無法使用首購半價；仍可依一般價格線上預訂。
                  </p>
                )}
              </div>
            </LockedContent>

            <div className="mt-8 border-y border-neon/20 bg-neon/8 px-4 py-5 md:mt-10 md:flex md:items-center md:justify-between md:gap-6 md:px-6 md:py-6">
              <div className="max-w-xl">
                <p className="font-heading text-xs uppercase tracking-[0.26em] text-neon/80">
                  不只想試一次？
                </p>
                <p className="mt-2 font-heading text-2xl font-black leading-tight text-pearl md:text-3xl">
                  用一個習慣，讓自己產生蛻變
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:w-64">
                <Button
                  variant="secondary"
                  size="lg"
                  href={bootCampHref}
                  className="w-full border-neon/35 bg-neon/8 text-neon hover:border-neon/55 hover:bg-neon/14 hover:text-pearl"
                  onClick={() => trackSecondaryCta()}
                  data-cta="ticket-bootcamp-entry"
                >
                  查看 Boot Camp 計畫
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {gateState.status === 'unlocked' && (
          <StickyActionBar
            eyebrow="已解鎖"
            title="選一堂 Fight Night"
            detail="購買指定日期名額"
            actionLabel="選日期"
            onAction={() => {
              trackTicketCta(fightNightPassPlan.id)
              scrollToSchedule()
            }}
          />
        )}

      </div>
    </SectionWrapper>
  )
}
