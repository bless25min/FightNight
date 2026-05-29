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
import { SectionHeading } from '../ui/SectionHeading'
import { SectionWrapper } from '../ui/SectionWrapper'
import { StickyActionBar } from '../ui/StickyActionBar'
import { WeeklyScheduleSection } from './WeeklyScheduleSection'

const featuredPreviewCourseNames = ['拳擊體適能', '泰拳體適能', '戰鬥體適能']
const lockedCourseCtaLabel = '登入免費預約這堂'
const lockedOfferBadgeLabel = '首堂免費體驗'
const previewSecondaryCtaLabel = '登入免費預約一堂'

type FirstPurchaseOfferState = 'idle' | 'checking' | 'eligible' | 'ineligible' | 'error'

type FreeTrialReservationState = {
  referenceId: string
  courseId: string
  courseName: string
} | null

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
  const [freeTrialReservation, setFreeTrialReservation] =
    useState<FreeTrialReservationState>(null)
  const [showAddOnCourses, setShowAddOnCourses] = useState(false)

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
      event: 'ticket_schedule_preview_view',
      params: {
        preview_courses: featuredPreviewCourseNames.join(','),
      },
      metaStandardEvent: 'ViewContent',
      lineEventName: 'TicketSchedulePreview',
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
      event: 'ticket_schedule_gate_click',
      params: {
        gate_status: gateState.status,
      },
      metaStandardEvent: 'Lead',
      lineEventName: 'TicketScheduleGate',
    })
    trackGateAccess('ticket_section', gateState.status)
    if (loginUrl && ['loading', 'logged-out'].includes(gateState.status)) {
      window.location.href = loginUrl
      return
    }
    void requestGateAccess()
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
                  title="先選一個你想進場的晚上"
                  subtitle="第一次先不用決定全部課表，選一堂你想真的到場的體驗。"
                  embedded
                  displayLimit={3}
                  featuredCourseNames={featuredPreviewCourseNames}
                  bookingIntent="free_trial"
                  isPurchaseLocked
                  lockedPurchaseCtaLabel={lockedCourseCtaLabel}
                  lockedOfferBadgeLabel={lockedOfferBadgeLabel}
                  onLockedPurchase={handleGateAction}
                />
                <div className="mt-5 flex justify-center">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleGateAction}
                    data-cta="ticket-preview-all-courses"
                    className="border-neon/30 bg-neon/8 text-neon hover:border-neon/55 hover:bg-neon/14 hover:text-pearl"
                  >
                    {previewSecondaryCtaLabel}
                  </Button>
                </div>
              </div>
            )}

            {gateState.status === 'unlocked' && (
              <div className="mt-8">
                {freeTrialReservation && showAddOnCourses ? (
                  firstPurchaseOfferState === 'checking' ||
                  firstPurchaseOfferState === 'idle' ? (
                  <p className="rounded-2xl border border-neon/18 bg-neon/8 px-4 py-5 text-center text-sm leading-relaxed text-mist/72">
                    正在整理首購限定可加購課程...
                  </p>
                ) : (
                  <WeeklyScheduleSection
                    id="fight-night-schedule"
                    activeCategory="FIGHT_NIGHT"
                    categories={['FIGHT_NIGHT']}
                    showCategoryTabs={false}
                    showVenueFilter
                    title="618 首購限定加購"
                    subtitle={
                      firstPurchaseOfferState === 'eligible'
                        ? '免費體驗已保留，現在可用首購限定優惠加購其他課程。'
                        : '免費體驗已保留，你也可以選擇其他可線上預訂課程。'
                    }
                    embedded
                    excludedCourseIds={[freeTrialReservation.courseId]}
                    firstPurchaseOfferEligible={firstPurchaseOfferState === 'eligible'}
                  />
                  )
                ) : freeTrialReservation ? (
                  <div className="rounded-2xl border border-neon/18 bg-neon/8 px-4 py-5 text-center md:px-6">
                    <p className="font-heading text-xl font-black text-pearl">
                      免費體驗已保留
                    </p>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-mist/70">
                      {freeTrialReservation.courseName} 預約已成立，LINE 確認卡會同步送出。你可以先保留體驗，也可以現在查看 618 首購限定加購。
                    </p>
                    <div className="mt-5 flex justify-center">
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => setShowAddOnCourses(true)}
                        data-cta="free-trial-confirmed-view-add-ons"
                        className="border-neon/30 bg-neon/8 text-neon hover:border-neon/55 hover:bg-neon/14 hover:text-pearl"
                      >
                        查看其他課程與價格
                      </Button>
                    </div>
                  </div>
                ) : (
                  <WeeklyScheduleSection
                    id="fight-night-free-trial-schedule"
                    activeCategory="FIGHT_NIGHT"
                    categories={['FIGHT_NIGHT']}
                    showCategoryTabs={false}
                    showVenueFilter
                    title="選一堂免費體驗"
                    subtitle="留下預約資訊後只會保留體驗名額，不會進入付款頁。"
                    embedded
                    bookingIntent="free_trial"
                    freeTrialCtaLabel="免費預約這堂"
                    freeTrialBadgeLabel={lockedOfferBadgeLabel}
                    onFreeTrialReserved={(reservation) => {
                      setFreeTrialReservation({
                        referenceId: reservation.referenceId,
                        courseId: reservation.courseId,
                        courseName: reservation.courseName,
                      })
                    }}
                    onFreeTrialAddOnClick={() => setShowAddOnCourses(true)}
                  />
                )}
              </div>
            )}

            {gateState.status === 'unlocked' && (
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
            )}
          </div>
        </motion.div>

        {gateState.status === 'unlocked' && (
          <StickyActionBar
            eyebrow="已解鎖"
            title="選一堂免費體驗"
            detail="保留指定日期名額"
            actionLabel="免費預約"
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
