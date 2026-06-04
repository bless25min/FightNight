import { motion } from 'framer-motion'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import eventAfterglow from '../assets/event/event-afterglow.jpg'
import eventBagImpact from '../assets/event/event-bag-impact.jpg'
import eventGroupEnergy from '../assets/event/event-group-energy.jpg'
import eventHeroEmotion from '../assets/event/event-hero-emotion.jpg'
import { Header } from '../components/layout/Header'
import { Seo } from '../components/Seo'
import { FAQSection } from '../components/sections/FAQSection'
import { Button } from '../components/ui/Button'
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
import {
  createMetaEventId,
  getCheckoutTrackingContext,
} from '../lib/checkoutTracking'
import {
  formatCoursePrice,
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
  offerApplied: boolean
  pricingTier: 'foreign-fighter' | 'domestic-teacher'
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

const landingVariant = 'fightnight_event_night_ticket_paid_v3'
const eventName = 'After Work Fight Night'
const eventPassPriceAmount = 980
const eventPassPricingMode = 'fight-night-event-pass-v1'
const eventDescription =
  'After Work Fight Night 是一張 Fight Night Pass。走進 UFC GYM，戴上拳套，把 50 分鐘交給倒數、沙包聲和全場。'

const venueLabelMap: Record<string, string> = {
  'venue-dunnan': '敦南旗艦館',
  'venue-neihu': '內湖旗艦館',
  'venue-taichung': '台中旗艦館',
}

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
    id: 'event-no-membership',
    question: '會被推銷或要入會嗎？',
    answer:
      '不會。這張 Pass 只買這一晚。',
  },
  {
    id: 'event-what-to-wear',
    question: '要穿什麼？需要帶什麼？',
    answer:
      '穿一般好活動的運動服就可以。到場會帶你進流程，需要準備的細節會在 LINE 入場確認裡提醒。',
  },
  {
    id: 'event-payment',
    question: '付款後怎麼入場？',
    answer:
      'LINE 會留下時間、地點和入場確認。',
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

function getVenueLabel(course: WeeklyCourse) {
  return venueLabelMap[course.venueId] ?? course.venueName
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function getDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371
  const deltaLatitude = toRadians(to.latitude - from.latitude)
  const deltaLongitude = toRadians(to.longitude - from.longitude)
  const startLatitude = toRadians(from.latitude)
  const endLatitude = toRadians(to.latitude)

  const angle =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(angle), Math.sqrt(1 - angle))
}

function getNearestVenueRecommendation(
  location: Coordinates,
  source: VenueRecommendation['source'],
): VenueRecommendation {
  const nearest = Object.entries(venueCoordinates)
    .map(([venueId, coordinates]) => ({
      venueId,
      distanceKm: getDistanceKm(location, coordinates),
      source,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0]

  return nearest ?? { venueId: 'venue-dunnan', source }
}

function getRecommendedTicket(
  tickets: EventTicket[],
  recommendation: VenueRecommendation | null,
) {
  if (!recommendation) return undefined
  return tickets.find((ticket) => ticket.course.venueId === recommendation.venueId)
}

function getCoachPricingTier(course: WeeklyCourse) {
  return findCoachProfile(course.coach)?.pricingTier ?? 'domestic-teacher'
}

function getEventTickets(limit = 48): EventTicket[] {
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
    }))
}

function getRemainingLabel(
  availability: SessionAvailability,
  hasLiveData: boolean,
) {
  if (!hasLiveData) {
    return `線上剩餘名額 ${availability.capacity || ONLINE_SALES_SEAT_LIMIT} 位`
  }
  if (availability.remaining <= 0) return '候補中'
  if (availability.remaining <= 2) return `最後 ${availability.remaining} 位`
  return `剩餘 ${availability.remaining} 位`
}

function getEventTicketPrice(ticket: EventTicket): EventTicketPrice {
  const pricingTier = getCoachPricingTier(ticket.course)

  return {
    amount: eventPassPriceAmount,
    label: formatCoursePrice(eventPassPriceAmount),
    originalAmount: eventPassPriceAmount,
    originalLabel: formatCoursePrice(eventPassPriceAmount),
    offerApplied: false,
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

function EventImageFrame({
  src,
  alt,
  position = '72% center',
}: {
  src: string
  alt: string
  position?: string
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="overflow-hidden rounded-xl border border-pearl/10 bg-black/30"
    >
      <img
        src={src}
        alt={alt}
        className="aspect-[4/5] w-full object-cover"
        style={{ objectPosition: position }}
        loading="lazy"
      />
    </motion.figure>
  )
}

function EventHeroSection({
  featuredTicket,
  featuredPrice,
  onPrimaryAction,
}: {
  featuredTicket?: EventTicket
  featuredPrice?: EventTicketPrice
  onPrimaryAction: () => void
}) {
  const dateTimeLabel = featuredTicket
    ? `${featuredTicket.dateLabel} ${featuredTicket.timeLabel}`
    : '本週開放場次'
  const priceLabel = featuredPrice?.label ?? formatCoursePrice(eventPassPriceAmount)

  return (
    <section
      id="event-hero"
      className="relative min-h-[92vh] overflow-hidden bg-abyss text-pearl"
    >
      <img
        src={eventHeroEmotion}
        alt="Fight Night 現場笑出來的情緒特寫"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.9]"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-abyss/5 via-abyss/34 to-abyss" />
      <div className="absolute inset-0 bg-gradient-to-r from-abyss/92 via-abyss/68 to-abyss/10" />

      <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-[430px] items-end px-4 pb-9 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          className="max-w-full"
        >
          <p className="font-heading text-sm font-bold text-neon">
            AFTER WORK FIGHT NIGHT
          </p>
          <h1 className="mt-4 font-heading text-[2.65rem] font-black leading-[0.98] text-pearl">
            下班後，進入另一種夜晚。
          </h1>
          <p className="mt-5 text-base leading-relaxed text-mist/84">
            平常下班，你可能只是吃飯、回家、滑手機。這一晚不一樣，你會走進一個聲音很近、節奏很熱、大家真的會玩開的現場。
          </p>

          <Button
            size="lg"
            className="mt-8 w-full"
            onClick={onPrimaryAction}
            data-cta="event-hero-primary"
          >
            看這一晚有多好玩
          </Button>
          <p className="mt-3 text-center text-xs font-heading leading-relaxed text-mist/62">
            {priceLabel}｜一週一場｜每場 {ONLINE_SALES_SEAT_LIMIT} 位
            <br />
            {dateTimeLabel}
          </p>
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
      <div className="grid gap-5">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <EventSectionHeading
            title="一進去，節奏會先靠過來。"
          >
            場地不大，距離很近。教練喊第一個倒數，大家一起動起來，空氣會突然變熱。
          </EventSectionHeading>
          <p className="text-base leading-relaxed text-mist/76">
            你不用先搞懂所有動作。只要跟著第一下、第二下，這一晚就會慢慢變得好玩。
          </p>
        </motion.div>

        <EventImageFrame
          src={eventGroupEnergy}
          alt="Fight Night 小團體被現場節奏帶起來"
        />
      </div>
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
      <div className="grid gap-5">
        <EventImageFrame
          src={eventBagImpact}
          alt="教練口令、黑色沙包與拳套落點"
          position="center center"
        />

        <div>
          <EventSectionHeading title="第一聲悶響，會把白天切開。" />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4 border-y border-pearl/10 py-5 text-base leading-relaxed text-mist/78"
          >
            <p>
              拳套戴上去，手會有點熱。第一下落在黑色沙包上，聲音很低、很近，白天的雜訊會先退一點。
            </p>
            <p>
              倒數一靠近，教練的口令、旁邊的呼吸和沙包聲疊在一起。你不用想太多，只要跟著下一下。
            </p>
          </motion.div>
        </div>
      </div>
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
      <div className="grid gap-5">
        <EventImageFrame
          src={eventAfterglow}
          alt="Fight Night 結束後笑出來的放鬆感"
        />
        <div>
          <EventSectionHeading title="最後一輪結束，大家會坐下來笑。" />
          <p className="text-base leading-relaxed text-mist/76">
            手還熱，沙包還在晃。你坐下來，旁邊的人也在喘，也在笑。
          </p>
          <p className="mt-4 text-base leading-relaxed text-mist/76">
            那種鬆掉的開心，會讓這一晚留下來。
          </p>
          <p className="mt-4 text-base leading-relaxed text-mist/76">
            覺得有點想試，就把這一晚留下來。
          </p>
          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={() => scrollToId('event-entry')}
            data-cta="event-afterglow-cta"
          >
            把這一晚留下來
          </Button>
        </div>
      </div>
    </SectionWrapper>
  )
}

function EventTicketCard({
  ticket,
  availability,
  hasLiveData,
  displayMode = 'next',
  onPurchase,
}: {
  ticket: EventTicket
  availability: SessionAvailability
  hasLiveData: boolean
  displayMode?: 'next' | 'nearest'
  onPurchase: (ticket: EventTicket) => void
}) {
  const remainingLabel = getRemainingLabel(availability, hasLiveData)
  const price = getEventTicketPrice(ticket)
  const disabled = hasLiveData && availability.remaining <= 0

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="relative overflow-hidden rounded-xl border border-pearl/10 bg-black/30 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-xs text-blaze/80">
            {displayMode === 'nearest' ? '離你最近' : '下一場'}
          </p>
          <h3 className="mt-1 font-heading text-[1.75rem] font-black leading-tight text-pearl">
            {ticket.dateLabel}
          </h3>
          <p className="mt-1 text-sm font-heading text-mist/72">
            {ticket.timeLabel}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-neon/25 bg-neon/10 px-3 py-1 text-xs font-heading text-neon">
          {remainingLabel}
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-pearl/10 pb-3">
          <span className="text-mist/62">地點</span>
          <strong className="text-right font-heading text-pearl">
            {ticket.venueLabel}
          </strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-mist/62">費用</span>
          <strong className="text-right font-heading text-blaze">
            {price.label}
          </strong>
        </div>
      </div>

      <Button
        size="lg"
        className="mt-6 w-full"
        disabled={disabled}
        onClick={() => onPurchase(ticket)}
        data-cta="event-ticket-purchase"
        data-ticket={ticket.id}
      >
        {disabled ? '本場候補中' : '把這一晚留下來'}
      </Button>
    </motion.article>
  )
}

function EventTicketDropSection({
  tickets,
  recommendedTicket,
  recommendation,
  isLocating,
  locationMessage,
  getAvailability,
  hasLiveData,
  onUseCurrentLocation,
  onPurchase,
}: {
  tickets: EventTicket[]
  recommendedTicket?: EventTicket
  recommendation: VenueRecommendation | null
  isLocating: boolean
  locationMessage: string
  getAvailability: (sessionId: string) => SessionAvailability
  hasLiveData: boolean
  onUseCurrentLocation: () => void
  onPurchase: (ticket: EventTicket) => void
}) {
  const nextTicket = recommendedTicket ?? tickets[0]
  const isRecommended = Boolean(recommendation && recommendedTicket)
  const locationHelperText = isRecommended
    ? `已換成附近的 ${nextTicket?.venueLabel}。`
    : recommendation
      ? '附近場館暫時沒有可購買場次，先顯示下一場。'
      : '想就近去，可以先找附近場館。'

  return (
    <SectionWrapper
      id="event-entry"
      className="max-w-[430px] px-4 sm:px-4"
      padding="py-8"
    >
      <EventSectionHeading
        eyebrow="Fight Night Pass"
        title="有一點想去，就把這一晚留下來。"
      >
        {`一週一場，每場 ${ONLINE_SALES_SEAT_LIMIT} 位。線上付款後，LINE 收到入場確認。不用入會，不用被推銷。`}
      </EventSectionHeading>

      {nextTicket ? (
        <div className="grid gap-4">
          <EventTicketCard
            ticket={nextTicket}
            availability={getAvailability(nextTicket.sessionId)}
            hasLiveData={hasLiveData}
            displayMode={isRecommended ? 'nearest' : 'next'}
            onPurchase={onPurchase}
          />
          <div className="rounded-xl border border-pearl/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-mist/72">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {locationHelperText}
              </p>
              <button
                type="button"
                className="interaction-hint shrink-0 rounded-full border border-neon/25 px-3 py-2 font-heading text-xs text-neon transition-colors hover:border-neon/45 hover:bg-neon/10 disabled:cursor-not-allowed disabled:opacity-55"
                disabled={isLocating}
                onClick={onUseCurrentLocation}
              >
                {isLocating ? '定位中' : '找附近場館'}
              </button>
            </div>
            {locationMessage ? (
              <p className="mt-2 text-xs text-mist/52">{locationMessage}</p>
            ) : null}
          </div>
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
        <p className="font-heading text-pearl/70">After Work Fight Night</p>
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
  availability,
  onClose,
}: {
  selectedTicket: EventTicket | null
  availability: SessionAvailability | null
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

  const displayPrice = getEventTicketPrice(selectedTicket)

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
      const checkoutPrice = getEventTicketPrice(selectedTicket)
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
          pricingMode: eventPassPricingMode,
          quotedAmountValue: checkoutPrice.amount,
          quotedOriginalAmountValue: checkoutPrice.originalAmount,
          sessionIds: [selectedTicket.sessionId],
          seriesDates: [selectedTicket.course.date],
          sourcePath: getSourcePath(),
          tracking: {
            ...getCheckoutTrackingContext(),
            initiateCheckoutEventId,
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
          event_product: 'fight_night_entry_ticket_no_membership',
          event_id: initiateCheckoutEventId,
          pricing_mode: eventPassPricingMode,
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
              付款後，LINE 會留下這一晚的時間、地點和入場確認。到了那天，直接走進 UFC GYM。
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
  const [recommendation, setRecommendation] =
    useState<VenueRecommendation | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const featuredTicket = tickets[0]
  const recommendedTicket = useMemo(
    () => getRecommendedTicket(tickets, recommendation),
    [tickets, recommendation],
  )
  const featuredPrice = featuredTicket
    ? getEventTicketPrice(featuredTicket)
    : undefined

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

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('目前無法讀取位置，先顯示下一場。')
      return
    }

    setIsLocating(true)
    setLocationMessage('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextRecommendation = getNearestVenueRecommendation(
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          'browser',
        )
        setRecommendation(nextRecommendation)
        setIsLocating(false)
      },
      () => {
        setLocationMessage('目前無法取得位置，先顯示下一場。')
        setIsLocating(false)
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300_000,
        timeout: 6000,
      },
    )
  }

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
        event_product: 'fight_night_entry_ticket_no_membership',
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

    setSelectedTicket(targetTicket)
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
        title="After Work Fight Night｜Fight Night Pass"
        description={eventDescription}
        canonicalPath="/fight-night-event"
        keywords={[
          'Fight Night',
          'Fight Night Pass',
          'After Work Fight Night',
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
          featuredTicket={featuredTicket}
          featuredPrice={featuredPrice}
          onPrimaryAction={() => scrollToId('event-reframe')}
        />
        <EventReframeSection />
        <EventProofSection />
        <EventSafetySection />
        <EventTicketDropSection
          tickets={tickets}
          recommendedTicket={recommendedTicket}
          recommendation={recommendation}
          isLocating={isLocating}
          locationMessage={locationMessage}
          getAvailability={getAvailability}
          hasLiveData={hasLiveData}
          onUseCurrentLocation={useCurrentLocation}
          onPurchase={openCheckout}
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
        title="After Work Fight Night"
        detail={`NT$980｜一週一場｜每場 ${ONLINE_SALES_SEAT_LIMIT} 位`}
        actionLabel="把這一晚留下來"
        onAction={() => scrollToId('event-entry')}
      />
      <CheckoutModal
        selectedTicket={selectedTicket}
        availability={
          selectedTicket ? getAvailability(selectedTicket.sessionId) : null
        }
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  )
}
