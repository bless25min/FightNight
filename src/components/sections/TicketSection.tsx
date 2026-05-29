import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import {
  fightNightPassPlan,
  ticketSectionContent,
} from '../../data/landingContent'
import { useLiffGate } from '../../hooks/useLiffGate'
import { useTracking } from '../../hooks/useTracking'
import { getCheckoutTrackingContext } from '../../lib/checkoutTracking'
import { writeFreeTrialBridgeState } from '../../lib/freeTrialBridge'
import { getLineRequestContext } from '../../lib/lineContext'
import { Button } from '../ui/Button'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionWrapper } from '../ui/SectionWrapper'
import { StickyActionBar } from '../ui/StickyActionBar'
import {
  WeeklyScheduleSection,
  type FreeTrialDraft,
} from './WeeklyScheduleSection'

const featuredPreviewCourseNames = ['拳擊體適能', '泰拳體適能', '戰鬥體適能']
const lockedCourseCtaLabel = 'LINE 登入看全部時段・首堂免費'
const lockedOfferBadgeLabel = '首堂可免費體驗'

type FirstPurchaseOfferState = 'idle' | 'checking' | 'eligible' | 'ineligible' | 'error'

type FreeTrialReservationState = {
  referenceId: string
  courseId: string
  courseName: string
  venueName?: string
  date?: string
  weekday?: string
  startTime?: string
  endTime?: string
  originalAmountValue?: number
  lineNotifyStatus?: string
} | null

function ExtensionOfferPanel({
  draft,
  offerEligible,
  offerChecking,
  isSubmitting,
  error,
  onGoBootCamp,
  onKeepOnly,
}: {
  draft: FreeTrialDraft
  offerEligible: boolean
  offerChecking: boolean
  isSubmitting: boolean
  error: string | null
  onGoBootCamp: () => void
  onKeepOnly: () => void
}) {
  return (
    <div
      id="fight-night-extension-offer"
      className="rounded-2xl border border-neon/18 bg-neon/8 px-4 py-5 md:px-6"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-heading text-xs uppercase tracking-[0.24em] text-neon/80">
          已選好這堂
        </p>
        <h3 className="mt-2 font-heading text-2xl font-black leading-tight text-pearl md:text-3xl">
          618購物節，首購限定優惠
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-mist/72">
          {draft.course.name} 先幫你留著。下一步看看 618 首購限定優惠，錯過可惜。
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-blaze/22 bg-blaze/10 px-4 py-3 text-sm leading-relaxed text-mist/76">
        {offerChecking
          ? '正在幫你確認首購資格...'
          : offerEligible
            ? '現在加購最划算；最後還是可以只保留免費體驗。'
            : '可以先看可購買課程；付款前會顯示最後價格。'}
      </div>

      <div className="mt-5 rounded-xl border border-pearl/10 bg-black/22 px-4 py-3 text-sm leading-relaxed text-mist/70">
        <span className="font-heading text-pearl">{draft.buyer.name}</span>
        {' · '}
        {draft.buyer.phone}
        {draft.buyer.email ? ` · ${draft.buyer.email}` : ''}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-blaze/30 bg-blaze/10 px-4 py-3 text-sm leading-relaxed text-blaze">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          size="lg"
          onClick={onGoBootCamp}
          disabled={isSubmitting}
          data-cta="free-trial-confirmed-go-bootcamp"
        >
          看 618 首購限定優惠
        </Button>
        <Button
          variant="ghost"
          onClick={onKeepOnly}
          disabled={isSubmitting}
          data-cta="free-trial-extension-keep-only"
        >
          {isSubmitting ? '送出預約中...' : '只保留免費體驗'}
        </Button>
      </div>
    </div>
  )
}

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
  const offerPreviewTracked = useRef(false)
  const [firstPurchaseOfferState, setFirstPurchaseOfferState] =
    useState<FirstPurchaseOfferState>('idle')
  const [freeTrialDraft, setFreeTrialDraft] = useState<FreeTrialDraft | null>(
    null,
  )
  const [freeTrialReservation, setFreeTrialReservation] =
    useState<FreeTrialReservationState>(null)
  const [freeTrialFinalizeError, setFreeTrialFinalizeError] = useState<
    string | null
  >(null)
  const [isFreeTrialFinalizing, setIsFreeTrialFinalizing] = useState(false)
  const extensionOfferTracked = useRef<string | null>(null)
  const freeTrialFeedbackScrolled = useRef<string | null>(null)

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
      window.location.hash === '#fight-night-pass'

    if (!shouldFocusTicket) return

    window.setTimeout(() => {
      titleRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      window.history.replaceState(null, '', `${window.location.pathname}#fight-night-pass`)
    }, 120)
  }, [gateState.status])

  useEffect(() => {
    if (!freeTrialDraft) return
    if (
      firstPurchaseOfferState === 'checking' ||
      firstPurchaseOfferState === 'idle'
    ) {
      return
    }
    const draftKey = `${freeTrialDraft.course.id}:${freeTrialDraft.buyer.phone}`
    if (extensionOfferTracked.current === draftKey) return

    extensionOfferTracked.current = draftKey
    track({
      event: 'free_trial_extension_offer_view',
      params: {
        course_id: freeTrialDraft.course.id,
        course_name: freeTrialDraft.course.name,
        offer_eligible: firstPurchaseOfferState === 'eligible',
      },
      metaStandardEvent: 'ViewContent',
      lineEventName: 'ExtensionOfferView',
    })
  }, [firstPurchaseOfferState, freeTrialDraft, track])

  useEffect(() => {
    if (!freeTrialDraft) return
    const draftKey = `${freeTrialDraft.course.id}:${freeTrialDraft.buyer.phone}`
    if (freeTrialFeedbackScrolled.current === draftKey) {
      return
    }

    freeTrialFeedbackScrolled.current = draftKey
    window.setTimeout(() => {
      titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }, [freeTrialDraft])

  const scrollToSchedule = () => {
    const targetId = freeTrialDraft || freeTrialReservation
      ? 'fight-night-pass'
      : 'fight-night-free-trial-schedule'

    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const finalizeFreeTrialDraft = async (draft: FreeTrialDraft) => {
    setIsFreeTrialFinalizing(true)
    setFreeTrialFinalizeError(null)

    try {
      const response = await fetch('/api/free-trial-reservation', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          buyer: draft.buyer,
          lineContext: getLineRequestContext(),
          course: draft.course,
          sessionIds: draft.sessionIds,
          seriesDates: draft.seriesDates,
          client: {
            screenWidth: String(window.screen.width),
            screenHeight: String(window.screen.height),
            timeZoneOffset: String(new Date().getTimezoneOffset()),
            transactionWebSite: window.location.origin,
            userAgent: window.navigator.userAgent,
            language: window.navigator.language,
            colorDepth: String(window.screen.colorDepth),
          },
          tracking: getCheckoutTrackingContext(),
          sourcePath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        }),
      })

      const data = (await response.json().catch(() => null)) as
        | {
            referenceId?: string
            reservation?: Partial<NonNullable<FreeTrialReservationState>>
            lineNotify?: { status?: string }
            reason?: string
            error?: string
          }
        | null

      if (!response.ok || !data?.referenceId) {
        const reason =
          typeof data?.reason === 'string'
            ? data.reason
            : `http_${response.status}`
        throw Object.assign(
          new Error(data?.error || '免費預約建立失敗，請稍後再試。'),
          { reason },
        )
      }

      const reservation: NonNullable<FreeTrialReservationState> = {
        referenceId: data.referenceId,
        courseId: data.reservation?.courseId ?? draft.course.id,
        courseName: data.reservation?.courseName ?? draft.course.name,
        venueName: data.reservation?.venueName ?? draft.course.venueName,
        date: data.reservation?.date ?? draft.course.date,
        weekday: data.reservation?.weekday ?? draft.course.weekday,
        startTime: data.reservation?.startTime ?? draft.course.startTime,
        endTime: data.reservation?.endTime ?? draft.course.endTime,
        originalAmountValue:
          data.reservation?.originalAmountValue ?? draft.originalValue,
        lineNotifyStatus: data.lineNotify?.status,
      }

      setFreeTrialReservation(reservation)
      setFreeTrialDraft(null)
      track({
        event: 'free_trial_reservation_submit',
        params: {
          course_id: draft.course.id,
          course_name: draft.course.name,
          category: draft.course.category,
          venue_id: draft.course.venueId,
          venue_name: draft.course.venueName,
          date: draft.course.date,
          start_time: draft.course.startTime,
          reference_id: reservation.referenceId,
          original_value: draft.originalValue,
        },
        metaStandardEvent: 'CompleteRegistration',
        lineEventName: 'FreeTrialReserved',
      })
      return reservation
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '免費預約建立失敗，請稍後再試。'
      const reason =
        typeof error === 'object' &&
        error !== null &&
        'reason' in error &&
        typeof error.reason === 'string'
          ? error.reason
          : 'unknown'
      track({
        event: 'free_trial_reservation_error',
        params: {
          course_id: draft.course.id,
          course_name: draft.course.name,
          category: draft.course.category,
          venue_id: draft.course.venueId,
          venue_name: draft.course.venueName,
          date: draft.course.date,
          start_time: draft.course.startTime,
          error_reason: reason,
          error_message: message,
        },
      })
      setFreeTrialFinalizeError(message)
      throw error
    } finally {
      setIsFreeTrialFinalizing(false)
    }
  }

  const handleGoBootCamp = () => {
    if (!freeTrialDraft) return

    writeFreeTrialBridgeState({
      draftId: `${freeTrialDraft.course.id}:${Date.now().toString(36)}`,
      courseId: freeTrialDraft.course.id,
      courseName: freeTrialDraft.course.name,
      venueName: freeTrialDraft.course.venueName,
      date: freeTrialDraft.course.date,
      weekday: freeTrialDraft.course.weekday,
      startTime: freeTrialDraft.course.startTime,
      endTime: freeTrialDraft.course.endTime,
      originalAmountValue: freeTrialDraft.originalValue,
      buyer: freeTrialDraft.buyer,
      sessionIds: freeTrialDraft.sessionIds,
      seriesDates: freeTrialDraft.seriesDates,
      createdAt: new Date().toISOString(),
    })
    track({
      event: 'free_trial_bootcamp_bridge_click',
      params: {
        course_id: freeTrialDraft.course.id,
        course_name: freeTrialDraft.course.name,
        offer_eligible: firstPurchaseOfferState === 'eligible',
      },
    })

    window.history.pushState({}, '', '/boot-camp?from=free-trial')
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
        <div id="fight-night-pass" ref={titleRef} className="scroll-mt-24 md:scroll-mt-28">
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
                  title="先看幾種最受歡迎的體驗"
                  subtitle="這裡只是熱門範例；登入後可查看目前開放線上預約的全部課程。"
                  embedded
                  displayLimit={3}
                  featuredCourseNames={featuredPreviewCourseNames}
                  bookingIntent="choice"
                  isPurchaseLocked
                  lockedPurchaseCtaLabel={lockedCourseCtaLabel}
                  lockedOfferBadgeLabel={lockedOfferBadgeLabel}
                  onLockedPurchase={handleGateAction}
                />
              </div>
            )}

            {gateState.status === 'unlocked' && (
              <div className="mt-8">
                {freeTrialDraft ? (
                  <ExtensionOfferPanel
                    draft={freeTrialDraft}
                    offerEligible={firstPurchaseOfferState === 'eligible'}
                    offerChecking={
                      firstPurchaseOfferState === 'checking' ||
                      firstPurchaseOfferState === 'idle'
                    }
                    isSubmitting={isFreeTrialFinalizing}
                    error={freeTrialFinalizeError}
                    onGoBootCamp={handleGoBootCamp}
                    onKeepOnly={() => {
                      track({
                        event: 'free_trial_keep_only_confirm_click',
                        params: {
                          course_id: freeTrialDraft.course.id,
                          course_name: freeTrialDraft.course.name,
                        },
                        lineEventName: 'FreeTrialKeepOnlyConfirm',
                      })
                      void finalizeFreeTrialDraft(freeTrialDraft)
                    }}
                  />
                ) : freeTrialReservation ? (
                  <div
                    id="fight-night-extension-offer"
                    className="rounded-2xl border border-neon/18 bg-neon/8 px-4 py-5 text-center md:px-6"
                  >
                    <p className="font-heading text-xl font-black text-pearl">
                      免費體驗已保留
                    </p>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-mist/70">
                      {freeTrialReservation.courseName} 預約已成立，LINE 確認卡會同步送出。想把體驗延續成固定訓練時，可以前往 Boot Camp 頁面完整了解。
                    </p>
                    <div className="mt-5 flex justify-center">
                      <Button
                        variant="secondary"
                        href="/boot-camp"
                        data-cta="free-trial-extension-reopen"
                        className="border-neon/30 bg-neon/8 text-neon hover:border-neon/55 hover:bg-neon/14 hover:text-pearl"
                      >
                        前往 Boot Camp 了解方案
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
                    title="選一堂想進場的課"
                    subtitle="先確認課程與聯絡資訊，下一步會顯示 618 首購優惠；最後才決定要加購或只保留免費體驗。"
                    embedded
                    bookingIntent="choice"
                    firstPurchaseOfferEligible={firstPurchaseOfferState === 'eligible'}
                    freeTrialCtaLabel="確認資料，看首購優惠"
                    freeTrialBadgeLabel={lockedOfferBadgeLabel}
                    onFreeTrialDraftSubmit={(draft) => {
                      setFreeTrialDraft(draft)
                      setFreeTrialFinalizeError(null)
                    }}
                  />
                )}
              </div>
            )}

          </div>
        </motion.div>

        {gateState.status === 'unlocked' && (
          <StickyActionBar
            eyebrow="已解鎖"
            title={freeTrialDraft || freeTrialReservation ? '選下一步延續方式' : '選一堂想進場的課'}
            detail={freeTrialDraft || freeTrialReservation ? '先看優惠，再最後確認' : '首堂免費體驗'}
            actionLabel={freeTrialDraft || freeTrialReservation ? '回到選項' : '看課程'}
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
