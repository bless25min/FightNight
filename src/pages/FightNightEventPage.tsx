import { motion } from 'framer-motion'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import eventGroupEnergy from '../assets/landing/collective-euphoria-card.jpg'
import eventBagImpact from '../assets/landing/flow-step-3.jpg'
import eventAfterglow from '../assets/landing/flow-step-5.jpg'
import eventHeroEmotion from '../assets/landing/train-different-poster.jpg'
import ufcBoxingGloves from '../assets/products/ufc-boxing-gloves.webp'
import ufcHandWraps from '../assets/products/ufc-hand-wraps.webp'
import { Header } from '../components/layout/Header'
import { Seo } from '../components/Seo'
import { FAQSection } from '../components/sections/FAQSection'
import { Button } from '../components/ui/Button'
import { SectionWrapper } from '../components/ui/SectionWrapper'
import { StickyActionBar } from '../components/ui/StickyActionBar'
import {
  findCoachProfile,
  getCoachDisplayName,
  type CoachProfile,
} from '../data/coachProfiles'
import {
  ONLINE_BOOKING_START_OFFSET_DAYS,
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
import {
  createMetaEventId,
  getCheckoutTrackingContext,
} from '../lib/checkoutTracking'
import {
  formatCoursePrice,
  getCoursePriceModel,
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
}

type EventTicketPrice = {
  amount: number
  label: string
  originalAmount: number
  originalLabel: string
  compareAtAmount?: number
  compareAtLabel?: string
  offerApplied: boolean
  pricingTier: 'foreign-fighter' | 'domestic-teacher'
}

type EventPassVariantId =
  | 'fight-night-pass'
  | 'fight-night-gear-pass'
  | 'single-class-paid'

type EventPassHighlight = {
  title: string
  body: string
  productId?: EventProductId
}

type EventProductId = 'hand-wraps' | 'boxing-gloves'

type EventPassVariant = {
  id: EventPassVariantId
  title: string
  ctaName: string
  priceDelta: number
  fixedAmount?: number
  equipmentPackage: 'wraps' | 'gloves-and-wraps' | 'self-or-rental'
  includesGloves: boolean
  includesWraps: boolean
  showPreferences: boolean
  highlights: EventPassHighlight[]
}

type FreeTrialStatusState =
  | 'unknown'
  | 'checking'
  | 'available'
  | 'used'
  | 'unavailable'

type FreeTrialStatusSnapshot = {
  lineUserId: string
  status: Exclude<FreeTrialStatusState, 'unknown' | 'checking'>
}

type Coordinates = {
  latitude: number
  longitude: number
}

type VenueRecommendation = {
  venueId: string
  distanceKm?: number
  source: 'cloudflare' | 'browser'
}

type LocationRecommendationResponse = {
  recommendation?: {
    venueId?: string
    distanceKm?: number
    source?: string
  } | null
}

type EventServicePreferences = {
  handWrapAssist: boolean
  quietMode: boolean
}

type EventCoachProfileDetailTone = 'pearl' | 'neon' | 'blaze'

const landingVariant = 'fightnight_event_night_ticket_paid_v3'
const eventName = 'Fight Night'
const eventDescription =
  'Fight Night 是一張 Fight Night Pass。走進 UFC GYM，戴上拳套，把 50 分鐘交給倒數、沙包聲和全場。'
const eventMoreSessionsHash = '#event-more-sessions'
const eventMoreSessionsIntentKey = 'fightnight_event_more_sessions_intent'
const eventCoursePricingMode = 'weekly-course-no-first-purchase'

const venueLabelMap: Record<string, string> = {
  'venue-dunnan': '敦南旗艦館',
  'venue-neihu': '內湖旗艦館',
  'venue-taichung': '台中旗艦館',
}

const venueNearbyAreaLabelMap: Record<string, string> = {
  'venue-dunnan': '捷運忠孝敦化站',
  'venue-neihu': '捷運港墘站',
  'venue-taichung': '勤美誠品',
}

const eventVenueTabs = Object.entries(venueLabelMap).map(([venueId, label]) => ({
  venueId,
  label,
  nearbyAreaLabel: venueNearbyAreaLabelMap[venueId],
}))

const venueCoordinates: Record<string, Coordinates> = {
  'venue-dunnan': {
    latitude: 25.03931467772036,
    longitude: 121.54767441193627,
  },
  'venue-neihu': {
    latitude: 25.079304677694402,
    longitude: 121.57099151193722,
  },
  'venue-taichung': {
    latitude: 24.151235378309035,
    longitude: 120.66126771191507,
  },
}

const eventProductDetails: Record<
  EventProductId,
  {
    title: string
    body: string
    image: string
    alt: string
  }
> = {
  'hand-wraps': {
    title: '全新 UFC GYM 手綁帶',
    body: '結束後可以帶回家。',
    image: ufcHandWraps,
    alt: '全新 UFC GYM 手綁帶',
  },
  'boxing-gloves': {
    title: '全新 UFC GYM 拳擊手套',
    body: '結束後可以帶回家。',
    image: ufcBoxingGloves,
    alt: '全新 UFC GYM 拳擊手套',
  },
}

const eventPassBaseHighlights: EventPassHighlight[] = [
  {
    title: '入場通行',
    body: '全設施使用。',
  },
  {
    title: '感應式私人置物櫃',
    body: '飯店級盥洗用品。',
  },
]

const eventPassVariants: EventPassVariant[] = [
  {
    id: 'fight-night-pass',
    title: 'Fight Night Pass',
    ctaName: 'Fight Night Pass',
    priceDelta: 0,
    equipmentPackage: 'wraps',
    includesGloves: false,
    includesWraps: true,
    showPreferences: true,
    highlights: [
      ...eventPassBaseHighlights,
      {
        title: '新手包',
        body: '上課使用的拳套、手綁帶會先為你準備好。',
      },
      {
        title: '全新 UFC GYM 手綁帶',
        body: '結束後可以帶回家。',
        productId: 'hand-wraps',
      },
    ],
  },
  {
    id: 'fight-night-gear-pass',
    title: 'Fight Night Gear Pass',
    ctaName: 'Fight Night Gear Pass',
    priceDelta: 1800,
    equipmentPackage: 'gloves-and-wraps',
    includesGloves: true,
    includesWraps: true,
    showPreferences: true,
    highlights: [
      ...eventPassBaseHighlights,
      {
        title: '全新 UFC GYM 手綁帶',
        body: '結束後可以帶回家。',
        productId: 'hand-wraps',
      },
      {
        title: '全新 UFC GYM 拳擊手套',
        body: '結束後可以帶回家。',
        productId: 'boxing-gloves',
      },
    ],
  },
]

const defaultEventPassVariant = eventPassVariants[0]

const singleClassPaidVariant: EventPassVariant = {
  id: 'single-class-paid',
  title: '一般單堂體驗',
  ctaName: '這堂體驗',
  priceDelta: 0,
  fixedAmount: 680,
  equipmentPackage: 'self-or-rental',
  includesGloves: false,
  includesWraps: false,
  showPreferences: false,
  highlights: [
    {
      title: '一般體驗流程',
      body: '裝備可自備，或現場租用。',
    },
  ],
}

const eventServicePreferenceOptions: Array<{
  id: keyof EventServicePreferences
  title: string
  body: string
}> = [
  {
    id: 'handWrapAssist',
    title: '課前準備',
    body: '專人協助教學及纏手綁帶',
  },
  {
    id: 'quietMode',
    title: '安靜模式',
    body: '現場接待人員不主動介紹入會方案。',
  },
]

const eventFaqItems: FAQItem[] = [
  {
    id: 'event-first-time',
    question: '我完全沒打過可以嗎？',
    answer:
      '可以。前面會從能跟上的節奏開始，不需要先練好。',
  },
  {
    id: 'event-no-fight',
    question: '會對打嗎？',
    answer:
      '不會。主要是拳套、沙包、口令和回合。',
  },
  {
    id: 'event-what-to-wear',
    question: '要穿什麼？需要帶什麼？',
    answer:
      '穿一般好活動的運動服就可以。到場會帶你進流程，需要準備的細節會在 LINE 入場確認裡提醒。',
  },
  {
    id: 'event-cancel-change',
    question: '取消、變更預訂',
    answer:
      '若付款後尚未使用，可依退款與取消政策提出申請；課程開始前 24 小時以上可協助改期，未滿 24 小時取消會依現場名額與實際安排處理。',
    linkHref: '/refund-policy',
    linkLabel: '查看退款與取消政策',
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

function getNextBookableOccurrence(
  baseCourse: WeeklyCourse,
  minDateIso: string,
  category: WeeklyCourse['category'] = 'FIGHT_NIGHT',
) {
  let date = baseCourse.date

  while (date < minDateIso) {
    date = addDays(date, 7)
  }

  const course = getWeeklyCourseForCategory(baseCourse, category)

  return {
    ...course,
    id: getDynamicCourseId(course, date),
    date,
    weekday: getWeekdayLabel(date),
  }
}

function getVenueLabel(course: WeeklyCourse) {
  return venueLabelMap[course.venueId] ?? course.venueName
}

function sortEventTicketsByVenuePriority(
  tickets: EventTicket[],
  recommendation: VenueRecommendation | null,
  getAvailability: (sessionId: string) => SessionAvailability,
  hasLiveData: boolean,
) {
  const recommendedVenueId = recommendation?.venueId
  const purchasableTickets = hasLiveData
    ? tickets.filter((ticket) => getAvailability(ticket.sessionId).remaining > 0)
    : tickets
  const sourceTickets = purchasableTickets.length > 0 ? purchasableTickets : tickets

  return [...sourceTickets].sort((a, b) => {
    const aVenuePriority =
      recommendedVenueId && a.course.venueId === recommendedVenueId ? 0 : 1
    const bVenuePriority =
      recommendedVenueId && b.course.venueId === recommendedVenueId ? 0 : 1

    if (aVenuePriority !== bVenuePriority) {
      return aVenuePriority - bVenuePriority
    }

    const aAvailabilityPriority =
      !hasLiveData || getAvailability(a.sessionId).remaining > 0 ? 0 : 1
    const bAvailabilityPriority =
      !hasLiveData || getAvailability(b.sessionId).remaining > 0 ? 0 : 1

    if (aAvailabilityPriority !== bAvailabilityPriority) {
      return aAvailabilityPriority - bAvailabilityPriority
    }

    if (a.course.date !== b.course.date) {
      return a.course.date < b.course.date ? -1 : 1
    }
    if (a.course.startTime !== b.course.startTime) {
      return a.course.startTime < b.course.startTime ? -1 : 1
    }
    return a.course.venueId < b.course.venueId ? -1 : 1
  })
}

function getCoachPricingTier(course: WeeklyCourse) {
  return findCoachProfile(course.coach)?.pricingTier ?? 'domestic-teacher'
}

function hasCoachProfile(course: WeeklyCourse) {
  return Boolean(findCoachProfile(course.coach))
}

function isDomesticTeacherCourse(course: WeeklyCourse) {
  return findCoachProfile(course.coach)?.pricingTier === 'domestic-teacher'
}

function isBasicPaidCourse(course: WeeklyCourse) {
  return course.name.includes('基礎拳擊') || course.name.includes('基礎泰拳')
}

function getEventTicketFromCourse(course: WeeklyCourse): EventTicket {
  return {
    id: course.id,
    course,
    sessionId: course.id,
    title: eventName,
    dateLabel: formatDateLabel(course.date),
    timeLabel: `${course.startTime}-${course.endTime}`,
    venueLabel: getVenueLabel(course),
  }
}

function getPaidEventTickets(limit = 72): EventTicket[] {
  const bookableFromIso = addDays(
    getTaipeiTodayIso(),
    ONLINE_BOOKING_START_OFFSET_DAYS,
  )

  return weeklyCourses
    .filter(
      (course) =>
        hasCoachProfile(course) &&
        (isWeeklyCourseAvailableForCategory(course, 'FIGHT_NIGHT') ||
          isBasicPaidCourse(course)),
    )
    .map((course) =>
      getNextBookableOccurrence(
        course,
        bookableFromIso,
        isBasicPaidCourse(course) ? 'BOOT_CAMP' : 'FIGHT_NIGHT',
      ),
    )
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1
      if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1
      return a.venueId < b.venueId ? -1 : 1
    })
    .slice(0, limit)
    .map(getEventTicketFromCourse)
}

function getWeeklyFreeTrialTickets(limit = 4): EventTicket[] {
  const bookableFromIso = addDays(
    getTaipeiTodayIso(),
    ONLINE_BOOKING_START_OFFSET_DAYS,
  )

  return weeklyCourses
    .filter(
      (course) =>
        hasCoachProfile(course) &&
        isDomesticTeacherCourse(course) &&
        isWeeklyCourseAvailableForCategory(course, 'FIGHT_NIGHT'),
    )
    .map((course) => getNextBookableOccurrence(course, bookableFromIso))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1
      if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1
      return a.venueId < b.venueId ? -1 : 1
    })
    .slice(0, limit)
    .map(getEventTicketFromCourse)
}

function getRemainingLabel(
  availability: SessionAvailability,
  hasLiveData: boolean,
) {
  if (!hasLiveData) {
    return '精選課程'
  }
  if (availability.remaining <= 0) return '候補中'
  if (availability.remaining <= 3) {
    return `最後名額剩下${availability.remaining}位`
  }
  return '精選課程'
}

function getEventCoachProofTag(coachProfile: CoachProfile | null) {
  if (coachProfile?.id === 'andre') return '世界冠軍教練'
  if (coachProfile?.id === 'bruno') return '職業泰拳 14 勝'
  if (coachProfile?.id === 'got') return '泰拳教師'
  if (coachProfile?.id === 'mario') return '職業 MMA 28 勝'
  if (coachProfile?.id === 'rafael') return '柔術黑帶 4 段'
  if (coachProfile?.id === 'sim') return '技擊教練資格'
  if (coachProfile?.id === 'mengyan') return '拳擊四連霸'

  return coachProfile?.pricingTier === 'foreign-fighter'
    ? '國際實戰背景'
    : null
}

function getEventCoachPreviewTags(coachProfile: CoachProfile | null) {
  if (!coachProfile) return []

  const tagsByCoach: Record<string, string[]> = {
    andre: ['泰拳 / MMA', '泰拳世界冠軍', '巴西教練', '國際實戰背景'],
    bruno: ['泰拳 / MMA', '職業泰拳選手', '巴柔黑帶', '國際實戰背景'],
    got: ['泰拳 / 踢拳', '職業選手靶師', '泰拳教師', '泰國訓練背景'],
    mario: ['巴西柔術 / MMA', '職業 MMA 選手', '巴柔黑帶', '國際實戰背景'],
    rafael: ['巴柔黑帶 4 段', '職業 MMA 選手', '巴西教練', '國際實戰背景'],
    sim: ['柔道 / 綜合格鬥', '柔道代表隊教練', '技擊教練資格'],
    mengyan: ['拳擊 / 戰鬥體適能', '大專盃拳擊四連霸', '拳擊隊背景'],
  }
  const fallbackTags = [
    ...coachProfile.specialties.slice(0, 3),
    getEventCoachProofTag(coachProfile),
  ]

  return Array.from(new Set(tagsByCoach[coachProfile.id] ?? fallbackTags))
    .filter((tag): tag is string => Boolean(tag))
    .slice(0, 4)
}

function getEventTicketPrice(
  ticket: EventTicket,
  availability: SessionAvailability,
  variant: EventPassVariant = defaultEventPassVariant,
): EventTicketPrice {
  const pricingTier = getCoachPricingTier(ticket.course)
  const coachProfile = findCoachProfile(ticket.course.coach)
  const basePrice = getCoursePriceModel({
    course: ticket.course,
    pricingTier,
    packageSize: 1,
    remaining: availability.remaining,
    coachId: coachProfile?.id,
  })
  const amount =
    typeof variant.fixedAmount === 'number'
      ? variant.fixedAmount
      : basePrice.amount + variant.priceDelta
  const compareAtAmount =
    typeof variant.fixedAmount === 'number'
      ? undefined
      : typeof basePrice.compareAtAmount === 'number'
      ? basePrice.compareAtAmount + variant.priceDelta
      : undefined

  return {
    amount,
    label: formatCoursePrice(amount),
    originalAmount: amount,
    originalLabel: formatCoursePrice(amount),
    compareAtAmount,
    compareAtLabel:
      typeof compareAtAmount === 'number'
        ? formatCoursePrice(compareAtAmount)
        : undefined,
    offerApplied: false,
    pricingTier,
  }
}

function getEventPurchaseLabel(
  price: EventTicketPrice,
  variant: EventPassVariant = defaultEventPassVariant,
) {
  return `${price.label}｜保留 ${variant.ctaName}`
}

function AutoFitButtonLabel({
  children,
  maxSize = 16,
  minSize = 11.5,
}: {
  children: string
  maxSize?: number
  minSize?: number
}) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null)
  const contentRef = useRef<HTMLSpanElement | null>(null)
  const [fontSize, setFontSize] = useState(maxSize)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const content = contentRef.current
    if (!wrapper || !content) return

    const fitText = () => {
      const availableWidth = wrapper.clientWidth
      if (availableWidth <= 0) return

      content.style.fontSize = `${maxSize}px`
      const naturalWidth = content.scrollWidth
      if (naturalWidth <= 0) return

      const nextSize = Math.max(
        minSize,
        Math.min(maxSize, (availableWidth / naturalWidth) * maxSize),
      )
      setFontSize(Number(nextSize.toFixed(2)))
    }

    fitText()
    const resizeObserver = new ResizeObserver(fitText)
    resizeObserver.observe(wrapper)

    return () => resizeObserver.disconnect()
  }, [children, maxSize, minSize])

  return (
    <span
      ref={wrapperRef}
      className="block min-w-0 flex-1 overflow-hidden text-center leading-none"
    >
      <span
        ref={contentRef}
        className="inline-block whitespace-nowrap font-heading font-semibold leading-tight"
        style={{ fontSize }}
      >
        {children}
      </span>
    </span>
  )
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

function setEventMoreSessionsIntent() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(eventMoreSessionsIntentKey, '1')
  if (window.location.hash !== eventMoreSessionsHash) {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${eventMoreSessionsHash}`,
    )
  }
}

function consumeEventMoreSessionsIntent() {
  if (typeof window === 'undefined') return false
  const hasIntent =
    window.sessionStorage.getItem(eventMoreSessionsIntentKey) === '1' ||
    window.location.hash === eventMoreSessionsHash
  window.sessionStorage.removeItem(eventMoreSessionsIntentKey)
  return hasIntent
}

function scrollToMoreSessions() {
  if (typeof window === 'undefined') return
  window.setTimeout(() => {
    document
      .getElementById('event-more-sessions')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 120)
}

function isLocalLoggedInPreview() {
  if (typeof window === 'undefined') return false

  const isLocalHost =
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost'
  if (!isLocalHost) return false

  return window.location.search.includes('preview=logged-in')
}

function EventSectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string
  title: string
  children?: string
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="font-heading text-sm font-bold text-blaze/82">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 font-heading text-[2rem] font-black leading-tight text-pearl">
        {title}
      </h2>
      {children && (
        <p className="mt-4 text-base leading-relaxed text-mist/76">
          {children}
        </p>
      )}
    </div>
  )
}

function EventStandalonePhotoSection({
  id,
  src,
  alt,
  loading = 'lazy',
}: {
  id: string
  src: string
  alt: string
  loading?: 'eager' | 'lazy'
}) {
  return (
    <SectionWrapper
      id={id}
      className="max-w-[430px] px-0 sm:px-0"
      padding="py-0"
    >
      <motion.figure
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="overflow-hidden border-y border-pearl/10 bg-black/30"
      >
        <img
          src={src}
          alt={alt}
          className="block h-auto w-full"
          loading={loading}
          decoding="async"
        />
      </motion.figure>
    </SectionWrapper>
  )
}

function EventHeroSection({
  onPrimaryAction,
}: {
  onPrimaryAction: () => void
}) {
  return (
    <section
      id="event-hero"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(245,98,45,0.22),transparent_30%),linear-gradient(180deg,#090909,#050505)] text-pearl"
    >
      <motion.figure
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.65 }}
        className="border-b border-pearl/10 bg-black"
      >
        <img
          src={eventHeroEmotion}
          alt="TRAIN DIFFERENT Fight Night 情緒體驗主視覺"
          className="block h-auto w-full"
          loading="eager"
          decoding="async"
        />
      </motion.figure>

      <div className="relative z-10 mx-auto flex max-w-[430px] items-end px-4 pb-9 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          className="max-w-full"
        >
          <p className="font-heading text-sm font-bold text-neon">
            FIGHT NIGHT
          </p>
          <h1 className="mt-4 font-heading text-[2.65rem] font-black leading-[0.98] text-pearl">
            下班後，進入另一種夜晚。
          </h1>
          <p className="mt-5 text-base leading-relaxed text-mist/84">
            你推門進 UFC GYM 的時候，白天還黏在身上。場地是紅的、黑的，音樂很近，有人已經戴好拳套在笑。第一聲倒數落下來，你會知道：這不是來上一堂課，是今晚真的要開始了。
          </p>

          <Button
            size="lg"
            className="mt-8 w-full"
            onClick={onPrimaryAction}
            data-cta="event-hero-primary"
          >
            看這一晚有多好玩
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

function EventReframeSection() {
  return (
    <SectionWrapper
      id="event-reframe"
      className="max-w-[430px] px-4 sm:px-4"
      padding="py-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
      >
        <EventSectionHeading
          title="自然而然，跟上現場氛圍。"
        >
          不用先懂拳擊，教練會把節奏拆到你跟得上，旁邊的人開始出聲，沙包一下一下響起來。
        </EventSectionHeading>
        <p className="text-base leading-relaxed text-mist/76">
          你原本還有點保留，幾分鐘後，手會自己抬起來，嘴角也會自己上揚。
        </p>
      </motion.div>
    </SectionWrapper>
  )
}

function EventProofSection() {
  return (
    <SectionWrapper
      id="event-proof"
      className="max-w-[430px] px-4 sm:px-4"
      padding="py-8"
    >
      <EventSectionHeading title="低沉悶響，將日常與當下切開。" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="space-y-4 border-y border-pearl/10 py-5 text-base leading-relaxed text-mist/78"
      >
        <p>
          拳套碰到沙包的那一下很近，低低的一聲，會把注意力拉回身體。
        </p>
        <p>
          倒數越來越短，教練的口令、旁邊的呼吸、自己的心跳疊在一起；時間會變慢，感官會變清晰，壓力會留在黑底紅字的沙包上，彷彿自己正在蛻變得不一樣。
        </p>
      </motion.div>
    </SectionWrapper>
  )
}

function EventSafetySection() {
  const items = [
    {
      title: '不用入會',
      body: '這張 Pass 只買這一晚。',
    },
    {
      title: '不用被推銷',
      body: '線上付款，LINE 留票，到場進場。',
    },
    {
      title: '新手也能玩得進去',
      body: '從跟得上的節奏開始，不用先練好。',
    },
  ]

  return (
    <SectionWrapper
      id="event-easy-entry"
      className="max-w-[430px] px-4 sm:px-4"
      padding="py-8"
    >
      <EventSectionHeading title="第一次來，也可以很單純。" />

      <div className="grid gap-3">
        {items.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.04 }}
            className="rounded-xl border border-pearl/10 bg-pearl/[0.035] px-4 py-4"
          >
            <h3 className="font-heading text-lg font-bold text-pearl">
              {item.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-mist/72">
              {item.body}
            </p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}

function EventFlowPreviewSection() {
  return (
    <SectionWrapper
      id="event-flow-preview"
      className="max-w-[430px] px-4 sm:px-4"
      padding="py-8"
    >
      <EventSectionHeading title="愉快的餘韻會留在場上。" />
      <p className="text-base leading-relaxed text-mist/76">
        手還熱，沙包還在晃，旁邊的人也在喘，也在笑。
      </p>
      <p className="mt-4 text-base leading-relaxed text-mist/76">
        聽著教練預告下回內容，用眼神約好下次一起上課。
      </p>
      <p className="mt-4 text-base leading-relaxed text-mist/76">
        不自覺的，漸漸融入這個能量飽滿的社群。
      </p>
      <p className="mt-4 text-base leading-relaxed text-mist/76">
        覺得有點想試，就把這一晚留下來吧。
      </p>
      <Button
        size="lg"
        className="mt-6 w-full"
        onClick={() => scrollToId('event-entry')}
        data-cta="event-afterglow-cta"
      >
        把這一晚留下來
      </Button>
    </SectionWrapper>
  )
}

function EventCoachProfileDetailList({
  title,
  items,
  tone = 'pearl',
}: {
  title: string
  items?: string[]
  tone?: EventCoachProfileDetailTone
}) {
  if (!items?.length) return null

  const toneClasses: Record<
    EventCoachProfileDetailTone,
    { box: string; title: string; dot: string }
  > = {
    pearl: {
      box: 'border-pearl/10 bg-black/22',
      title: 'text-mist/55',
      dot: 'bg-mist/65',
    },
    neon: {
      box: 'border-neon/18 bg-neon/8',
      title: 'text-neon/85',
      dot: 'bg-neon',
    },
    blaze: {
      box: 'border-blaze/20 bg-blaze/10',
      title: 'text-blaze/85',
      dot: 'bg-blaze',
    },
  }
  const classes = toneClasses[tone]

  return (
    <div className={`rounded-2xl border p-4 ${classes.box}`}>
      <p
        className={`text-xs font-heading uppercase tracking-[0.2em] ${classes.title}`}
      >
        {title}
      </p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex gap-2 text-sm leading-relaxed text-mist/78"
          >
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${classes.dot}`}
            />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EventTicketInfoModal({
  selectedTicket,
  availability,
  hasLiveData,
  onClose,
}: {
  selectedTicket: EventTicket | null
  availability: SessionAvailability | null
  hasLiveData: boolean
  onClose: () => void
}) {
  if (!selectedTicket || !availability || typeof document === 'undefined') {
    return null
  }

  const coachProfile = findCoachProfile(selectedTicket.course.coach)
  const coachLabel =
    coachProfile?.shortName ?? getCoachDisplayName(selectedTicket.course.coach)
  const coachInitial = coachLabel.slice(0, 1).toUpperCase()
  const coachPreviewTags = getEventCoachPreviewTags(
    coachProfile,
  )
  const remainingLabel = getRemainingLabel(availability, hasLiveData)
  const nearbyAreaLabel =
    venueNearbyAreaLabelMap[selectedTicket.course.venueId]
  const courseFacts = [
    {
      label: '時間',
      value: `${selectedTicket.dateLabel}｜${selectedTicket.timeLabel}`,
    },
    {
      label: '場館',
      value: nearbyAreaLabel
        ? `${selectedTicket.venueLabel}｜${nearbyAreaLabel}`
        : selectedTicket.venueLabel,
    },
    {
      label: '狀態',
      value: remainingLabel,
    },
  ]
  const coachParagraphs = coachProfile
    ? coachProfile.bio?.length
      ? coachProfile.bio.slice(0, 2)
      : [coachProfile.intro]
    : [`${coachLabel} 教練會帶你進入這一場 Fight Night。`]

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/78 p-0 backdrop-blur-sm md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${selectedTicket.course.name} 教練與課程資訊`}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[100dvh] w-full max-w-2xl overflow-y-auto rounded-none border-y border-pearl/15 bg-abyss shadow-2xl shadow-black/50 md:max-h-[92vh] md:rounded-3xl md:border"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-pearl/10 bg-abyss/95 px-4 py-3 backdrop-blur md:px-6">
          <div>
            <p className="text-[10px] font-heading uppercase tracking-[0.24em] text-neon/80">
              教練與課程資訊
            </p>
            <p className="mt-0.5 text-xs text-mist/55">
              {selectedTicket.dateLabel} · {selectedTicket.timeLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-interaction-hint
            className="interaction-hint flex h-10 w-10 items-center justify-center rounded-full border border-pearl/15 bg-black/35 font-heading text-lg font-black text-pearl transition-colors hover:bg-black/55"
            aria-label="關閉教練與課程資訊"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-5 md:p-6">
          <section className="rounded-2xl border border-pearl/10 bg-black/25 p-4">
            <div className="flex items-center gap-3">
              {coachProfile ? (
                <img
                  src={coachProfile.photo}
                  alt={coachProfile.displayName}
                  className="h-16 w-16 shrink-0 rounded-full border border-neon/30 object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-pearl/10 bg-pearl/8 font-heading text-xl font-black text-mist">
                  {coachInitial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-heading text-2xl font-black leading-none text-pearl">
                  {coachLabel}
                </p>
                <p className="mt-1 text-sm font-heading text-mist/72">
                  {coachProfile?.role ?? 'Fight Night 教練'}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {coachPreviewTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-pearl/10 bg-pearl/5 px-2 py-0.5 text-[10px] leading-snug text-mist/72"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {coachParagraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-relaxed text-mist/82"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {coachProfile?.trustPoints.length ? (
              <div className="mt-4 rounded-2xl border border-neon/16 bg-neon/8 p-4">
                <p className="text-xs font-heading uppercase tracking-[0.2em] text-neon/85">
                  為什麼值得跟他上這堂
                </p>
                <div className="mt-3 grid gap-2">
                  {coachProfile.trustPoints.map((point) => (
                    <div
                      key={point}
                      className="flex gap-2 text-sm leading-relaxed text-mist/78"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {coachProfile ? (
            <div className="grid gap-3">
              <EventCoachProfileDetailList
                title="資格證明"
                items={coachProfile.certifications?.slice(0, 4)}
                tone="neon"
              />
              <EventCoachProfileDetailList
                title="教學 / 經歷"
                items={coachProfile.experience?.slice(0, 4)}
              />
              <EventCoachProfileDetailList
                title="比賽成就"
                items={coachProfile.achievements?.slice(0, 4)}
                tone="blaze"
              />
            </div>
          ) : null}

          <section className="rounded-2xl border border-blaze/24 bg-blaze/10 p-4">
            <p className="text-xs font-heading uppercase tracking-[0.2em] text-neon">
              課程資訊
            </p>
            <h3 className="mt-3 font-heading text-2xl font-black leading-tight text-pearl">
              {selectedTicket.course.name}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-mist/78">
              這堂會由教練帶你跟上現場節奏，從能進入的動作開始。
            </p>

            <div className="mt-4 grid gap-2">
              {courseFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-xl border border-pearl/10 bg-black/24 px-3 py-2"
                >
                  <p className="text-[10px] font-heading tracking-[0.16em] text-mist/42">
                    {fact.label}
                  </p>
                  <p className="mt-0.5 text-sm font-heading font-semibold leading-snug text-pearl/88">
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={onClose}
            data-cta="event-ticket-info-close"
          >
            回到場次選擇
          </Button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

function EventPassHighlightRow({
  item,
  onOpenProduct,
}: {
  item: EventPassHighlight
  onOpenProduct: (productId: EventProductId) => void
}) {
  return (
    <div className="grid grid-cols-[0.45rem_minmax(0,1fr)] gap-2 break-words text-xs leading-relaxed text-mist/74">
      <span className="mt-[0.43rem] h-1.5 w-1.5 rounded-full bg-neon" />
      <span className="min-w-0">
        {item.productId ? (
          <button
            type="button"
            onClick={() => onOpenProduct(item.productId as EventProductId)}
            data-interaction-hint
            className="interaction-hint inline-flex max-w-full items-center gap-1.5 rounded-full border border-neon/24 bg-neon/10 px-2 py-0.5 align-baseline font-heading text-pearl transition-colors hover:border-neon/48 hover:bg-neon/16 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/70"
          >
            <span className="truncate">{item.title}</span>
            <span className="shrink-0 rounded-full border border-neon/20 px-1.5 py-0.5 text-[10px] leading-none text-neon/90">
              查看照片
            </span>
          </button>
        ) : (
          <strong className="break-words font-heading text-pearl">
            {item.title}
          </strong>
        )}
        <span className="text-mist/56">｜</span>
        {item.body}
      </span>
    </div>
  )
}

function EventProductPhotoModal({
  selectedProductId,
  onClose,
}: {
  selectedProductId: EventProductId | null
  onClose: () => void
}) {
  if (!selectedProductId || typeof document === 'undefined') {
    return null
  }

  const product = eventProductDetails[selectedProductId]

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/82 p-0 backdrop-blur-sm md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[100dvh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl border-t border-pearl/15 bg-abyss p-4 shadow-2xl shadow-black/60 md:max-h-[92vh] md:rounded-3xl md:border"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-heading text-[10px] uppercase tracking-[0.24em] text-neon/80">
              PRODUCT
            </p>
            <h2 className="mt-2 font-heading text-2xl font-black leading-tight text-pearl">
              {product.title}
            </h2>
            <p className="mt-1 text-sm text-mist/64">{product.body}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-interaction-hint
            className="interaction-hint flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pearl/15 bg-black/35 font-heading text-lg font-black text-pearl transition-colors hover:bg-black/55"
            aria-label="關閉商品照片"
          >
            ×
          </button>
        </div>
        <img
          src={product.image}
          alt={product.alt}
          className="mt-4 h-auto max-h-[72dvh] w-full rounded-2xl border border-pearl/10 bg-black/30 object-contain"
        />
      </motion.div>
    </motion.div>,
    document.body,
  )
}

function EventTicketCard({
  ticket,
  variant,
  availability,
  hasLiveData,
  preferences,
  onPreferenceChange,
  onOpenInfo,
  onOpenProduct,
  onPurchase,
}: {
  ticket: EventTicket
  variant: EventPassVariant
  availability: SessionAvailability
  hasLiveData: boolean
  preferences: EventServicePreferences
  onPreferenceChange: (
    key: keyof EventServicePreferences,
    value: boolean,
  ) => void
  onOpenInfo: (ticket: EventTicket) => void
  onOpenProduct: (productId: EventProductId) => void
  onPurchase: (ticket: EventTicket, variant: EventPassVariant) => void
}) {
  const remainingLabel = getRemainingLabel(availability, hasLiveData)
  const price = getEventTicketPrice(
    ticket,
    availability,
    variant,
  )
  const disabled = hasLiveData && availability.remaining <= 0
  const nearbyAreaLabel = venueNearbyAreaLabelMap[ticket.course.venueId]
  const coachProfile = findCoachProfile(ticket.course.coach)
  const coachLabel =
    coachProfile?.shortName ?? getCoachDisplayName(ticket.course.coach)
  const coachInitial = coachLabel.slice(0, 1).toUpperCase()
  const coachPreviewTags = getEventCoachPreviewTags(
    coachProfile,
  )

  return (
    <motion.article
      aria-label={`${variant.title}，${ticket.dateLabel} ${ticket.timeLabel}，${ticket.venueLabel}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="relative flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-pearl/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(0,0,0,0.34))] shadow-[0_18px_52px_rgba(0,0,0,0.24)]"
    >
      <div className="relative shrink-0 border-b border-pearl/10 bg-[radial-gradient(circle_at_18%_18%,rgba(245,98,45,0.18),transparent_34%),linear-gradient(135deg,rgba(0,0,0,0.94),rgba(12,12,12,0.72))] p-3.5">
        <div className="relative z-10">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              <span className="rounded-full border border-pearl/15 bg-black/20 px-3 py-1.5 font-heading text-xs text-pearl">
                {ticket.venueLabel}
              </span>
              {nearbyAreaLabel ? (
                <span className="rounded-full border border-neon/20 bg-neon/10 px-3 py-1.5 font-heading text-xs text-neon">
                  {nearbyAreaLabel}
                </span>
              ) : null}
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-full border border-neon/25 bg-neon/10 px-3 py-1 text-xs font-heading text-neon">
              {remainingLabel}
            </span>
          </div>

          <div className="mt-5 min-w-0">
            <h3 className="whitespace-nowrap font-heading text-[1.06rem] font-black leading-tight text-pearl">
              {variant.title}
            </h3>
            <p className="mt-2 font-heading text-sm text-mist/84">
              {ticket.dateLabel}｜{ticket.timeLabel}
            </p>

            <button
              type="button"
              onClick={() => onOpenInfo(ticket)}
              data-interaction-hint
              className="coach-avatar-trigger interaction-hint mt-4 flex w-full min-w-0 items-center gap-3 rounded-xl border border-pearl/10 bg-black/22 p-2 text-left transition-colors hover:border-neon/28 hover:bg-neon/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/70"
              aria-label={`查看 ${coachLabel} 教練與 ${ticket.course.name} 課程資訊`}
            >
              {coachProfile ? (
                <img
                  src={coachProfile.photo}
                  alt={coachProfile.displayName}
                  loading="lazy"
                  className="h-11 w-11 shrink-0 rounded-full border border-neon/30 object-cover"
                />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pearl/10 bg-pearl/8 font-heading text-base font-black text-mist">
                  {coachInitial}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-heading font-semibold leading-snug text-pearl">
                  {ticket.course.name}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="font-heading text-xs font-semibold text-neon/85">
                    {coachLabel} 教練
                  </span>
                  {coachPreviewTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-pearl/10 bg-pearl/5 px-2 py-0.5 text-[10px] leading-snug text-mist/72"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-neon/20 px-2 py-1 font-heading text-[10px] text-neon/80">
                查看
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-b border-pearl/10 px-4 py-3">
        {variant.highlights.map((item) => (
          <EventPassHighlightRow
            key={item.title}
            item={item}
            onOpenProduct={onOpenProduct}
          />
        ))}
      </div>

      <div className="shrink-0 px-4 py-3">
        <EventPreferenceControls
          preferences={preferences}
          onPreferenceChange={onPreferenceChange}
        />
      </div>

      <div className="mt-auto px-4 pb-4 pt-3">
        <Button
          size="lg"
          className="w-full"
          disabled={disabled}
          onClick={() => onPurchase(ticket, variant)}
          data-cta="event-ticket-purchase"
          data-ticket={ticket.id}
        >
          <AutoFitButtonLabel>
            {disabled ? '本場候補中' : getEventPurchaseLabel(price, variant)}
          </AutoFitButtonLabel>
        </Button>
      </div>
    </motion.article>
  )
}

function FreeTrialTicketCard({
  ticket,
  availability,
  hasLiveData,
  freeTrialStatus,
  onOpenInfo,
  onReserve,
  onPaidFallback,
}: {
  ticket: EventTicket
  availability: SessionAvailability
  hasLiveData: boolean
  freeTrialStatus: FreeTrialStatusState
  onOpenInfo: (ticket: EventTicket) => void
  onReserve: (ticket: EventTicket) => void
  onPaidFallback: (ticket: EventTicket) => void
}) {
  const used = freeTrialStatus === 'used'
  const statusUnavailable = freeTrialStatus === 'unavailable'
  const remainingLabel = getRemainingLabel(availability, hasLiveData)
  const disabled = hasLiveData && availability.remaining <= 0
  const nearbyAreaLabel = venueNearbyAreaLabelMap[ticket.course.venueId]
  const coachProfile = findCoachProfile(ticket.course.coach)
  const coachLabel =
    coachProfile?.shortName ?? getCoachDisplayName(ticket.course.coach)
  const coachInitial = coachLabel.slice(0, 1).toUpperCase()
  const coachPreviewTags = getEventCoachPreviewTags(coachProfile)

  return (
    <motion.article
      aria-label={`本週限量免費體驗課，${ticket.dateLabel} ${ticket.timeLabel}，${ticket.venueLabel}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="relative flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-pearl/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(0,0,0,0.34))] shadow-[0_18px_52px_rgba(0,0,0,0.24)]"
    >
      <div className="relative shrink-0 border-b border-pearl/10 bg-[radial-gradient(circle_at_18%_18%,rgba(245,98,45,0.18),transparent_34%),linear-gradient(135deg,rgba(0,0,0,0.94),rgba(12,12,12,0.72))] p-3.5">
        <div className="relative z-10">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              <span className="rounded-full border border-pearl/15 bg-black/20 px-3 py-1.5 font-heading text-xs text-pearl">
                {ticket.venueLabel}
              </span>
              {nearbyAreaLabel ? (
                <span className="rounded-full border border-neon/20 bg-neon/10 px-3 py-1.5 font-heading text-xs text-neon">
                  {nearbyAreaLabel}
                </span>
              ) : null}
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-full border border-neon/25 bg-neon/10 px-3 py-1 text-xs font-heading text-neon">
              {used ? '一般體驗' : '首次限定'}
            </span>
          </div>

          <div className="mt-5 min-w-0">
            <h3 className="whitespace-nowrap font-heading text-[1.06rem] font-black leading-tight text-pearl">
              {used ? '一般單堂體驗' : '本週限量免費體驗課'}
            </h3>
            <p className="mt-2 font-heading text-sm text-mist/84">
              {ticket.dateLabel}｜{ticket.timeLabel}
            </p>
            <p className="mt-1 font-heading text-xs text-neon/80">
              {remainingLabel}
            </p>

            <button
              type="button"
              onClick={() => onOpenInfo(ticket)}
              data-interaction-hint
              className="coach-avatar-trigger interaction-hint mt-4 flex w-full min-w-0 items-center gap-3 rounded-xl border border-pearl/10 bg-black/22 p-2 text-left transition-colors hover:border-neon/28 hover:bg-neon/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/70"
              aria-label={`查看 ${coachLabel} 教練與 ${ticket.course.name} 課程資訊`}
            >
              {coachProfile ? (
                <img
                  src={coachProfile.photo}
                  alt={coachProfile.displayName}
                  loading="lazy"
                  className="h-11 w-11 shrink-0 rounded-full border border-neon/30 object-cover"
                />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pearl/10 bg-pearl/8 font-heading text-base font-black text-mist">
                  {coachInitial}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-heading font-semibold leading-snug text-pearl">
                  {ticket.course.name}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="font-heading text-xs font-semibold text-neon/85">
                    {coachLabel} 教練
                  </span>
                  {coachPreviewTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-pearl/10 bg-pearl/5 px-2 py-0.5 text-[10px] leading-snug text-mist/72"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-neon/20 px-2 py-1 font-heading text-[10px] text-neon/80">
                查看
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-b border-pearl/10 px-4 py-3">
        <p className="grid grid-cols-[0.45rem_minmax(0,1fr)] gap-2 break-words text-xs leading-relaxed text-mist/74">
          <span className="mt-[0.43rem] h-1.5 w-1.5 rounded-full bg-neon" />
          <span>
            <strong className="break-words font-heading text-pearl">
              一般體驗流程
            </strong>
            <span className="text-mist/56">｜</span>
            裝備可自備，或現場租用。
          </span>
        </p>
        <p className="grid grid-cols-[0.45rem_minmax(0,1fr)] gap-2 break-words text-xs leading-relaxed text-mist/74">
          <span className="mt-[0.43rem] h-1.5 w-1.5 rounded-full bg-neon" />
          <span>
            <strong className="break-words font-heading text-pearl">
              {used ? '已使用首次限定' : '首次限定'}
            </strong>
            <span className="text-mist/56">｜</span>
            {used ? '這堂可用一般單堂價保留。' : '每個 LINE 帳號限保留一次。'}
          </span>
        </p>
      </div>

      <div className="mt-auto px-4 pb-4 pt-3">
        <Button
          size="lg"
          className="w-full"
          disabled={disabled || freeTrialStatus === 'checking' || statusUnavailable}
          onClick={() => (used ? onPaidFallback(ticket) : onReserve(ticket))}
          data-cta={used ? 'event-free-trial-paid-fallback' : 'event-free-trial-reserve'}
          data-ticket={ticket.id}
        >
          <AutoFitButtonLabel>
            {disabled
              ? '本場候補中'
              : used
                ? 'NT$680｜保留這堂'
                : freeTrialStatus === 'checking'
                  ? '確認資格中'
                  : statusUnavailable
                    ? '暫時無法確認資格'
                  : '首次限定｜免費保留這堂'}
          </AutoFitButtonLabel>
        </Button>
      </div>
    </motion.article>
  )
}

function EventPreferenceControls({
  preferences,
  onPreferenceChange,
}: {
  preferences: EventServicePreferences
  onPreferenceChange: (
    key: keyof EventServicePreferences,
    value: boolean,
  ) => void
}) {
  return (
    <div className="min-w-0 max-w-full">
      <p className="font-heading text-xs text-blaze/80">入場偏好</p>
      <div className="mt-2 grid grid-cols-1 gap-2">
        {eventServicePreferenceOptions.map((option) => {
          const selected = preferences[option.id]

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onPreferenceChange(option.id, !selected)}
              className={`interaction-hint min-w-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                selected
                  ? 'border-neon/30 bg-neon/10'
                  : 'border-pearl/10 bg-black/16 hover:border-pearl/20'
              }`}
            >
              <span className="flex min-w-0 items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block break-words font-heading text-xs text-pearl">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block break-words text-[10px] leading-snug text-mist/56">
                    {option.body}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full border px-1.5 py-0.5 font-heading text-[0.62rem] ${
                    selected
                      ? 'border-neon/30 text-neon'
                      : 'border-pearl/15 text-mist/50'
                  }`}
                >
                  {selected ? '已選' : '可選'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function EventPassPreview({
  actionLabel,
  onAction,
}: {
  actionLabel: string
  onAction: () => void
}) {
  const previewItems = ['入場通行', '裝備備妥', '可選安靜模式', 'LINE 確認']

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="relative overflow-hidden rounded-2xl border border-blaze/25 bg-[radial-gradient(circle_at_18%_16%,rgba(245,98,45,0.24),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.44),rgba(0,0,0,0.24))] p-4 shadow-[0_18px_52px_rgba(0,0,0,0.24)]"
    >
      <div className="relative z-10">
        <p className="font-heading text-xs font-bold tracking-[0.2em] text-neon/80">
          FIGHT NIGHT PASS
        </p>
        <h2 className="mt-4 font-heading text-[2.25rem] font-black leading-[0.98] text-pearl">
          選一個晚上，
          <br />
          走進那個會讓人亮起來的現場。
        </h2>
        <p className="mt-5 text-base leading-relaxed text-mist/82">
          到了那天，你不用先想自己會不會。裝備、置物櫃和入場確認都會先準備好；你只要出現，戴上拳套，跟著第一聲倒數開始。
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {previewItems.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-pearl/10 bg-black/28 px-3 py-2"
            >
              <p className="font-heading text-xs text-pearl">{item}</p>
            </div>
          ))}
        </div>

        <Button
          size="lg"
          className="mt-6 w-full"
          onClick={onAction}
          data-cta="event-more-sessions-login"
        >
          {actionLabel}
        </Button>
      </div>
    </motion.article>
  )
}

function EventTicketDropSection({
  tickets,
  freeTrialTickets,
  freeTrialStatus,
  recommendation,
  showMoreSessions,
  moreSessionsActionLabel,
  preferences,
  getAvailability,
  hasLiveData,
  onShowMoreSessions,
  onPreferenceChange,
  onOpenInfo,
  onOpenProduct,
  onPurchase,
  onFreeTrialReserve,
  onFreeTrialPaidFallback,
}: {
  tickets: EventTicket[]
  freeTrialTickets: EventTicket[]
  freeTrialStatus: FreeTrialStatusState
  recommendation: VenueRecommendation | null
  showMoreSessions: boolean
  moreSessionsActionLabel: string
  preferences: EventServicePreferences
  getAvailability: (sessionId: string) => SessionAvailability
  hasLiveData: boolean
  onShowMoreSessions: () => void
  onPreferenceChange: (
    key: keyof EventServicePreferences,
    value: boolean,
  ) => void
  onOpenInfo: (ticket: EventTicket) => void
  onOpenProduct: (productId: EventProductId) => void
  onPurchase: (ticket: EventTicket, variant: EventPassVariant) => void
  onFreeTrialReserve: (ticket: EventTicket) => void
  onFreeTrialPaidFallback: (ticket: EventTicket) => void
}) {
  const visibleTickets = useMemo(
    () =>
      sortEventTicketsByVenuePriority(
        tickets,
        recommendation,
        getAvailability,
        hasLiveData,
    ),
    [getAvailability, hasLiveData, recommendation, tickets],
  )
  const visibleVenueTickets = useMemo(
    () => [...visibleTickets, ...freeTrialTickets],
    [freeTrialTickets, visibleTickets],
  )
  const firstAvailableVenueId =
    eventVenueTabs.find((tab) =>
      visibleVenueTickets.some((ticket) => ticket.course.venueId === tab.venueId),
    )?.venueId ?? eventVenueTabs[0]?.venueId
  const recommendedVenueId =
    recommendation &&
    visibleVenueTickets.some((ticket) => ticket.course.venueId === recommendation.venueId)
      ? recommendation.venueId
      : undefined
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const selectedVenueHasTickets = selectedVenueId
    ? visibleVenueTickets.some((ticket) => ticket.course.venueId === selectedVenueId)
    : false
  const activeVenueId =
    selectedVenueHasTickets
      ? selectedVenueId
      : recommendedVenueId ?? firstAvailableVenueId
  const activeVenueTickets = visibleTickets.filter(
    (ticket) => ticket.course.venueId === activeVenueId,
  )
  const activeVenueFreeTrialTickets = freeTrialTickets.filter(
    (ticket) => ticket.course.venueId === activeVenueId,
  )
  const activeVenueCards = [
    ...activeVenueTickets.flatMap((ticket) =>
      eventPassVariants.map((variant, variantIndex) => ({
        type: 'paid' as const,
        key: `${ticket.id}-${variant.id}`,
        ticket,
        variant,
        sortIndex: variantIndex,
      })),
    ),
    ...activeVenueFreeTrialTickets.map((ticket, index) => ({
      type: 'free-trial' as const,
      key: `${ticket.id}-free-trial`,
      ticket,
      sortIndex: eventPassVariants.length + index,
    })),
  ].sort((a, b) => {
    if (a.ticket.course.date !== b.ticket.course.date) {
      return a.ticket.course.date < b.ticket.course.date ? -1 : 1
    }
    if (a.ticket.course.startTime !== b.ticket.course.startTime) {
      return a.ticket.course.startTime < b.ticket.course.startTime ? -1 : 1
    }
    if (a.ticket.course.endTime !== b.ticket.course.endTime) {
      return a.ticket.course.endTime < b.ticket.course.endTime ? -1 : 1
    }
    if (a.ticket.id !== b.ticket.id) return a.ticket.id < b.ticket.id ? -1 : 1
    return a.sortIndex - b.sortIndex
  })
  const activeVenueSessionCount = new Set(
    [...activeVenueTickets, ...activeVenueFreeTrialTickets].map(
      (ticket) => ticket.id,
    ),
  ).size
  const activeVenueLabel =
    eventVenueTabs.find((tab) => tab.venueId === activeVenueId)?.label ??
    '目前場館'

  return (
    <SectionWrapper
      id="event-entry"
      className="min-w-0 scroll-mt-24 max-w-[430px] overflow-hidden px-4 sm:px-4"
      padding="py-8"
    >
      {visibleVenueTickets.length > 0 ? (
        <div className="grid min-w-0 gap-4">
          {!showMoreSessions ? (
            <EventPassPreview
              actionLabel={moreSessionsActionLabel}
              onAction={onShowMoreSessions}
            />
          ) : null}

          {showMoreSessions ? (
            <div id="event-more-sessions" className="min-w-0 max-w-full scroll-mt-24">
              <EventSectionHeading
                eyebrow="Fight Night Pass"
                title="可選場次"
              >
                {`${activeVenueLabel} 目前 ${activeVenueSessionCount} 場可選。`}
              </EventSectionHeading>
              <div
                className="mb-4 grid min-w-0 grid-cols-3 gap-2"
                role="tablist"
                aria-label="選擇場館"
              >
                {eventVenueTabs.map((tab) => {
                  const ticketCount = visibleTickets.filter(
                    (ticket) => ticket.course.venueId === tab.venueId,
                  ).length + freeTrialTickets.filter(
                    (ticket) => ticket.course.venueId === tab.venueId,
                  ).length
                  const selected = tab.venueId === activeVenueId

                  return (
                    <button
                      key={tab.venueId}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      disabled={ticketCount === 0}
                      className={`min-w-0 rounded-xl border px-2 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        selected
                          ? 'border-neon/35 bg-neon/10 text-pearl'
                          : 'border-pearl/10 bg-black/20 text-mist/62 hover:border-pearl/20'
                      }`}
                      onClick={() => setSelectedVenueId(tab.venueId)}
                    >
                      <span className="block truncate font-heading text-xs">
                        {tab.label}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] leading-snug">
                        {tab.nearbyAreaLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
              {activeVenueCards.length > 0 ? (
                <div
                  data-swipe-hint
                  className="swipe-hint flex w-full max-w-full snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-4"
                  aria-label={`${activeVenueLabel} Fight Night Pass 可選場次`}
                >
                  {activeVenueCards.map((card) => (
                    <div
                      key={card.key}
                      className="flex w-full min-w-full max-w-full shrink-0 snap-start flex-col"
                    >
                      {card.type === 'paid' ? (
                        <EventTicketCard
                          ticket={card.ticket}
                          variant={card.variant}
                          availability={getAvailability(card.ticket.sessionId)}
                          hasLiveData={hasLiveData}
                          preferences={preferences}
                          onPreferenceChange={onPreferenceChange}
                          onOpenInfo={onOpenInfo}
                          onOpenProduct={onOpenProduct}
                          onPurchase={onPurchase}
                        />
                      ) : (
                        <FreeTrialTicketCard
                          ticket={card.ticket}
                          availability={getAvailability(card.ticket.sessionId)}
                          hasLiveData={hasLiveData}
                          freeTrialStatus={freeTrialStatus}
                          onOpenInfo={onOpenInfo}
                          onReserve={onFreeTrialReserve}
                          onPaidFallback={onFreeTrialPaidFallback}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-pearl/10 bg-black/25 px-4 py-4 text-sm leading-relaxed text-mist/68">
                  這個場館目前沒有可報名場次。
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="rounded-xl border border-pearl/10 bg-black/30 px-4 py-5 text-sm leading-relaxed text-mist/72">
          下一場整理中，開放後會更新在這裡。
        </p>
      )}

    </SectionWrapper>
  )
}

function EventMinimalFooter() {
  return (
    <footer className="mx-auto max-w-[430px] px-4 pb-28 pt-8 text-xs text-mist/50">
      <div className="border-t border-pearl/10 pt-5">
        <p className="font-heading text-pearl/70">Fight Night</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <a href="/privacy-policy" className="transition-colors hover:text-neon">
            隱私政策
          </a>
          <a href="/refund-policy" className="transition-colors hover:text-neon">
            退款與取消政策
          </a>
        </div>
      </div>
    </footer>
  )
}

function CheckoutModal({
  selectedTicket,
  selectedVariant,
  availability,
  preferences,
  onClose,
}: {
  selectedTicket: EventTicket | null
  selectedVariant: EventPassVariant
  availability: SessionAvailability | null
  preferences: EventServicePreferences
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
    selectedVariant,
  )
  const checkoutServicePreferences = selectedVariant.showPreferences
    ? preferences
    : null

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
      const checkoutPrice = getEventTicketPrice(
        selectedTicket,
        availability,
        selectedVariant,
      )
      const initiateCheckoutEventId = createMetaEventId('initiate_checkout')

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
          pricingMode: eventCoursePricingMode,
          eventPassVariant: selectedVariant.id,
          equipmentPackage: selectedVariant.equipmentPackage,
          priceDelta: selectedVariant.priceDelta,
          fixedAmount: selectedVariant.fixedAmount,
          includesGloves: selectedVariant.includesGloves,
          includesWraps: selectedVariant.includesWraps,
          quotedAmountValue: checkoutPrice.amount,
          quotedOriginalAmountValue: undefined,
          sessionIds: [selectedTicket.sessionId],
          seriesDates: [selectedTicket.course.date],
          sourcePath: getSourcePath(),
          tracking: {
            ...getCheckoutTrackingContext(),
            initiateCheckoutEventId,
            landingVariant,
            eventName,
            ticketId: selectedTicket.id,
            eventPassVariant: selectedVariant.id,
            equipmentPackage: selectedVariant.equipmentPackage,
            priceDelta: selectedVariant.priceDelta,
            fixedAmount: selectedVariant.fixedAmount,
            includesGloves: selectedVariant.includesGloves,
            includesWraps: selectedVariant.includesWraps,
            handWrapAssist:
              checkoutServicePreferences?.handWrapAssist ?? false,
            quietMode: checkoutServicePreferences?.quietMode ?? false,
            noMembershipSalesFlow: true,
          },
          servicePreferences: checkoutServicePreferences,
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
          original_value: checkoutPrice.offerApplied
            ? checkoutPrice.originalAmount
            : undefined,
          discount_code: undefined,
          discount_label: undefined,
          currency: 'TWD',
          remaining: availability.remaining,
          event_product: 'fight_night_entry_ticket_no_membership',
          event_pass_variant: selectedVariant.id,
          equipment_package: selectedVariant.equipmentPackage,
          event_id: initiateCheckoutEventId,
          pricing_mode: eventCoursePricingMode,
        },
        metaStandardEvent: 'InitiateCheckout',
        metaEventId: initiateCheckoutEventId,
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
        className="relative max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-3xl border border-pearl/10 bg-obsidian p-5 shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
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
          <p className="font-heading text-xs text-neon/80">
            Fight Night Pass
          </p>
          <h2 className="mt-3 text-3xl font-heading font-bold text-pearl">
            保留這一晚
          </h2>

          <div className="mt-5 rounded-2xl border border-neon/20 bg-neon/[0.04] p-4">
            <p className="font-heading font-bold text-pearl">
              {selectedVariant.title}
            </p>
            <p className="mt-2 text-sm text-mist/70">
              {selectedTicket.venueLabel} · {selectedTicket.dateLabel}{' '}
              {selectedTicket.timeLabel}
            </p>
            <p className="mt-3 text-2xl font-heading font-bold text-neon">
              {displayPrice.label}
            </p>
            {displayPrice.compareAtLabel && (
              <p className="mt-1 text-xs text-mist/45">
                一般{' '}
                <span className="line-through">
                  {displayPrice.compareAtLabel}
                </span>
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-mist/62">
              付款後，LINE 會留下這一晚的時間、地點和入場確認。到了那天，直接走進 UFC GYM。
            </p>
            {selectedVariant.showPreferences && (
              <div className="mt-4 border-t border-pearl/10 pt-3">
                <p className="font-heading text-xs text-mist/55">入場偏好</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferences.handWrapAssist && (
                    <span className="rounded-full border border-neon/20 bg-neon/10 px-3 py-1 text-xs text-neon">
                      專人協助教學及纏手綁帶
                    </span>
                  )}
                  {preferences.quietMode && (
                    <span className="rounded-full border border-neon/20 bg-neon/10 px-3 py-1 text-xs text-neon">
                      安靜模式
                    </span>
                  )}
                  {!preferences.handWrapAssist && !preferences.quietMode && (
                    <span className="rounded-full border border-pearl/15 bg-black/20 px-3 py-1 text-xs text-mist/58">
                      現場依一般入場協助
                    </span>
                  )}
                </div>
              </div>
            )}
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
            {isSubmitting ? '正在建立付款連結...' : '前往付款，保留這一晚'}
          </Button>
          <p className="mt-3 text-center text-xs leading-relaxed text-mist/55">
            送出後會儲存這次填寫的資料，下次購買或預約會自動帶入。
          </p>
        </form>
      </motion.div>
    </div>,
    document.body,
  )
}

function FreeTrialReservationModal({
  selectedTicket,
  availability,
  onClose,
  onReserved,
}: {
  selectedTicket: EventTicket | null
  availability: SessionAvailability | null
  onClose: () => void
  onReserved: () => void
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

  const disabled = availability.remaining <= 0
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
    if (isSubmitting || disabled) return

    const lineContext = getLineRequestContext()
    if (!lineContext?.lineUserId) {
      setSubmitError('請先完成 LINE 登入後，再保留免費體驗。')
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
      const scheduleEventId = createMetaEventId('schedule')
      const response = await fetch('/api/free-trial-reservation', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          buyer: form,
          lineContext,
          course: selectedTicket.course,
          sourcePath: getSourcePath(),
          tracking: {
            ...getCheckoutTrackingContext(),
            scheduleEventId,
            landingVariant,
            eventName,
            ticketId: selectedTicket.id,
            freeTrial: true,
            firstTimeOnly: true,
          },
          client: getClientContext(),
        }),
      })

      const data = (await response.json().catch(() => null)) as
        | {
            ok?: boolean
            alreadyReserved?: boolean
            error?: string
            referenceId?: string
          }
        | null

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || '免費預約建立失敗，請稍後再試。')
      }

      track({
        event: data.alreadyReserved
          ? 'free_trial_reservation_already_exists'
          : 'free_trial_reservation_submit',
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
          remaining: availability.remaining,
          first_time_only: true,
          event_id: scheduleEventId,
        },
        metaStandardEvent: 'Schedule',
        metaEventId: scheduleEventId,
        lineEventName: 'FreeTrialReserve',
      })

      onReserved()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '免費預約建立失敗，請稍後再試。'
      setSubmitError(message)
      track({
        event: 'free_trial_reservation_error',
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
        className="relative max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-3xl border border-pearl/10 bg-obsidian p-5 shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
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
          <p className="font-heading text-xs text-neon/80">
            首次限定｜本週限量免費體驗課
          </p>
          <h2 className="mt-3 text-3xl font-heading font-bold text-pearl">
            免費保留這堂
          </h2>

          <div className="mt-5 rounded-2xl border border-neon/20 bg-neon/[0.04] p-4">
            <p className="font-heading font-bold text-pearl">
              {selectedTicket.course.name}
            </p>
            <p className="mt-2 text-sm text-mist/70">
              {selectedTicket.venueLabel} · {selectedTicket.dateLabel}{' '}
              {selectedTicket.timeLabel}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-mist/62">
              每個 LINE 帳號限保留一次。裝備可自備，或現場租用。
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
            disabled={isSubmitting || disabled}
            className="mt-6 w-full"
            data-cta="event-free-trial-submit"
          >
            {disabled
              ? '本場候補中'
              : isSubmitting
                ? '正在保留...'
                : '首次限定｜免費保留這堂'}
          </Button>
        </form>
      </motion.div>
    </div>,
    document.body,
  )
}

export function FightNightEventPage() {
  const tickets = useMemo(() => getPaidEventTickets(), [])
  const freeTrialTickets = useMemo(() => getWeeklyFreeTrialTickets(), [])
  const sessionIds = useMemo(
    () =>
      Array.from(
        new Set(
          [...tickets, ...freeTrialTickets].map((ticket) => ticket.sessionId),
        ),
      ),
    [freeTrialTickets, tickets],
  )
  const { getAvailability, hasLiveData } = useSessionAvailability(sessionIds)
  const { gateState, requestGateAccess, loginUrl } = useLiffGate()
  const { track, trackGateAccess } = useTracking()
  const [selectedTicket, setSelectedTicket] = useState<EventTicket | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<EventPassVariant>(
    defaultEventPassVariant,
  )
  const [selectedFreeTrialTicket, setSelectedFreeTrialTicket] =
    useState<EventTicket | null>(null)
  const [freeTrialStatusSnapshot, setFreeTrialStatusSnapshot] =
    useState<FreeTrialStatusSnapshot | null>(null)
  const [selectedInfoTicket, setSelectedInfoTicket] =
    useState<EventTicket | null>(null)
  const [selectedProductId, setSelectedProductId] =
    useState<EventProductId | null>(null)
  const [recommendation, setRecommendation] =
    useState<VenueRecommendation | null>(null)
  const [showMoreSessions, setShowMoreSessions] = useState(() =>
    isLocalLoggedInPreview(),
  )
  const [servicePreferences, setServicePreferences] =
    useState<EventServicePreferences>({
      handWrapAssist: true,
      quietMode: false,
    })
  const featuredTicket = tickets[0]
  const featuredAvailability = featuredTicket
    ? getAvailability(featuredTicket.sessionId)
    : null
  const featuredPrice =
    featuredTicket && featuredAvailability
      ? getEventTicketPrice(featuredTicket, featuredAvailability)
      : undefined
  const currentLineUserId =
    gateState.status === 'unlocked'
      ? getLineRequestContext()?.lineUserId ?? ''
      : ''
  const freeTrialStatus: FreeTrialStatusState =
    gateState.status !== 'unlocked'
      ? 'unknown'
      : freeTrialStatusSnapshot?.lineUserId === currentLineUserId
        ? freeTrialStatusSnapshot.status
        : 'checking'

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const loadLocationRecommendation = async () => {
      try {
        const response = await fetch('/api/location', {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) return

        const data =
          (await response.json()) as LocationRecommendationResponse
        const venueId = data.recommendation?.venueId
        if (!venueId || !(venueId in venueCoordinates) || cancelled) return

        setRecommendation({
          venueId,
          distanceKm: data.recommendation?.distanceKm,
          source: 'cloudflare',
        })
      } catch {
        // Keep the default next-event card if location cannot be inferred.
      }
    }

    void loadLocationRecommendation()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  useEffect(() => {
    track({
      event: 'event_page_view',
      params: {
        source: landingVariant,
        event_name: eventName,
        entry_ticket_flow: true,
      },
      metaStandardEvent: 'ViewContent',
      lineEventName: 'EventPageView',
    })
  }, [track])

  useEffect(() => {
    if (gateState.status !== 'unlocked') return
    if (!consumeEventMoreSessionsIntent()) return
    const revealId = window.setTimeout(() => {
      setShowMoreSessions(true)
      scrollToMoreSessions()
    }, 0)

    return () => window.clearTimeout(revealId)
  }, [gateState.status])

  useEffect(() => {
    if (gateState.status !== 'unlocked') return

    let active = true
    const lineContext = getLineRequestContext()
    const lineUserId = lineContext?.lineUserId ?? ''

    fetch('/api/free-trial-status', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        lineContext,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('free trial status unavailable')
        return response.json()
      })
      .then((data) => {
        if (!active) return
        setFreeTrialStatusSnapshot({
          lineUserId,
          status:
            data?.lineLoginRequired === true
              ? 'unavailable'
              : data?.alreadyReserved === true || data?.hasPurchased === true
                ? 'used'
                : 'available',
        })
      })
      .catch(() => {
        if (!active) return
        setFreeTrialStatusSnapshot({
          lineUserId,
          status: 'unavailable',
        })
      })

    return () => {
      active = false
    }
  }, [currentLineUserId, gateState.status])

  const updateServicePreference = (
    key: keyof EventServicePreferences,
    value: boolean,
  ) => {
    setServicePreferences((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const showMoreSessionsActionLabel =
    gateState.status === 'unlocked'
      ? '查看所有場次'
      : 'LINE 登入查看所有場次'

  const handleShowMoreSessions = async () => {
    track({
      event: 'event_more_sessions_click',
      params: {
        source: landingVariant,
        gate_status: gateState.status,
      },
    })
    setEventMoreSessionsIntent()

    if (gateState.status !== 'unlocked') {
      trackGateAccess('event_more_sessions', gateState.status)
      if (loginUrl && ['loading', 'logged-out'].includes(gateState.status)) {
        window.location.href = loginUrl
        return
      }

      const unlocked = await requestGateAccess()
      if (!unlocked) return
    }

    setShowMoreSessions(true)
    scrollToMoreSessions()
  }

  const openCheckout = async (
    ticket?: EventTicket,
    variant: EventPassVariant = defaultEventPassVariant,
  ) => {
    const targetTicket = ticket ?? featuredTicket
    if (!targetTicket) return

    track({
      event: 'event_ticket_cta_click',
      params: {
        source: landingVariant,
        ticket_id: targetTicket.id,
        course_id: targetTicket.course.id,
        gate_status: gateState.status,
        event_product: 'fight_night_entry_ticket_no_membership',
        event_pass_variant: variant.id,
        equipment_package: variant.equipmentPackage,
        price_delta: variant.priceDelta,
        includes_gloves: variant.includesGloves,
        includes_wraps: variant.includesWraps,
        hand_wrap_assist: servicePreferences.handWrapAssist,
        quiet_mode: servicePreferences.quietMode,
      },
      metaStandardEvent: 'AddToCart',
      lineEventName: 'EventTicketClick',
    })

    if (gateState.status !== 'unlocked') {
      trackGateAccess('event_entry_ticket', gateState.status)
      if (loginUrl && ['loading', 'logged-out'].includes(gateState.status)) {
        window.location.href = loginUrl
        return
      }

      const unlocked = await requestGateAccess()
      if (!unlocked) return
    }

    setSelectedVariant(variant)
    setSelectedTicket(targetTicket)
  }

  const openFreeTrialReservation = async (ticket: EventTicket) => {
    track({
      event: 'event_free_trial_cta_click',
      params: {
        source: landingVariant,
        ticket_id: ticket.id,
        course_id: ticket.course.id,
        gate_status: gateState.status,
        first_time_only: true,
        free_trial_status: freeTrialStatus,
      },
      metaStandardEvent: 'AddToCart',
      lineEventName: 'FreeTrialClick',
    })

    if (gateState.status !== 'unlocked') {
      trackGateAccess('event_free_trial', gateState.status)
      if (loginUrl && ['loading', 'logged-out'].includes(gateState.status)) {
        window.location.href = loginUrl
        return
      }

      const unlocked = await requestGateAccess()
      if (!unlocked) return
    }

    if (freeTrialStatus === 'used') {
      void openCheckout(ticket, singleClassPaidVariant)
      return
    }

    setSelectedFreeTrialTicket(ticket)
  }

  const openFreeTrialPaidFallback = async (ticket: EventTicket) => {
    await openCheckout(ticket, singleClassPaidVariant)
  }

  const structuredData = featuredTicket
    ? {
        '@type': 'Event',
        name: `${eventName} 入場票`,
        description: eventDescription,
        startDate: `${featuredTicket.course.date}T${featuredTicket.course.startTime}:00+08:00`,
        endDate: `${featuredTicket.course.date}T${featuredTicket.course.endTime}:00+08:00`,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        image: [eventHeroEmotion],
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
    <div className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden bg-abyss text-pearl shadow-[0_0_90px_rgba(0,0,0,0.45)]">
      <Seo
        title="Fight Night｜Fight Night Pass"
        description={eventDescription}
        canonicalPath="/fight-night-event"
        keywords={[
          'Fight Night',
          'Fight Night Pass',
          'UFC GYM',
          '運動娛樂',
          '夜間運動',
          '沙包聲',
        ]}
        image={eventHeroEmotion}
        structuredData={structuredData}
      />
      <Header />
      <main>
        <EventHeroSection
          onPrimaryAction={() => scrollToId('event-entry')}
        />
        <EventStandalonePhotoSection
          id="event-group-photo"
          src={eventGroupEnergy}
          alt="Fight Night 小團體被現場節奏帶起來"
        />
        <EventReframeSection />
        <EventStandalonePhotoSection
          id="event-impact-photo"
          src={eventBagImpact}
          alt="教練口令、黑色沙包與拳套落點"
        />
        <EventProofSection />
        <EventSafetySection />
        <EventTicketDropSection
          tickets={tickets}
          freeTrialTickets={freeTrialTickets}
          freeTrialStatus={freeTrialStatus}
          recommendation={recommendation}
          showMoreSessions={showMoreSessions}
          moreSessionsActionLabel={showMoreSessionsActionLabel}
          preferences={servicePreferences}
          getAvailability={getAvailability}
          hasLiveData={hasLiveData}
          onShowMoreSessions={() => {
            void handleShowMoreSessions()
          }}
          onPreferenceChange={updateServicePreference}
          onOpenInfo={setSelectedInfoTicket}
          onOpenProduct={setSelectedProductId}
          onPurchase={openCheckout}
          onFreeTrialReserve={(ticket) => {
            void openFreeTrialReservation(ticket)
          }}
          onFreeTrialPaidFallback={(ticket) => {
            void openFreeTrialPaidFallback(ticket)
          }}
        />
        <EventStandalonePhotoSection
          id="event-afterglow-photo"
          src={eventAfterglow}
          alt="Fight Night 結束後笑出來的放鬆感"
        />
        <EventFlowPreviewSection />
        <FAQSection
          id="event-faq"
          title="第一次來，先看這幾個。"
          subtitle=""
          items={eventFaqItems}
          compact
        />
      </main>
      <EventMinimalFooter />
      <StickyActionBar
        eyebrow="Fight Night Pass"
        title="Fight Night"
        detail={showMoreSessions ? '選擇方案｜線上付款｜LINE 確認' : 'Fight Night Pass'}
        actionLabel={
          showMoreSessions ? '把這一晚留下來' : showMoreSessionsActionLabel
        }
        onAction={() => {
          if (showMoreSessions) {
            scrollToId('event-entry')
            return
          }

          void handleShowMoreSessions()
        }}
      />
      <CheckoutModal
        selectedTicket={selectedTicket}
        selectedVariant={selectedVariant}
        availability={
          selectedTicket ? getAvailability(selectedTicket.sessionId) : null
        }
        preferences={servicePreferences}
        onClose={() => {
          setSelectedTicket(null)
          setSelectedVariant(defaultEventPassVariant)
        }}
      />
      <FreeTrialReservationModal
        selectedTicket={selectedFreeTrialTicket}
        availability={
          selectedFreeTrialTicket
            ? getAvailability(selectedFreeTrialTicket.sessionId)
            : null
        }
        onClose={() => setSelectedFreeTrialTicket(null)}
        onReserved={() =>
          setFreeTrialStatusSnapshot({
            lineUserId: currentLineUserId,
            status: 'used',
          })
        }
      />
      <EventProductPhotoModal
        selectedProductId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />
      <EventTicketInfoModal
        selectedTicket={selectedInfoTicket}
        availability={
          selectedInfoTicket
            ? getAvailability(selectedInfoTicket.sessionId)
            : null
        }
        hasLiveData={hasLiveData}
        onClose={() => setSelectedInfoTicket(null)}
      />
    </div>
  )
}
