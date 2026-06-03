import { motion } from 'framer-motion'
import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import heroPoster from '../assets/landing/hero-poster.jpg'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { Seo } from '../components/Seo'
import { ExperienceFlowSection } from '../components/sections/ExperienceFlowSection'
import { FAQSection } from '../components/sections/FAQSection'
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
import { findCoachProfile } from '../data/coachProfiles'
import {
  ONLINE_BOOKING_START_OFFSET_DAYS,
  ONLINE_SALES_SEAT_LIMIT,
  getWeeklyCourseForCategory,
  isWeeklyCourseAvailableForCategory,
  weeklyCourses,
} from '../data/weeklySchedule'
import { useLiffGate } from '../hooks/useLiffGate'
import {
  type SessionAvailability,
  useSessionAvailability,
} from '../hooks/useSessionAvailability'
import { useTracking } from '../hooks/useTracking'
import { getSavedBuyerContact, saveBuyerContact } from '../lib/buyerContact'
import { getCheckoutTrackingContext } from '../lib/checkoutTracking'
import {
  formatCoursePrice,
  getCoursePriceModel,
  getFirstPurchaseOfferAmount,
  getTaipeiTodayIso,
} from '../lib/coursePricing'
import { getLineRequestContext } from '../lib/lineContext'
import type { FAQItem, WeeklyCourse } from '../types'

type BuyerContactForm = {
  name: string
  phone: string
  email: string
}

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

type EventTicketPrice = {
  amount: number
  label: string
  originalAmount: number
  originalLabel: string
  offerApplied: boolean
  pricingTier: 'foreign-fighter' | 'domestic-teacher'
}

type OfferState = 'idle' | 'checking' | 'eligible' | 'ineligible' | 'error'

const landingVariant = 'fightnight_event_no_membership_paid_v1'
const eventName = 'After Work Fight Night'
const eventDescription =
  '不用入會、不被推銷，完成一次簡單付款，就能進場享受一場完整編排的 Fight Night 情緒體驗。'

const venueLabelMap: Record<string, string> = {
  'venue-dunnan': '敦南旗艦館',
  'venue-neihu': '內湖旗艦館',
  'venue-taichung': '台中旗艦館',
}

const eventFaqItems: FAQItem[] = [
  {
    id: 'event-no-membership',
    question: '我需要加入會員或先聽方案介紹嗎？',
    answer:
      '不用。這個活動頁賣的是一場完整 Fight Night 體驗，不是入會諮詢。你完成線上付款後，只需要依照 LINE 入場確認到現場。',
  },
  {
    id: 'event-no-sales',
    question: '到現場會不會被推銷課程或會員？',
    answer:
      '這一頁的承諾是完整體驗不被打擾。你買的是這一場，現場流程以教練帶領與體驗為主，不會在課程中安排銷售諮詢。',
  },
  {
    id: 'event-first-time',
    question: '完全沒有拳擊或泰拳經驗，可以參加嗎？',
    answer:
      '可以。Fight Night 不是格鬥比賽，也不是動作考核。教練會從暖身、站位、出拳節奏開始帶，第一次來也可以跟上。',
  },
  {
    id: 'event-payment',
    question: '付款後會收到什麼？',
    answer:
      '付款完成後，系統會依付款 webhook 確認訂單，並透過 LINE 發送已付款入場確認卡。你可以在 LINE 裡確認場次、時間與地點。',
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

function getCoachPricingTier(course: WeeklyCourse) {
  return findCoachProfile(course.coach)?.pricingTier ?? 'domestic-teacher'
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
      title: `${eventName} 完整體驗`,
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
  if (!hasLiveData) {
    return `線上開放 ${availability.capacity || ONLINE_SALES_SEAT_LIMIT} 位`
  }
  if (availability.remaining <= 0) return '候補中'
  if (availability.remaining <= 2) return `最後 ${availability.remaining} 位`
  return `剩餘 ${availability.remaining} 位`
}

function getEventTicketPrice(
  ticket: EventTicket,
  availability: SessionAvailability,
  offerEligible: boolean,
): EventTicketPrice {
  const pricingTier = getCoachPricingTier(ticket.course)
  const basePrice = getCoursePriceModel({
    course: ticket.course,
    pricingTier,
    packageSize: 1,
    remaining: availability.remaining,
  })
  const offerAmount = offerEligible
    ? getFirstPurchaseOfferAmount(basePrice.amount)
    : basePrice.amount
  const amount = Math.min(basePrice.amount, offerAmount)

  return {
    amount,
    label: formatCoursePrice(amount),
    originalAmount: basePrice.amount,
    originalLabel: basePrice.label,
    offerApplied: amount < basePrice.amount,
    pricingTier,
  }
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

function EventPromiseSection({
  featuredTicket,
  availability,
  hasLiveData,
  price,
  onPrimaryAction,
}: {
  featuredTicket?: EventTicket
  availability?: SessionAvailability
  hasLiveData: boolean
  price?: EventTicketPrice
  onPrimaryAction: () => void
}) {
  const remainingLabel =
    featuredTicket && availability
      ? getRemainingLabel(availability, hasLiveData)
      : `線上開放 ${ONLINE_SALES_SEAT_LIMIT} 位`

  return (
    <SectionWrapper id="event-promise" padding="pt-0 pb-10 md:pb-20">
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
              NO MEMBERSHIP. NO SALES TALK.
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-heading font-bold leading-tight text-pearl sm:text-4xl md:text-6xl">
              不想入會，也可以買一場讓身體醒過來的夜晚。
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-mist/78 md:text-lg">
              Fight Night 把拳擊、泰拳、音樂節奏與教練帶領，編排成一場完整的情緒釋放體驗。你不用入會、不用被推銷、不用先談方案；完成一次付款，就能進場享受整場氛圍。
            </p>

            <div className="mt-7 grid gap-3 text-sm text-mist/78 sm:grid-cols-4">
              {['不用入會', '不安排銷售諮詢', '一次付款', '完整體驗'].map(
                (item) => (
                  <div key={item} className="border-t border-pearl/10 pt-3">
                    <p className="font-heading text-pearl">{item}</p>
                  </div>
                ),
              )}
            </div>

            <Button
              size="lg"
              className="mt-8 w-full sm:w-auto"
              onClick={onPrimaryAction}
              data-cta="event-promise-primary"
            >
              購買這場完整體驗
            </Button>
          </div>

          <div className="border-t border-pearl/10 bg-obsidian/70 px-5 py-7 sm:px-8 md:border-l md:border-t-0 md:px-10 md:py-12">
            <p className="font-heading text-xs tracking-[0.28em] text-blaze/80">
              NEXT SESSION
            </p>
            <h2 className="mt-4 text-2xl font-heading font-bold text-pearl md:text-4xl">
              {featuredTicket?.title ?? `${eventName} 完整體驗`}
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
                  付款確認，不需入會
                </strong>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span>{remainingLabel}</span>
                <strong className="text-right font-heading text-blaze">
                  {price?.label ?? '即時報價'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </SectionWrapper>
  )
}

function EventReframeSection() {
  return (
    <SectionWrapper id="event-reframe">
      <SectionHeading
        title="大家都知道運動很好，但很多人不想走進健身房。"
        subtitle="不是你不知道該運動，而是你不想面對入會、推銷、合約，或一堂又一堂無聊的課。"
      />

      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[0.95fr_1.05fr] md:gap-6">
        <div className="rounded-2xl border border-pearl/10 bg-pearl/[0.035] p-5 md:p-7">
          <p className="font-heading text-xs tracking-[0.28em] text-blaze/80">
            OLD GYM SCRIPT
          </p>
          <h3 className="mt-4 text-2xl font-heading font-bold text-pearl">
            你以為自己要面對的是健身房流程。
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-mist/74 md:text-base">
            填表、諮詢、參觀、方案介紹、會員價格、教練課推薦。很多人不是不想動，而是不想一開始就被拉進這套流程。
          </p>
        </div>
        <div className="rounded-2xl border border-neon/20 bg-neon/[0.055] p-5 md:p-7">
          <p className="font-heading text-xs tracking-[0.28em] text-neon/80">
            FIGHT NIGHT
          </p>
          <h3 className="mt-4 text-2xl font-heading font-bold text-pearl">
            我們把課程重新編排成一場情緒價值體驗。
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-mist/74 md:text-base">
            你不用自己找動力。音樂、倒數、教練口令、拳套聲和旁邊的人，會一起把你帶進那個節奏。你買的是一段完整體驗，不是被銷售打擾的試用。
          </p>
        </div>
      </div>
    </SectionWrapper>
  )
}

function EventNoSalesSection() {
  const items = [
    ['不會要求入會', '你買的是這一場完整體驗，不需要先承諾長期方案。'],
    ['不會中途推銷', '現場重點是教練帶領、節奏、動作和氛圍，不會把體驗切斷拿來談銷售。'],
    ['不需要先會拳擊', '第一次來也可以跟，動作與強度會被拆開帶。'],
    ['付款後 LINE 確認', '付款完成後會收到已付款入場確認卡，場次資訊清楚留在 LINE。'],
  ]

  return (
    <SectionWrapper id="event-no-sales">
      <SectionHeading
        title="你只需要完成付款，然後進場享受。"
        subtitle="這一頁的重點不是把你帶進銷售流程，而是讓你安心買一次完整體驗。"
      />

      <div className="mx-auto max-w-4xl border-y border-pearl/10">
        {items.map(([title, body], index) => (
          <div
            key={title}
            className="grid gap-3 border-b border-pearl/10 py-5 last:border-b-0 md:grid-cols-[120px_1fr] md:items-start md:py-6"
          >
            <p className="font-heading text-sm tracking-[0.24em] text-blaze/75">
              0{index + 1}
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
  offerEligible,
  onPurchase,
  featured,
}: {
  ticket: EventTicket
  availability: SessionAvailability
  hasLiveData: boolean
  offerEligible: boolean
  onPurchase: (ticket: EventTicket) => void
  featured?: boolean
}) {
  const remainingLabel = getRemainingLabel(availability, hasLiveData)
  const price = getEventTicketPrice(ticket, availability, offerEligible)
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
          建議先進這場
        </p>
      )}
      <p className="font-heading text-xs tracking-[0.28em] text-blaze/80">
        COMPLETE EXPERIENCE
      </p>
      <h3 className="mt-3 text-2xl font-heading font-bold text-pearl">
        {ticket.title}
      </h3>
      <p className="mt-2 text-sm text-mist/70">
        {ticket.styleLabel} · 不用入會 · 不被推銷
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
        <div className="flex justify-between gap-4 border-b border-pearl/10 pb-3">
          <span className="text-mist/62">名額</span>
          <strong className="text-right font-heading text-neon">
            {remainingLabel}
          </strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-mist/62">一次付款</span>
          <strong className="text-right font-heading text-blaze">
            {price.label}
          </strong>
        </div>
      </div>

      {price.offerApplied && (
        <p className="mt-3 text-xs leading-relaxed text-mist/55">
          系統已套用目前可用的線上活動價；現場不需要再談方案。
        </p>
      )}

      <Button
        size="lg"
        className="mt-6 w-full"
        disabled={disabled}
        onClick={() => onPurchase(ticket)}
        data-cta="event-ticket-purchase"
        data-ticket={ticket.id}
      >
        {disabled ? '本場候補中' : '購買這場完整體驗'}
      </Button>
    </motion.article>
  )
}

function EventTicketDropSection({
  tickets,
  getAvailability,
  hasLiveData,
  offerEligible,
  onPurchase,
}: {
  tickets: EventTicket[]
  getAvailability: (sessionId: string) => SessionAvailability
  hasLiveData: boolean
  offerEligible: boolean
  onPurchase: (ticket: EventTicket) => void
}) {
  return (
    <SectionWrapper id="event-entry" className="pb-28 md:pb-32">
      <SectionHeading
        title="選一場，像買活動一樣完成付款。"
        subtitle="付款後保留名額，LINE 收入場確認。你買的是一場完整體驗，不是入會前導。"
      />

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {tickets.map((ticket, index) => (
          <EventTicketCard
            key={ticket.id}
            ticket={ticket}
            availability={getAvailability(ticket.sessionId)}
            hasLiveData={hasLiveData}
            offerEligible={offerEligible}
            featured={index === 0}
            onPurchase={onPurchase}
          />
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-pearl/10 bg-black/35 p-5 text-center md:p-7">
        <p className="text-base font-heading font-bold text-pearl md:text-xl">
          付款完成後，這場體驗就是你的。
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-mist/70 md:text-base">
          你不需要現場談會員，也不需要先聽方案。照著 LINE 入場確認到場，完整跟著教練與節奏走完這一場。
        </p>
      </div>
    </SectionWrapper>
  )
}

function CheckoutModal({
  selectedTicket,
  availability,
  offerEligible,
  refreshOfferEligibility,
  onClose,
}: {
  selectedTicket: EventTicket | null
  availability: SessionAvailability | null
  offerEligible: boolean
  refreshOfferEligibility: () => Promise<boolean>
  onClose: () => void
}) {
  const { track } = useTracking()
  const [form, setForm] = useState<BuyerContactForm>({
    name: '',
    phone: '',
    email: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

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
  }, [selectedTicket])

  if (!selectedTicket || !availability || typeof document === 'undefined') {
    return null
  }

  const displayPrice = getEventTicketPrice(
    selectedTicket,
    availability,
    offerEligible,
  )

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
      setSubmitError('請先完成 LINE 登入，付款後才能收到入場確認卡。')
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

    try {
      const latestOfferEligible = await refreshOfferEligibility()
      const checkoutPrice = getEventTicketPrice(
        selectedTicket,
        availability,
        latestOfferEligible,
      )

      const response = await fetch('/api/shopline/checkout-session', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          buyer: form,
          lineContext,
          course: selectedTicket.course,
          packageSize: 1,
          quotedAmountValue: checkoutPrice.amount,
          quotedOriginalAmountValue: checkoutPrice.originalAmount,
          requestedOfferCode: checkoutPrice.offerApplied
            ? '618_MIDYEAR_FIRST_PURCHASE_HALF'
            : undefined,
          sessionIds: [selectedTicket.sessionId],
          seriesDates: [selectedTicket.course.date],
          sourcePath: getSourcePath(),
          tracking: {
            ...getCheckoutTrackingContext(),
            landingVariant,
            eventName,
            ticketId: selectedTicket.id,
            noMembershipSalesFlow: true,
          },
          client: getClientContext(),
        }),
      })

      const data = (await response.json().catch(() => null)) as
        | {
            referenceId?: string
            sessionUrl?: string
            reason?: string
            error?: string
          }
        | null

      if (!response.ok || !data?.sessionUrl) {
        throw new Error(
          data?.error || '目前無法建立付款連結，請稍後再試。',
        )
      }

      track({
        event: 'shopline_checkout_submit',
        params: {
          source: landingVariant,
          reference_id: data.referenceId,
          course_id: selectedTicket.course.id,
          course_name: selectedTicket.course.name,
          category: selectedTicket.course.category,
          venue_id: selectedTicket.course.venueId,
          venue_name: selectedTicket.course.venueName,
          date: selectedTicket.course.date,
          start_time: selectedTicket.course.startTime,
          coach: selectedTicket.course.coach,
          coach_pricing_tier: checkoutPrice.pricingTier,
          package_size: 1,
          value: checkoutPrice.amount,
          original_value: checkoutPrice.originalAmount,
          currency: 'TWD',
          remaining: availability.remaining,
          event_product: 'complete_experience_no_membership',
          discount_code: checkoutPrice.offerApplied
            ? '618_MIDYEAR_FIRST_PURCHASE_HALF'
            : undefined,
        },
        metaStandardEvent: 'InitiateCheckout',
        lineEventName: 'CheckoutSubmit',
      })

      window.location.href = data.sessionUrl
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '目前無法建立付款連結，請稍後再試。'
      setSubmitError(message)
      track({
        event: 'shopline_checkout_error',
        params: {
          source: landingVariant,
          course_id: selectedTicket.course.id,
          session_id: selectedTicket.sessionId,
          error_message: message,
        },
      })
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

        <form onSubmit={handleSubmit}>
          <p className="font-heading text-xs tracking-[0.32em] text-neon/80">
            COMPLETE EXPERIENCE
          </p>
          <h2 className="mt-3 text-3xl font-heading font-bold text-pearl">
            確認資料，前往付款
          </h2>

          <div className="mt-5 rounded-2xl border border-neon/20 bg-neon/[0.04] p-4">
            <p className="font-heading font-bold text-pearl">
              {selectedTicket.title}
            </p>
            <p className="mt-2 text-sm text-mist/70">
              {selectedTicket.venueLabel} · {selectedTicket.dateLabel}{' '}
              {selectedTicket.timeLabel}
            </p>
            <p className="mt-3 text-2xl font-heading font-bold text-neon">
              {displayPrice.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mist/62">
              一次付款，不需入會，不安排銷售諮詢。付款完成後會透過 LINE 收到入場確認。
            </p>
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
            data-cta="event-checkout-submit"
          >
            {isSubmitting ? '正在建立付款連結...' : '前往付款，確認這場體驗'}
          </Button>
          <p className="mt-3 text-center text-xs leading-relaxed text-mist/55">
            送出後會儲存這次填寫的資料，下次預約或購買課程會自動帶入。
          </p>
        </form>
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
  const [offerState, setOfferState] = useState<OfferState>('idle')
  const offerEligible = offerState === 'eligible'
  const featuredTicket = tickets[0]
  const featuredAvailability = featuredTicket
    ? getAvailability(featuredTicket.sessionId)
    : undefined
  const featuredPrice =
    featuredTicket && featuredAvailability
      ? getEventTicketPrice(featuredTicket, featuredAvailability, offerEligible)
      : undefined

  const refreshOfferEligibility = useCallback(async () => {
    const lineContext = getLineRequestContext()
    if (!lineContext?.lineUserId) {
      setOfferState('ineligible')
      return false
    }

    setOfferState('checking')
    try {
      const response = await fetch('/api/shopline/first-purchase-offer', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          lineContext,
        }),
      })
      const data = await response.json().catch(() => null)
      const eligible = response.ok && data?.eligible === true
      setOfferState(eligible ? 'eligible' : 'ineligible')
      track({
        event: 'first_purchase_offer_check',
        params: {
          source: landingVariant,
          eligible,
          reason: typeof data?.reason === 'string' ? data.reason : '',
        },
      })
      return eligible
    } catch {
      setOfferState('error')
      return false
    }
  }, [track])

  useEffect(() => {
    track({
      event: 'event_page_view',
      params: {
        source: landingVariant,
        event_name: eventName,
        paid_experience_flow: true,
      },
      metaStandardEvent: 'ViewContent',
      lineEventName: 'EventPageView',
    })
  }, [track])

  useEffect(() => {
    if (gateState.status === 'unlocked' && offerState === 'idle') {
      const timer = window.setTimeout(() => {
        void refreshOfferEligibility()
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [gateState.status, offerState, refreshOfferEligibility])

  const openCheckout = async (ticket?: EventTicket) => {
    const targetTicket = ticket ?? featuredTicket
    if (!targetTicket) return

    track({
      event: 'event_ticket_cta_click',
      params: {
        source: landingVariant,
        ticket_id: targetTicket.id,
        course_id: targetTicket.course.id,
        gate_status: gateState.status,
        event_product: 'complete_experience_no_membership',
      },
      metaStandardEvent: 'AddToCart',
      lineEventName: 'EventTicketClick',
    })

    if (gateState.status !== 'unlocked') {
      trackGateAccess('event_paid_experience', gateState.status)
      if (loginUrl && ['loading', 'logged-out'].includes(gateState.status)) {
        window.location.href = loginUrl
        return
      }

      const unlocked = await requestGateAccess()
      if (!unlocked) return
    }

    if (offerState === 'idle' || offerState === 'error') {
      void refreshOfferEligibility()
    }

    setSelectedTicket(targetTicket)
  }

  const structuredData = featuredTicket
    ? {
        '@type': 'Event',
        name: `${eventName} 完整體驗`,
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
          price: String(featuredPrice?.amount ?? ''),
          priceCurrency: 'TWD',
          availability: 'https://schema.org/InStock',
        },
      }
    : undefined

  return (
    <div className="relative w-full overflow-x-hidden bg-abyss">
      <Seo
        title="After Work Fight Night｜不用入會的一次完整體驗"
        description={eventDescription}
        canonicalPath="/fight-night-event"
        keywords={[
          'Fight Night',
          'UFC GYM',
          '拳擊體驗',
          '泰拳體驗',
          '下班活動',
          '不用入會',
        ]}
        image={heroPoster}
        structuredData={structuredData}
      />
      <Header />
      <main>
        <HeroSection />
        <EventPromiseSection
          featuredTicket={featuredTicket}
          availability={featuredAvailability}
          hasLiveData={hasLiveData}
          price={featuredPrice}
          onPrimaryAction={() => openCheckout()}
        />
        <PainSection />
        <EventReframeSection />
        <OldFrameworkBreakSection />
        <NewModelSection />
        <FormulaSection />
        <ExperienceFlowSection />
        <EventNoSalesSection />
        <IdentitySection />
        <FAQSection />
        <FAQSection
          id="event-faq"
          title="第一次買這場體驗前，先把疑慮說清楚。"
          subtitle="你買的是一次完整 Fight Night，不是入會諮詢，也不是免費體驗後的推銷流程。"
          items={eventFaqItems}
        />
        <EventTicketDropSection
          tickets={tickets}
          getAvailability={getAvailability}
          hasLiveData={hasLiveData}
          offerEligible={offerEligible}
          onPurchase={openCheckout}
        />
      </main>
      <Footer />
      <StickyActionBar
        eyebrow="NO MEMBERSHIP"
        title="After Work Fight Night"
        detail="一次付款，完整體驗"
        actionLabel="購買體驗"
        onAction={() => scrollToId('event-entry')}
      />
      <CheckoutModal
        selectedTicket={selectedTicket}
        availability={
          selectedTicket ? getAvailability(selectedTicket.sessionId) : null
        }
        offerEligible={offerEligible}
        refreshOfferEligibility={refreshOfferEligibility}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  )
}
