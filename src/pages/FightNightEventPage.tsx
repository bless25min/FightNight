import { motion } from 'framer-motion'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import heroPoster from '../assets/landing/hero-poster.jpg'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { Seo } from '../components/Seo'
import { FAQSection } from '../components/sections/FAQSection'
import { ExperienceFlowSection } from '../components/sections/ExperienceFlowSection'
import { FormulaSection } from '../components/sections/FormulaSection'
import { HeroSection } from '../components/sections/HeroSection'
import { IdentitySection } from '../components/sections/IdentitySection'
import { NewModelSection } from '../components/sections/NewModelSection'
import { OldFrameworkBreakSection } from '../components/sections/OldFrameworkBreakSection'
import { PainSection } from '../components/sections/PainSection'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { SectionWrapper } from '../components/ui/SectionWrapper'
import { StickyActionBar } from '../components/ui/StickyActionBar'
import {
  ONLINE_BOOKING_START_OFFSET_DAYS,
  ONLINE_SALES_SEAT_LIMIT,
  getWeeklyCourseForCategory,
  isWeeklyCourseAvailableForCategory,
  weeklyCourses,
} from '../data/weeklySchedule'
import { findCoachProfile } from '../data/coachProfiles'
import { getTaipeiTodayIso } from '../lib/coursePricing'
import { getSavedBuyerContact, saveBuyerContact } from '../lib/buyerContact'
import { getCheckoutTrackingContext } from '../lib/checkoutTracking'
import { getLineRequestContext } from '../lib/lineContext'
import { useLiffGate } from '../hooks/useLiffGate'
import {
  type SessionAvailability,
  useSessionAvailability,
} from '../hooks/useSessionAvailability'
import { useTracking } from '../hooks/useTracking'
import type { FAQItem, WeeklyCourse } from '../types'

type EventTicket = {
  id: string
  course: WeeklyCourse
  sessionId: string
  title: string
  dateLabel: string
  timeLabel: string
  venueLabel: string
  styleLabel: string
  coachLabel: string
}

type BuyerContactForm = {
  name: string
  phone: string
  email: string
}

type ReservationSuccess = {
  referenceId: string
  ticket: EventTicket
  lineNotifyStatus?: string
}

const landingVariant = 'fightnight_event_homepage_plus_v1'
const eventName = 'After Work Fight Night'
const eventDescription =
  '下班後進一場由教練帶節奏的 Fight Night。第一次來也可以跟上，先保留這場入場名額，再到 LINE 收預約確認。'
const originalPriceLabel = '一般 NT$880'

const venueLabelMap: Record<string, string> = {
  'venue-dunnan': '敦南旗艦館',
  'venue-neihu': '內湖旗艦館',
  'venue-taichung': '台中旗艦館',
}

const eventFaqItems: FAQItem[] = [
  {
    id: 'event-first-time',
    question: '完全沒有拳擊或泰拳經驗，可以參加嗎？',
    answer:
      '可以。這場不是考核，也不是比賽。教練會先把節奏帶慢，讓你知道站哪裡、怎麼出拳、什麼時候跟上，強度可以依照當下狀態調整。',
  },
  {
    id: 'event-alone',
    question: '一個人來會不會很尷尬？',
    answer:
      '不會。Fight Night 本來就適合一個人進場，因為你很快會把注意力放在教練、音樂、倒數和拳套聲上。現場是一起完成，不是互相比較。',
  },
  {
    id: 'event-after-submit',
    question: '送出保留後，下一步是什麼？',
    answer:
      '送出後，這場名額會先為你保留。你會在 LINE 收到免費體驗預約確認卡，確認場次、時間、地點；確認預約後，也可以順手查看 618 首購優惠。',
  },
  {
    id: 'event-offer-order',
    question: '這會不會只是叫我先買課？',
    answer:
      '不是。這一頁的第一步是保留一場免費體驗入場名額。優惠會放在預約確認之後，讓你先知道自己要去的是哪一場，再決定要不要看首購方案。',
  },
]

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekdayLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  return ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][
    date.getDay()
  ]
}

function formatDateLabel(iso: string) {
  const [, month, day] = iso.split('-')
  return `${Number(month)}/${Number(day)} ${getWeekdayLabel(iso)}`
}

function getDynamicCourseId(baseCourse: WeeklyCourse, date: string) {
  return date === baseCourse.date ? baseCourse.id : `${baseCourse.id}-${date}`
}

function getNextBookableOccurrence(baseCourse: WeeklyCourse, minDateIso: string) {
  let date = baseCourse.date

  while (date < minDateIso) {
    date = addDays(date, 7)
  }

  const course = getWeeklyCourseForCategory(baseCourse, 'FIGHT_NIGHT')

  return {
    ...course,
    id: getDynamicCourseId(course, date),
    date,
    weekday: getWeekdayLabel(date),
  }
}

function getStyleLabel(course: WeeklyCourse) {
  const nameEn = course.nameEn.toLowerCase()
  if (nameEn.includes('muay')) return '泰拳／踢拳'
  if (nameEn.includes('kickbox')) return '踢拳'
  if (nameEn.includes('boxing')) return '拳擊'
  if (nameEn.includes('fight fit')) return 'Fight Fit'
  if (nameEn.includes('conditioning')) return '體能節奏'
  return 'Fight Night'
}

function getVenueLabel(course: WeeklyCourse) {
  return venueLabelMap[course.venueId] ?? course.venueName
}

function getCoachLabel(course: WeeklyCourse) {
  return findCoachProfile(course.coach)?.shortName ?? 'UFC GYM Coach'
}

function getEventTickets(limit = 4): EventTicket[] {
  const bookableFromIso = addDays(
    getTaipeiTodayIso(),
    ONLINE_BOOKING_START_OFFSET_DAYS,
  )

  return weeklyCourses
    .filter((course) => isWeeklyCourseAvailableForCategory(course, 'FIGHT_NIGHT'))
    .map((course) => getNextBookableOccurrence(course, bookableFromIso))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1
      if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1
      return a.venueId < b.venueId ? -1 : 1
    })
    .slice(0, limit)
    .map((course) => ({
      id: course.id,
      course,
      sessionId: course.id,
      title: eventName,
      dateLabel: formatDateLabel(course.date),
      timeLabel: `${course.startTime}-${course.endTime}`,
      venueLabel: getVenueLabel(course),
      styleLabel: getStyleLabel(course),
      coachLabel: getCoachLabel(course),
    }))
}

function getRemainingLabel(
  availability: SessionAvailability,
  hasLiveData: boolean,
) {
  if (!hasLiveData) return `線上開放 ${availability.capacity || ONLINE_SALES_SEAT_LIMIT} 位`
  if (availability.remaining <= 0) return '候補中'
  if (availability.remaining <= 2) return `最後 ${availability.remaining} 位`
  return `剩餘 ${availability.remaining} 位`
}

function getClientContext() {
  if (typeof window === 'undefined') return {}

  return {
    screenWidth: String(window.screen.width),
    screenHeight: String(window.screen.height),
    timeZoneOffset: String(new Date().getTimezoneOffset()),
    transactionWebSite: window.location.origin,
    userAgent: window.navigator.userAgent,
    language: window.navigator.language,
    colorDepth: String(window.screen.colorDepth),
  }
}

function getSourcePath() {
  if (typeof window === 'undefined') return '/fight-night-event'
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function navigateToFirstPurchaseOffer(referenceId?: string) {
  const params = new URLSearchParams({
    from: 'free-trial',
    source: 'fight-night-event',
  })
  if (referenceId) params.set('reference', referenceId)
  window.history.pushState({}, '', `/boot-camp?${params.toString()}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
}

function EventSnapshotSection({
  featuredTicket,
  availability,
  hasLiveData,
  onPrimaryAction,
}: {
  featuredTicket?: EventTicket
  availability?: SessionAvailability
  hasLiveData: boolean
  onPrimaryAction: () => void
}) {
  const remainingLabel =
    featuredTicket && availability
      ? getRemainingLabel(availability, hasLiveData)
      : `線上開放 ${ONLINE_SALES_SEAT_LIMIT} 位`

  return (
    <SectionWrapper id="event-snapshot" padding="pt-0 pb-10 md:pb-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="-mx-3 overflow-hidden rounded-none border-y border-pearl/10 bg-black/45 shadow-[0_30px_80px_rgba(0,0,0,0.38)] sm:mx-auto sm:rounded-2xl sm:border md:rounded-[2rem]"
      >
        <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
          <div className="px-5 py-7 sm:px-8 md:px-10 md:py-12">
            <p className="font-heading text-xs tracking-[0.32em] text-neon/80">
              EVENT ENTRY
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-heading font-bold leading-tight text-pearl sm:text-4xl md:text-6xl">
              這不是選課，是保留一場下班後的 Fight Night。
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-mist/78 md:text-lg">
              首頁已經告訴你 Fight Night 是什麼；這一頁把那個體驗落到一場可以進場的夜晚。你只需要先保留名額，到 LINE 收確認卡，再決定要不要看 618 首購優惠。
            </p>

            <div className="mt-7 grid gap-3 text-sm text-mist/78 sm:grid-cols-3">
              <div className="border-t border-pearl/10 pt-3">
                <p className="font-heading text-pearl">先保留</p>
                <p className="mt-1">不用先付款，先卡住這一場入場名額。</p>
              </div>
              <div className="border-t border-pearl/10 pt-3">
                <p className="font-heading text-pearl">LINE 確認</p>
                <p className="mt-1">送出後收到免費體驗預約確認卡。</p>
              </div>
              <div className="border-t border-pearl/10 pt-3">
                <p className="font-heading text-pearl">再看優惠</p>
                <p className="mt-1">確認預約後才接 618 首購方案。</p>
              </div>
            </div>

            <Button
              size="lg"
              className="mt-8 w-full sm:w-auto"
              onClick={onPrimaryAction}
              data-cta="event-snapshot-primary"
            >
              保留這場入場名額
            </Button>
          </div>

          <div className="border-t border-pearl/10 bg-obsidian/70 px-5 py-7 sm:px-8 md:border-l md:border-t-0 md:px-10 md:py-12">
            <p className="font-heading text-xs tracking-[0.28em] text-blaze/80">
              NEXT DROP
            </p>
            <h2 className="mt-4 text-2xl font-heading font-bold text-pearl md:text-4xl">
              {featuredTicket?.title ?? eventName}
            </h2>
            <div className="mt-6 space-y-4 text-sm text-mist/78">
              <div className="flex items-start justify-between gap-4 border-b border-pearl/10 pb-4">
                <span>場次</span>
                <strong className="text-right font-heading text-pearl">
                  {featuredTicket
                    ? `${featuredTicket.dateLabel} ${featuredTicket.timeLabel}`
                    : '本週開放場次'}
                </strong>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-pearl/10 pb-4">
                <span>地點</span>
                <strong className="text-right font-heading text-pearl">
                  {featuredTicket?.venueLabel ?? 'UFC GYM Taiwan'}
                </strong>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-pearl/10 pb-4">
                <span>入場</span>
                <strong className="text-right font-heading text-neon">
                  首場免費體驗
                </strong>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span>{originalPriceLabel}</span>
                <strong className="text-right font-heading text-blaze">
                  {remainingLabel}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </SectionWrapper>
  )
}

function EventDecisionSection() {
  const decisions = [
    {
      title: '把首頁的感覺，變成這一場',
      body: '你不是被丟進課表自己選。這一頁先保留首頁的完整世界觀，再把終點變成一張明確活動票。',
    },
    {
      title: '新手知道自己會怎麼進場',
      body: '不用先研究課程種類。你只要知道時間、地點、教練會帶、第一次可以跟上，心理負擔就會低很多。',
    },
    {
      title: '優惠不搶走預約動作',
      body: '先完成保留，LINE 收到確認卡，再接 618 首購優惠。順序清楚，按鈕才不會讓人誤會。',
    },
  ]

  return (
    <SectionWrapper id="event-decision">
      <SectionHeading
        title="首頁負責讓你想來，這裡負責讓你真的進場。"
        subtitle="廣告流量需要的不是另一張課程表，而是把期待、流程、名額和下一步說清楚。"
      />

      <div className="grid gap-3 md:grid-cols-3 md:gap-5">
        {decisions.map((decision, index) => (
          <motion.div
            key={decision.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className="rounded-2xl border border-pearl/10 bg-pearl/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)] md:p-6"
          >
            <p className="font-heading text-xs tracking-[0.28em] text-neon/70">
              0{index + 1}
            </p>
            <h3 className="mt-4 text-xl font-heading font-bold text-pearl">
              {decision.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-mist/72">
              {decision.body}
            </p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}

function EventArrivalSection() {
  const flow = [
    ['入場報到', '不用先懂拳擊，先到現場讓教練帶你進節奏。'],
    ['暖身與基本節奏', '站位、出拳、呼吸、強度都會被拆開帶過。'],
    ['進入主段', '音樂、倒數、拳套聲和旁邊的人一起把你推進狀態。'],
    ['最後一輪', '不是為了變強給別人看，而是讓身體真的醒過來。'],
    ['LINE 確認後續', '預約確認卡先到，再自然接 618 首購優惠。'],
  ]

  return (
    <SectionWrapper id="event-arrival">
      <SectionHeading
        title="你不是來上一堂冷冰冰的課。"
        subtitle="你是進一場有人帶、有節奏、有結束點的下班後活動。"
      />

      <div className="mx-auto max-w-4xl border-y border-pearl/10">
        {flow.map(([title, body], index) => (
          <div
            key={title}
            className="grid gap-3 border-b border-pearl/10 py-5 last:border-b-0 md:grid-cols-[120px_1fr] md:items-start md:py-6"
          >
            <p className="font-heading text-sm tracking-[0.24em] text-blaze/75">
              STEP {index + 1}
            </p>
            <div>
              <h3 className="text-xl font-heading font-bold text-pearl">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mist/74 md:text-base">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

function EventTicketCard({
  ticket,
  availability,
  hasLiveData,
  onReserve,
  featured,
}: {
  ticket: EventTicket
  availability: SessionAvailability
  hasLiveData: boolean
  onReserve: (ticket: EventTicket) => void
  featured?: boolean
}) {
  const remainingLabel = getRemainingLabel(availability, hasLiveData)
  const disabled = hasLiveData && availability.remaining <= 0

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-[0_22px_70px_rgba(0,0,0,0.32)] md:p-6 ${
        featured
          ? 'border-neon/35 bg-neon/[0.08]'
          : 'border-pearl/10 bg-pearl/[0.035]'
      }`}
    >
      {featured && (
        <p className="mb-4 inline-flex rounded-full border border-neon/25 bg-neon/10 px-3 py-1 text-xs font-heading tracking-[0.24em] text-neon">
          建議先保留
        </p>
      )}
      <p className="font-heading text-xs tracking-[0.28em] text-blaze/80">
        EVENT TICKET
      </p>
      <h3 className="mt-3 text-2xl font-heading font-bold text-pearl">
        {ticket.title}
      </h3>
      <p className="mt-2 text-sm text-mist/70">
        首堂免費體驗 · {ticket.styleLabel}
      </p>

      <div className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-pearl/10 pb-3">
          <span className="text-mist/62">時間</span>
          <strong className="text-right font-heading text-pearl">
            {ticket.dateLabel} {ticket.timeLabel}
          </strong>
        </div>
        <div className="flex justify-between gap-4 border-b border-pearl/10 pb-3">
          <span className="text-mist/62">地點</span>
          <strong className="text-right font-heading text-pearl">
            {ticket.venueLabel}
          </strong>
        </div>
        <div className="flex justify-between gap-4 border-b border-pearl/10 pb-3">
          <span className="text-mist/62">教練</span>
          <strong className="text-right font-heading text-pearl">
            {ticket.coachLabel}
          </strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-mist/62">{originalPriceLabel}</span>
          <strong className="text-right font-heading text-neon">
            {remainingLabel}
          </strong>
        </div>
      </div>

      <Button
        size="lg"
        className="mt-6 w-full"
        disabled={disabled}
        onClick={() => onReserve(ticket)}
        data-cta="event-ticket-reserve"
        data-ticket={ticket.id}
      >
        {disabled ? '本場候補中' : '保留這場入場名額'}
      </Button>
    </motion.article>
  )
}

function EventTicketDropSection({
  tickets,
  getAvailability,
  hasLiveData,
  onReserve,
}: {
  tickets: EventTicket[]
  getAvailability: (sessionId: string) => SessionAvailability
  hasLiveData: boolean
  onReserve: (ticket: EventTicket) => void
}) {
  return (
    <SectionWrapper id="event-entry" className="pb-28 md:pb-32">
      <SectionHeading
        title="選一場你可以進場的 Fight Night。"
        subtitle="這裡不是課程表。每一張都是一場活動入場卡，先保留，LINE 再收預約確認。"
      />

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {tickets.map((ticket, index) => (
          <EventTicketCard
            key={ticket.id}
            ticket={ticket}
            availability={getAvailability(ticket.sessionId)}
            hasLiveData={hasLiveData}
            featured={index === 0}
            onReserve={onReserve}
          />
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-pearl/10 bg-black/35 p-5 text-center md:p-7">
        <p className="text-base font-heading font-bold text-pearl md:text-xl">
          送出後，先收到 LINE 免費體驗預約確認。
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-mist/70 md:text-base">
          預約確認完成後，才接著看 618 首購優惠。這樣用戶知道自己已經保留場次，不會把「查看優惠」誤認成預約動作。
        </p>
      </div>
    </SectionWrapper>
  )
}

function ReservationModal({
  selectedTicket,
  onClose,
  onOfferClick,
}: {
  selectedTicket: EventTicket | null
  onClose: () => void
  onOfferClick: (referenceId?: string) => void
}) {
  const { track } = useTracking()
  const [form, setForm] = useState<BuyerContactForm>({
    name: '',
    phone: '',
    email: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState<ReservationSuccess | null>(null)

  useEffect(() => {
    if (!selectedTicket) return

    const lineContext = getLineRequestContext()
    const savedContact = getSavedBuyerContact(lineContext?.lineUserId)

    setForm({
      name: savedContact?.name || lineContext?.displayName || '',
      phone: savedContact?.phone || '',
      email: savedContact?.email || lineContext?.email || '',
    })
    setSubmitError('')
    setSuccess(null)
  }, [selectedTicket])

  if (!selectedTicket || typeof document === 'undefined') return null

  const handleChange =
    (field: keyof BuyerContactForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    const lineContext = getLineRequestContext()
    if (!lineContext?.lineUserId) {
      setSubmitError('請先完成 LINE 登入，才能保留這場入場名額。')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    saveBuyerContact(
      {
        lineUserId: lineContext.lineUserId,
        name: form.name,
        phone: form.phone,
        email: form.email,
      },
      lineContext.lineUserId,
    )

    track({
      event: 'free_trial_reservation_submit',
      params: {
        source: landingVariant,
        course_id: selectedTicket.course.id,
        course_name: selectedTicket.course.name,
        session_id: selectedTicket.sessionId,
      },
      metaStandardEvent: 'CompleteRegistration',
      lineEventName: 'FreeTrialReservationSubmit',
    })

    try {
      const response = await fetch('/api/free-trial-reservation', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          buyer: form,
          course: selectedTicket.course,
          lineContext,
          sourcePath: getSourcePath(),
          tracking: {
            ...getCheckoutTrackingContext(),
            landingVariant,
            eventName,
            ticketId: selectedTicket.id,
          },
          client: getClientContext(),
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : '目前無法保留這場，請稍後再試。',
        )
      }

      const referenceId =
        typeof data?.referenceId === 'string' ? data.referenceId : ''

      setSuccess({
        referenceId,
        ticket: selectedTicket,
        lineNotifyStatus:
          typeof data?.lineNotify?.status === 'string'
            ? data.lineNotify.status
            : undefined,
      })

      track({
        event: 'free_trial_reservation_success',
        params: {
          source: landingVariant,
          reference_id: referenceId,
          course_id: selectedTicket.course.id,
          session_id: selectedTicket.sessionId,
        },
        metaStandardEvent: 'Lead',
        lineEventName: 'FreeTrialReservationSuccess',
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '目前無法保留這場，請稍後再試。'
      setSubmitError(message)
      track({
        event: 'free_trial_reservation_error',
        params: {
          source: landingVariant,
          course_id: selectedTicket.course.id,
          session_id: selectedTicket.sessionId,
          error: message,
        },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-3 py-6 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-pearl/10 bg-obsidian p-5 shadow-[0_40px_120px_rgba(0,0,0,0.55)] md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-pearl/10 bg-pearl/5 px-3 py-2 text-sm font-bold text-pearl"
          aria-label="關閉"
        >
          ×
        </button>

        {success ? (
          <div>
            <p className="font-heading text-xs tracking-[0.32em] text-neon/80">
              RESERVED
            </p>
            <h2 className="mt-3 text-3xl font-heading font-bold text-pearl">
              這場名額已先為你保留。
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-mist/72 md:text-base">
              請到 LINE 裡查看免費體驗預約確認卡，確認場次、時間與地點。確認後，可以接著查看 618 首購優惠。
            </p>

            <div className="mt-6 rounded-2xl border border-pearl/10 bg-black/35 p-4">
              <p className="font-heading font-bold text-pearl">
                {success.ticket.title}
              </p>
              <p className="mt-2 text-sm text-mist/70">
                {success.ticket.venueLabel} · {success.ticket.dateLabel}{' '}
                {success.ticket.timeLabel}
              </p>
              <p className="mt-3 text-xs text-mist/55">
                預約編號：{success.referenceId}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="w-full"
                onClick={() => onOfferClick(success.referenceId)}
                data-cta="event-success-offer"
              >
                查看 618 首購優惠
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full"
                onClick={onClose}
                data-cta="event-success-close"
              >
                先回活動頁
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="font-heading text-xs tracking-[0.32em] text-neon/80">
              FREE TRIAL
            </p>
            <h2 className="mt-3 text-3xl font-heading font-bold text-pearl">
              確認資料，保留此場預約
            </h2>

            <div className="mt-5 rounded-2xl border border-neon/20 bg-neon/[0.04] p-4">
              <p className="font-heading font-bold text-pearl">
                首堂免費體驗 · {selectedTicket.styleLabel}
              </p>
              <p className="mt-2 text-sm text-mist/70">
                {selectedTicket.venueLabel} · {selectedTicket.dateLabel}{' '}
                {selectedTicket.timeLabel}
              </p>
              <p className="mt-3 text-xl font-heading font-bold text-neon">
                免費
              </p>
              <p className="mt-1 text-sm text-mist/55">{originalPriceLabel}</p>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-heading text-pearl">姓名</span>
                <input
                  value={form.name}
                  onChange={handleChange('name')}
                  required
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-pearl/20 bg-black/35 px-4 py-3 text-pearl outline-none transition focus:border-neon/60"
                  placeholder="王小明"
                />
              </label>
              <label className="block">
                <span className="text-sm font-heading text-pearl">手機</span>
                <input
                  value={form.phone}
                  onChange={handleChange('phone')}
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  className="mt-2 w-full rounded-xl border border-pearl/20 bg-black/35 px-4 py-3 text-pearl outline-none transition focus:border-neon/60"
                  placeholder="0912345678"
                />
              </label>
              <label className="block">
                <span className="text-sm font-heading text-pearl">Email</span>
                <input
                  value={form.email}
                  onChange={handleChange('email')}
                  inputMode="email"
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-pearl/20 bg-black/35 px-4 py-3 text-pearl outline-none transition focus:border-neon/60"
                  placeholder="name@example.com"
                />
              </label>
            </div>

            {submitError && (
              <p className="mt-4 rounded-xl border border-blaze/25 bg-blaze/10 px-4 py-3 text-sm leading-relaxed text-blaze">
                {submitError}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="mt-6 w-full"
              data-cta="event-reservation-submit"
            >
              {isSubmitting ? '正在保留名額...' : '保留此場預約'}
            </Button>
            <p className="mt-3 text-center text-xs leading-relaxed text-mist/55">
              送出後會儲存這次填寫的資料，下次預約或購買課程會自動帶入。
            </p>
          </form>
        )}
      </motion.div>
    </div>,
    document.body,
  )
}

export function FightNightEventPage() {
  const tickets = useMemo(() => getEventTickets(), [])
  const sessionIds = useMemo(
    () => tickets.map((ticket) => ticket.sessionId),
    [tickets],
  )
  const { getAvailability, hasLiveData } = useSessionAvailability(sessionIds)
  const { gateState, requestGateAccess, loginUrl } = useLiffGate()
  const { track, trackGateAccess } = useTracking()
  const [selectedTicket, setSelectedTicket] = useState<EventTicket | null>(null)
  const featuredTicket = tickets[0]
  const featuredAvailability = featuredTicket
    ? getAvailability(featuredTicket.sessionId)
    : undefined

  useEffect(() => {
    track({
      event: 'event_page_view',
      params: {
        source: landingVariant,
        event_name: eventName,
      },
      metaStandardEvent: 'ViewContent',
      lineEventName: 'EventPageView',
    })
  }, [track])

  const openReservation = async (ticket?: EventTicket) => {
    const targetTicket = ticket ?? featuredTicket
    if (!targetTicket) return

    track({
      event: 'event_ticket_cta_click',
      params: {
        source: landingVariant,
        ticket_id: targetTicket.id,
        course_id: targetTicket.course.id,
        gate_status: gateState.status,
      },
      metaStandardEvent: 'Lead',
      lineEventName: 'EventTicketClick',
    })

    if (gateState.status !== 'unlocked') {
      trackGateAccess('event_ticket_card', gateState.status)
      if (loginUrl && ['loading', 'logged-out'].includes(gateState.status)) {
        window.location.href = loginUrl
        return
      }

      const unlocked = await requestGateAccess()
      if (!unlocked) return
    }

    setSelectedTicket(targetTicket)
  }

  const structuredData = featuredTicket
    ? {
        '@type': 'Event',
        name: eventName,
        description: eventDescription,
        startDate: `${featuredTicket.course.date}T${featuredTicket.course.startTime}:00+08:00`,
        endDate: `${featuredTicket.course.date}T${featuredTicket.course.endTime}:00+08:00`,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        image: [heroPoster],
        location: {
          '@type': 'Place',
          name: featuredTicket.venueLabel,
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'TWD',
          availability: 'https://schema.org/InStock',
        },
      }
    : undefined

  return (
    <div className="relative w-full overflow-x-hidden bg-abyss">
      <Seo
        title="After Work Fight Night｜首場免費體驗入場"
        description={eventDescription}
        canonicalPath="/fight-night-event"
        keywords={[
          'Fight Night',
          'UFC GYM',
          '免費體驗',
          '拳擊體驗',
          '泰拳體驗',
          '下班活動',
        ]}
        image={heroPoster}
        structuredData={structuredData}
      />
      <Header />
      <main>
        <HeroSection />
        <EventSnapshotSection
          featuredTicket={featuredTicket}
          availability={featuredAvailability}
          hasLiveData={hasLiveData}
          onPrimaryAction={() => openReservation()}
        />
        <PainSection />
        <OldFrameworkBreakSection />
        <NewModelSection />
        <EventDecisionSection />
        <FormulaSection />
        <ExperienceFlowSection />
        <EventArrivalSection />
        <IdentitySection />
        <FAQSection />
        <FAQSection
          id="event-faq"
          title="第一次進場前，先把疑慮說清楚。"
          subtitle="保留的是一場免費體驗入場名額，不是要你立刻買課。"
          items={eventFaqItems}
        />
        <EventTicketDropSection
          tickets={tickets}
          getAvailability={getAvailability}
          hasLiveData={hasLiveData}
          onReserve={openReservation}
        />
      </main>
      <Footer />
      <StickyActionBar
        eyebrow="FREE TRIAL"
        title="After Work Fight Night"
        detail="先保留入場名額，LINE 再確認"
        actionLabel="保留名額"
        onAction={() => scrollToId('event-entry')}
      />
      <ReservationModal
        selectedTicket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onOfferClick={navigateToFirstPurchaseOffer}
      />
    </div>
  )
}
