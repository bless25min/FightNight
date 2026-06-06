import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { FAQSection } from '../components/sections/FAQSection'
import { Seo } from '../components/Seo'
import { WeeklyScheduleSection } from '../components/sections/WeeklyScheduleSection'
import { Button } from '../components/ui/Button'
import { LockedContent } from '../components/ui/LockedContent'
import { SectionHeading } from '../components/ui/SectionHeading'
import { SectionWrapper } from '../components/ui/SectionWrapper'
import { StickyActionBar } from '../components/ui/StickyActionBar'
import { ZoomableImage } from '../components/ui/ZoomableImage'
import {
  bootCampCoreContent,
  bootCampFaqItems,
  bootCampRouteContent,
  siteConfig,
  venues,
} from '../data/landingContent'
import type { LiffGateState } from '../hooks/useLiffGate'
import { useLiffGate } from '../hooks/useLiffGate'
import { useTracking } from '../hooks/useTracking'
import {
  createMetaEventId,
  getCheckoutTrackingContext,
} from '../lib/checkoutTracking'
import {
  readFreeTrialBridgeState,
  writeFreeTrialBridgeState,
  type FreeTrialBridgeState,
} from '../lib/freeTrialBridge'
import { getLineRequestContext } from '../lib/lineContext'
import { toAbsoluteUrl } from '../lib/url'
import type { BootCampRoute, CourseCategory } from '../types'
import boxingRouteImage from '../assets/generated/bootcamp-route-boxing-poster.jpg'
import bootCampCorePressureMemoryImage from '../assets/generated/bootcamp-core-pressure-memory.jpg'
import muayThaiRouteImage from '../assets/generated/bootcamp-route-muaythai-poster.jpg'
import bootcampModule2Poster from '../assets/offers/bootcamp-module-2-poster.jpg'
import bootcampModule5Poster from '../assets/offers/bootcamp-module-5-poster.jpg'
import offersHeroPoster from '../assets/offers/offers-hero-octagon-poster.jpg'

const routeOrder: BootCampRoute[] = ['BOXING', 'MUAY_THAI']

const routeImages: Record<BootCampRoute, string> = {
  BOXING: boxingRouteImage,
  MUAY_THAI: muayThaiRouteImage,
}

type FirstPurchaseOfferState = 'idle' | 'checking' | 'eligible' | 'ineligible' | 'error'

const bootCampSeoKeywords = [
  'Boot Camp 拳擊課程',
  'Boot Camp 泰拳課程',
  '台北拳擊課程',
  '台北泰拳課程',
  '台中拳擊課程',
  '台中泰拳課程',
  '格鬥健身初學者',
  '下班後運動',
  '壓力釋放運動',
  'UFCGYM TAIWAN',
]

function buildBootCampStructuredData() {
  const url = toAbsoluteUrl('/boot-camp')

  return [
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: 'Boot Camp 拳擊/泰拳課程',
      description:
        'UFCGYM TAIWAN Boot Camp 提供台北、台中拳擊與泰拳訓練計畫，適合想從單次體驗進入固定運動節奏的初學者。',
      inLanguage: 'zh-Hant',
      isPartOf: {
        '@type': 'WebSite',
        name: siteConfig.brandName,
        url: toAbsoluteUrl('/'),
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl(offersHeroPoster),
      },
      about: bootCampSeoKeywords,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: '首頁',
          item: toAbsoluteUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Boot Camp',
          item: url,
        },
      ],
    },
    {
      '@type': 'ItemList',
      name: 'UFCGYM TAIWAN Boot Camp 場館',
      itemListElement: venues.map((venue, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'SportsActivityLocation',
          name: venue.name,
          address: venue.address,
          description: venue.transit,
        },
      })),
    },
  ]
}

function getFreeTrialBridgeEntry() {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  if (params.get('from') !== 'free-trial') return null

  return readFreeTrialBridgeState()
}

const mobileFullBleedImageFrame =
  '-mx-3 rounded-none border-x-0 sm:mx-0 sm:rounded-2xl sm:border-x md:rounded-[2rem]'

const expectationScenes = [
  {
    src: bootcampModule2Poster,
    label: '訓練中',
    title: '不僅僅是運動娛樂，也帶給你身體應對壓力的記憶',
    description:
      '讓你在歡笑中經歷一個可承受範圍的流汗、吶喊、穩定，完成反射性的記憶。',
  },
  {
    src: bootcampModule5Poster,
    label: '幾週後',
    title: '身體會開始記得：我有辦法。',
    description:
      '自信並非來自技巧，而是每週習慣讓穩住、釋放和往前變成身體經驗。',
  },
]

function VisualPanel({
  src,
  alt,
  children,
  className = '',
  imageClassName = 'h-auto w-full',
  delay = 0,
  loading = 'lazy',
}: {
  src: string
  alt: string
  children?: ReactNode
  className?: string
  imageClassName?: string
  delay?: number
  loading?: 'lazy' | 'eager'
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, delay }}
      className={`overflow-hidden border border-pearl/10 bg-black/40 shadow-[0_28px_80px_rgba(0,0,0,0.35)] ${mobileFullBleedImageFrame} ${className}`}
    >
      <ZoomableImage
        src={src}
        alt={alt}
        className={imageClassName}
        loading={loading}
      />
      {children && <figcaption>{children}</figcaption>}
    </motion.figure>
  )
}

function BootCampHero({
  onPrimaryAction,
  onExpectationAction,
}: {
  onPrimaryAction: () => void
  onExpectationAction: () => void
}) {
  return (
    <section
      id="boot-camp-hero"
      data-section="boot-camp-hero"
      className="relative overflow-hidden pt-8 pb-8 md:pt-16 md:pb-16"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-abyss via-obsidian to-abyss" />
        <div className="absolute left-1/2 top-1/3 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-blaze/8 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-3 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          className={`overflow-hidden border border-pearl/10 bg-black/40 shadow-[0_30px_90px_rgba(0,0,0,0.42)] ${mobileFullBleedImageFrame}`}
        >
          <ZoomableImage
            src={offersHeroPoster}
            alt="UFC GYM 場館內 Boot Camp 主視覺"
            className="h-auto w-full"
            loading="eager"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          className="mx-auto mt-5 max-w-4xl border-y border-pearl/10 py-6 md:mt-8 md:py-8"
        >
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.32em] text-neon/85 md:text-sm">
            BOOT CAMP
          </p>
          <h1 className="mt-3 font-heading text-4xl font-black leading-[0.98] text-pearl md:text-6xl">
            經驗能讓人產生由內至外的蛻變
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-mist/80 md:text-xl">
            買一個讓身體記住正向頻率的習慣
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={onPrimaryAction}
              data-cta="bootcamp-hero-primary"
            >
              選路徑與梯次
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={onExpectationAction}
              data-cta="bootcamp-hero-expectation"
            >
              先看你會得到什麼
            </Button>
          </div>

        </motion.div>
      </div>
    </section>
  )
}

function ExpectationSection({
  onBookingAction,
}: {
  onBookingAction: () => void
}) {
  return (
    <SectionWrapper
      id="boot-camp-expectation"
      padding="py-10 md:py-24"
    >
      <SectionHeading
        title="預訂一個未來發生變化的自己"
        subtitle="期待不僅被看見，也要被安排進行事曆"
      />

      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        {expectationScenes.map((scene, index) => (
          <VisualPanel
            key={scene.title}
            src={scene.src}
            alt={`${scene.label}：${scene.title}`}
            delay={index * 0.08}
            imageClassName="h-auto w-full"
          >
            <div className="border-t border-pearl/10 bg-black/78 p-5 md:p-6">
              <p className="font-heading text-xs uppercase tracking-[0.28em] text-neon/80">
                {scene.label}
              </p>
              <h2 className="mt-2 font-heading text-2xl font-black leading-tight text-pearl">
                {scene.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-mist/72 md:text-base">
                {scene.description}
              </p>
            </div>
          </VisualPanel>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-neon/20 bg-neon/10 p-5 md:flex md:items-center md:justify-between md:gap-6">
        <div>
          <p className="font-heading text-xs uppercase tracking-[0.26em] text-neon/80">
            RESERVE THE RHYTHM
          </p>
          <p className="mt-2 font-heading text-2xl font-black leading-tight text-pearl md:text-3xl">
            保留接下來幾週同一個時間的訓練節奏。
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist/72 md:text-base">
            先把位置訂下來，身體才有機會開始改變。
          </p>
        </div>
        <Button
          className="mt-5 w-full md:mt-0 md:w-auto"
          onClick={onBookingAction}
          data-cta="bootcamp-expectation-booking"
        >
          看可購買梯次
        </Button>
      </div>
    </SectionWrapper>
  )
}

function RouteSection({
  selectedRoute,
  onSelectRoute,
}: {
  selectedRoute: BootCampRoute | null
  onSelectRoute: (route: BootCampRoute) => void
}) {
  return (
    <SectionWrapper id="boot-camp-routes" padding="py-10 md:py-24">
      <SectionHeading
        title="先選你想走進哪一種狀態。"
        subtitle="拳擊、泰拳/踢拳只是入口。真正買下的是你想在壓力面前留下的反應。"
      />

      <div className="-mt-2 mb-4 flex items-center justify-between gap-3 md:hidden">
        <p className="font-heading text-xs uppercase tracking-[0.24em] text-neon/75">
          左右滑動選路徑
        </p>
        <div className="flex items-center gap-2 text-xs text-mist/55">
          <span>拳擊</span>
          <span className="h-px w-8 bg-gradient-to-r from-blaze via-pearl/30 to-neon" />
          <span>泰拳/踢拳</span>
        </div>
      </div>

      <div
        data-swipe-hint
        className="swipe-hint -mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-3 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0"
      >
        {routeOrder.map((route, index) => {
          const content = bootCampRouteContent[route]
          const active = selectedRoute === route
          const accentClass =
            route === 'BOXING'
              ? 'border-blaze/35 bg-blaze/10'
              : 'border-neon/35 bg-neon/10'
          const activeGlowClass =
            route === 'BOXING'
              ? 'ring-2 ring-blaze/55 shadow-[0_0_45px_rgba(255,59,92,0.2)]'
              : 'ring-2 ring-neon/55 shadow-[0_0_45px_rgba(40,236,210,0.2)]'
          const buttonVariant = active ? 'primary' : 'secondary'

          return (
            <motion.article
              key={route}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: index * 0.08 }}
              className={`relative shrink-0 basis-[86vw] snap-center overflow-hidden rounded-2xl border bg-black/40 shadow-[0_28px_80px_rgba(0,0,0,0.35)] transition-all duration-300 md:basis-auto ${
                active ? activeGlowClass : 'opacity-92'
              } ${accentClass}`}
            >
              {!active && (
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-transparent via-pearl/4 to-transparent opacity-40 md:hidden" />
              )}
              <div className="relative">
                <ZoomableImage
                  src={routeImages[route]}
                  alt={`${content.label}：${content.headline}`}
                  className="h-auto w-full"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/28 to-transparent p-5 pt-20">
                  <p className="font-heading text-xs uppercase tracking-[0.24em] text-neon/75">
                    {content.badge}
                  </p>
                  <h3 className="mt-2 font-heading text-3xl font-black leading-tight text-pearl">
                    {content.label}
                  </h3>
                </div>
              </div>

              <div className="border-t border-pearl/10 bg-black/82 p-5 md:p-6">
                <p className="font-heading text-xl font-bold leading-snug text-pearl">
                  {content.headline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-mist/72 md:text-base">
                  {content.summary}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {content.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-pearl/10 bg-black/25 px-3 py-1.5 text-xs text-mist/80"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <Button
                  variant={buttonVariant}
                  className="mt-5 w-full"
                  onClick={() => onSelectRoute(route)}
                  data-cta={`bootcamp-route-${route.toLowerCase()}`}
                >
                  {active ? '已選擇，前往梯次' : '選這條路徑'}
                </Button>
              </div>
            </motion.article>
          )
        })}
      </div>
    </SectionWrapper>
  )
}

function BookingSection({
  selectedRoute,
  onRouteChange,
  addOnCategory,
  onAddOnCategoryChange,
  firstPurchaseOfferEligible,
  firstPurchaseOfferState,
  checkoutBuyer,
  excludedCourseIds,
  beforeCheckoutSubmit,
  isFreeTrialBridge,
  gateState,
  onGateAction,
  loginUrl,
}: {
  selectedRoute: BootCampRoute | null
  onRouteChange: (route: BootCampRoute | null) => void
  addOnCategory: CourseCategory
  onAddOnCategoryChange: (category: CourseCategory) => void
  firstPurchaseOfferEligible?: boolean
  firstPurchaseOfferState?: FirstPurchaseOfferState
  checkoutBuyer?: FreeTrialBridgeState['buyer'] | null
  excludedCourseIds?: string[]
  beforeCheckoutSubmit?: () => Promise<void> | void
  isFreeTrialBridge?: boolean
  gateState: LiffGateState
  onGateAction: () => void
  loginUrl?: string
}) {
  const isOfferResolving =
    isFreeTrialBridge &&
    (firstPurchaseOfferState === 'idle' ||
      firstPurchaseOfferState === 'checking')
  const scheduleTitle = isFreeTrialBridge
    ? '618 首購限定優惠加購'
    : '選擇你的起點'
  const scheduleSubtitle = isFreeTrialBridge
    ? undefined
    : '選場館、開始日期、每週習慣的起點'
  const gateActionLabel =
    gateState.status === 'not-friend'
      ? '加入 LINE 好友解鎖'
      : gateState.status === 'error'
        ? '重新驗證'
        : 'LINE 登入查看梯次'

  return (
    <SectionWrapper id="boot-camp-booking" padding="py-10 md:py-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-pearl/10 bg-black/30 p-4 md:p-8">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,59,92,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(40,236,210,0.1),transparent_44%)]" />

        <div className="relative">
          <LockedContent
            title="LINE 登入後查看 Boot Camp 梯次"
            description="登入後可查看可購買日期、即時剩餘名額與價格。"
            gateState={gateState}
            loginUrl={loginUrl}
            onGateAction={onGateAction}
            lockedEyebrow="BOOT CAMP"
            actionLabel={gateActionLabel}
            actionNote="登入後會回到 Boot Camp 梯次區。"
            className="bg-black/55"
          >
            {isOfferResolving ? (
              <div className="rounded-2xl border border-neon/18 bg-neon/8 px-4 py-5 text-center">
                <p className="font-heading text-xl font-black text-pearl">
                  正在確認 618 首購資格
                </p>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-mist/70">
                  確認後會顯示可購買課程與價格。
                </p>
              </div>
            ) : (
              <WeeklyScheduleSection
                id="boot-camp-schedule"
                activeCategory={addOnCategory}
                onCategoryChange={onAddOnCategoryChange}
                activeBootCampRoute={selectedRoute}
                onBootCampRouteChange={onRouteChange}
                categories={isFreeTrialBridge ? ['BOOT_CAMP', 'FIGHT_NIGHT'] : ['BOOT_CAMP']}
                showCategoryTabs={isFreeTrialBridge}
                showVenueFilter
                showBootCampRouteFilter={false}
                showCategoryLead={!isFreeTrialBridge}
                categoryTabsPlacement={isFreeTrialBridge ? 'bottom' : 'top'}
                footnoteText={
                  isFreeTrialBridge
                    ? '覺得 BOOT CAMP 太多？可以先加購一堂 FIGHT NIGHT'
                    : undefined
                }
                categorySwitchHeading={
                  isFreeTrialBridge
                    ? {
                        BOOT_CAMP: '覺得 BOOT CAMP 太多？可以先加購一堂 FIGHT NIGHT',
                        FIGHT_NIGHT: '想透過技術學習蛻變成長？切回 BOOT CAMP 基礎／技巧課程',
                      }
                    : undefined
                }
                bookingMode={addOnCategory === 'BOOT_CAMP' ? 'bootcamp' : 'standard'}
                title={scheduleTitle}
                subtitle={scheduleSubtitle}
                embedded
                excludedCourseIds={excludedCourseIds}
                firstPurchaseOfferEligible={firstPurchaseOfferEligible}
                checkoutBuyer={checkoutBuyer}
                beforeCheckoutSubmit={beforeCheckoutSubmit}
              />
            )}
          </LockedContent>
        </div>
      </div>
    </SectionWrapper>
  )
}

function BootCampCoreSection() {
  return (
    <SectionWrapper id="boot-camp-core" fullWidth padding="py-8 md:py-16">
      <div className="mx-auto max-w-6xl px-3 sm:px-8">
        <div className="overflow-hidden border-y border-pearl/10 bg-black/28 sm:rounded-3xl sm:border">
          <div className="grid md:grid-cols-[0.95fr_1.05fr]">
            <div className="order-2 p-5 sm:p-8 md:order-1 md:p-10">
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.28em] text-neon md:text-sm">
                {bootCampCoreContent.eyebrow}
              </p>
              <h2 className="mt-3 font-heading text-4xl font-black leading-tight text-pearl md:text-5xl">
                {bootCampCoreContent.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-mist/78 md:text-xl">
                {bootCampCoreContent.description}
              </p>
            </div>

            <div className="order-1 border-b border-pearl/10 md:order-2 md:border-b-0 md:border-l">
              <ZoomableImage
                src={bootCampCorePressureMemoryImage}
                alt="教練在 UFC GYM 場館內用手靶引導學員面對壓力"
                className="h-auto w-full md:h-full md:min-h-[23rem] md:object-cover"
              />
            </div>
          </div>

          <div className="grid border-t border-pearl/10 md:grid-cols-3">
            {bootCampCoreContent.pillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                className="border-b border-pearl/10 p-5 last:border-b-0 md:border-b-0 md:border-r md:p-6 md:last:border-r-0"
              >
                <p className="font-heading text-lg font-black text-pearl">
                  {pillar.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-mist/68 md:text-base">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

export function BootCampPage() {
  const [selectedRoute, setSelectedRoute] = useState<BootCampRoute | null>(null)
  const [freeTrialBridge] = useState<FreeTrialBridgeState | null>(
    getFreeTrialBridgeEntry,
  )
  const [addOnCategory, setAddOnCategory] =
    useState<CourseCategory>('BOOT_CAMP')
  const [firstPurchaseOfferState, setFirstPurchaseOfferState] =
    useState<FirstPurchaseOfferState>('idle')
  const [freeTrialReservationReferenceId, setFreeTrialReservationReferenceId] =
    useState<string | null>(freeTrialBridge?.referenceId ?? null)
  const { gateState, requestGateAccess, loginUrl } = useLiffGate()
  const { track, trackGateAccess } = useTracking()
  const firstPurchaseOfferEligible = firstPurchaseOfferState === 'eligible'

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [])

  useEffect(() => {
    if (!freeTrialBridge || gateState.status !== 'unlocked') {
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
          event: 'bootcamp_bridge_first_purchase_offer_check',
          params: {
            offer_code: '618_MIDYEAR_FIRST_PURCHASE_HALF',
            eligible,
            reason: typeof data?.reason === 'string' ? data.reason : '',
            reference_id: freeTrialBridge.referenceId,
            draft_id: freeTrialBridge.draftId,
            course_id: freeTrialBridge.courseId,
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
  }, [freeTrialBridge, gateState.status, track])

  const finalizeBridgeFreeTrial = useCallback(async () => {
    if (!freeTrialBridge || freeTrialReservationReferenceId) return

    const scheduleEventId = createMetaEventId('schedule')
    const response = await fetch('/api/free-trial-reservation', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        buyer: freeTrialBridge.buyer,
        lineContext: getLineRequestContext(),
        course: {
          id: freeTrialBridge.courseId,
          name: freeTrialBridge.courseName,
          category: 'FIGHT_NIGHT',
        },
        sessionIds: freeTrialBridge.sessionIds,
        seriesDates: freeTrialBridge.seriesDates,
        client: {
          screenWidth: String(window.screen.width),
          screenHeight: String(window.screen.height),
          timeZoneOffset: String(new Date().getTimezoneOffset()),
          transactionWebSite: window.location.origin,
          userAgent: window.navigator.userAgent,
          language: window.navigator.language,
          colorDepth: String(window.screen.colorDepth),
        },
        tracking: {
          ...getCheckoutTrackingContext(),
          scheduleEventId,
        },
        sourcePath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      }),
    })

    const data = (await response.json().catch(() => null)) as
      | {
          referenceId?: string
          reservation?: { courseId?: string; courseName?: string }
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
      if (response.status === 409 && data?.reason === 'free_trial_already_reserved') {
        track({
          event: 'free_trial_reservation_already_exists',
          params: {
            draft_id: freeTrialBridge.draftId,
            course_id: freeTrialBridge.courseId,
            course_name: freeTrialBridge.courseName,
            error_reason: reason,
          },
        })
        setFreeTrialReservationReferenceId('already-reserved')
        return
      }
      const message = data?.error || '免費體驗保留失敗，請先回到 LINE 確認或稍後再試。'
      track({
        event: 'free_trial_reservation_error',
        params: {
          draft_id: freeTrialBridge.draftId,
          course_id: freeTrialBridge.courseId,
          course_name: freeTrialBridge.courseName,
          error_reason: reason,
          error_message: message,
          stage: 'before_checkout',
        },
      })
      throw Object.assign(new Error(message), { reason, tracked: true })
    }

    setFreeTrialReservationReferenceId(data.referenceId)
    writeFreeTrialBridgeState({
      ...freeTrialBridge,
      referenceId: data.referenceId,
    })
    track({
      event: 'free_trial_reservation_submit_before_checkout',
      params: {
        reference_id: data.referenceId,
        draft_id: freeTrialBridge.draftId,
        course_id: data.reservation?.courseId ?? freeTrialBridge.courseId,
        course_name: data.reservation?.courseName ?? freeTrialBridge.courseName,
        line_notify_status: data.lineNotify?.status ?? '',
        event_id: scheduleEventId,
      },
      metaStandardEvent: 'Schedule',
      metaEventId: scheduleEventId,
      lineEventName: 'FreeTrialReserved',
    })
  }, [freeTrialBridge, freeTrialReservationReferenceId, track])

  const selectRouteAndScroll = useCallback(
    (route: BootCampRoute) => {
      setSelectedRoute(route)
      track({
        event: 'bootcamp_route_select',
        params: {
          route,
          route_label: bootCampRouteContent[route].label,
        },
        metaStandardEvent: 'ViewContent',
        lineEventName: 'RouteSelect',
      })
      window.setTimeout(() => scrollTo('boot-camp-booking'), 80)
    },
    [scrollTo, track],
  )

  const handleGateAction = useCallback(() => {
    trackGateAccess('bootcamp_booking', gateState.status)
    const shouldUseLiffLink =
      loginUrl && ['loading', 'logged-out'].includes(gateState.status)
    if (!shouldUseLiffLink) void requestGateAccess()
  }, [gateState.status, loginUrl, requestGateAccess, trackGateAccess])

  return (
    <div className="relative w-full overflow-x-hidden bg-abyss pb-24 md:pb-0">
      <Seo
        title="Boot Camp 拳擊/泰拳課程｜台北台中 UFCGYM 初學者訓練計畫"
        description="想找台北或台中拳擊、泰拳、踢拳課程？UFCGYM TAIWAN Boot Camp 幫你選場館、第一堂日期與兩堂或四堂訓練節奏，適合初學者建立固定運動習慣。"
        canonicalPath="/boot-camp"
        keywords={bootCampSeoKeywords}
        image={offersHeroPoster}
        structuredData={buildBootCampStructuredData()}
      />
      <Header />
      <main>
        <BootCampHero
          onPrimaryAction={() => {
            track({
              event: 'bootcamp_hero_cta_click',
              params: { target: 'routes' },
            })
            scrollTo('boot-camp-routes')
          }}
          onExpectationAction={() => {
            track({
              event: 'bootcamp_expectation_click',
              params: { target: 'expectation' },
              metaStandardEvent: 'ViewContent',
              lineEventName: 'BootcampView',
            })
            scrollTo('boot-camp-expectation')
          }}
        />
        <BootCampCoreSection />
        <ExpectationSection
          onBookingAction={() => {
            track({
              event: 'bootcamp_expectation_booking_click',
              params: { target: 'routes' },
            })
            scrollTo('boot-camp-routes')
          }}
        />
        <RouteSection
          selectedRoute={selectedRoute}
          onSelectRoute={selectRouteAndScroll}
        />
        <BookingSection
          selectedRoute={selectedRoute}
          onRouteChange={setSelectedRoute}
          addOnCategory={addOnCategory}
          onAddOnCategoryChange={(category) => {
            setAddOnCategory(category)
            track({
              event: 'free_trial_add_on_category_select',
              params: {
                category,
                draft_id: freeTrialBridge?.draftId ?? '',
              },
              metaStandardEvent: 'ViewContent',
              lineEventName:
                category === 'BOOT_CAMP'
                  ? 'BootCampAddOnSelect'
                  : 'FightNightAddOnSelect',
            })
          }}
          firstPurchaseOfferEligible={firstPurchaseOfferEligible}
          firstPurchaseOfferState={firstPurchaseOfferState}
          checkoutBuyer={freeTrialBridge?.buyer ?? null}
          excludedCourseIds={freeTrialBridge ? [freeTrialBridge.courseId] : undefined}
          beforeCheckoutSubmit={freeTrialBridge ? finalizeBridgeFreeTrial : undefined}
          isFreeTrialBridge={Boolean(freeTrialBridge)}
          gateState={gateState}
          onGateAction={handleGateAction}
          loginUrl={loginUrl}
        />
        <FAQSection
          id="boot-camp-faq"
          title="Boot Camp 常見問題"
          subtitle="只回答購買前最後會卡住的地方"
          items={bootCampFaqItems}
        />
      </main>
      <Footer />
      <StickyActionBar
        eyebrow="BOOT CAMP"
        title="保留你的 Boot Camp 梯次"
        detail={selectedRoute ? bootCampRouteContent[selectedRoute].shortLabel : '先選路徑與第一堂'}
        actionLabel={selectedRoute ? '看梯次' : '選路徑'}
        onAction={() => {
          setAddOnCategory('BOOT_CAMP')
          track({
            event: 'bootcamp_sticky_action_click',
            params: {
              target: selectedRoute ? 'booking' : 'routes',
              route: selectedRoute ?? 'none',
            },
          })
          scrollTo(selectedRoute ? 'boot-camp-booking' : 'boot-camp-routes')
        }}
        secondaryActionLabel={freeTrialBridge ? 'Fight Night' : '路徑'}
        onSecondaryAction={() => {
          track({
            event: 'bootcamp_sticky_secondary_click',
            params: {
              target: freeTrialBridge ? 'fight_night_add_on' : 'routes',
              draft_id: freeTrialBridge?.draftId ?? '',
            },
          })
          if (freeTrialBridge) setAddOnCategory('FIGHT_NIGHT')
          scrollTo(freeTrialBridge ? 'boot-camp-booking' : 'boot-camp-routes')
        }}
      />
    </div>
  )
}
