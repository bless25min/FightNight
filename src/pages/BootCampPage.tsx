import { motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { FAQSection } from '../components/sections/FAQSection'
import { WeeklyScheduleSection } from '../components/sections/WeeklyScheduleSection'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { SectionWrapper } from '../components/ui/SectionWrapper'
import { StickyActionBar } from '../components/ui/StickyActionBar'
import { ZoomableImage } from '../components/ui/ZoomableImage'
import {
  bootCampCoreContent,
  bootCampFaqItems,
  bootCampRouteContent,
} from '../data/landingContent'
import type { BootCampRoute } from '../types'
import boxingRouteImage from '../assets/generated/bootcamp-route-boxing-poster.png'
import muayThaiRouteImage from '../assets/generated/bootcamp-route-muaythai-poster.png'
import painPoster from '../assets/landing/pain-poster.png'
import bootcampModule2Poster from '../assets/offers/bootcamp-module-2-poster.png'
import bootcampModule5Poster from '../assets/offers/bootcamp-module-5-poster.png'
import offersHeroPoster from '../assets/offers/offers-hero-octagon-poster.png'

const routeOrder: BootCampRoute[] = ['BOXING', 'MUAY_THAI']

const routeImages: Record<BootCampRoute, string> = {
  BOXING: boxingRouteImage,
  MUAY_THAI: muayThaiRouteImage,
}

const expectationScenes = [
  {
    src: painPoster,
    label: '下班後',
    title: '不是再撐一下，是走進場館。',
    description:
      '你先把某個晚上的位置留下來。那個時間到的時候，不用再跟自己討論要不要開始。',
  },
  {
    src: bootcampModule2Poster,
    label: '訓練中',
    title: '有人帶你進入壓力，也帶你回來。',
    description:
      '教練不是把你丟進強度裡，而是讓你在可承受的範圍內流汗、喘氣、穩住，再完成下一個動作。',
  },
  {
    src: bootcampModule5Poster,
    label: '幾週後',
    title: '身體會開始記得：我有辦法。',
    description:
      '期待不是來自學了多少招，而是你每週都真的出現，讓穩住、釋放和往前變成身體經驗。',
  },
]

const priceOptions = [
  {
    label: '兩堂',
    title: '先確認這條路徑是不是你的出口',
    price: 'NT$1,800',
  },
  {
    label: '四堂',
    title: '保留四週，讓改變有地方發生',
    price: 'NT$3,800',
    highlight: true,
  },
]

const bookingSteps = [
  '選拳擊或泰拳/踢拳路徑',
  '選第一堂的館別、日期與時間',
  '確認兩堂或四堂會保留哪些日期',
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
      className={`overflow-hidden rounded-2xl border border-pearl/10 bg-black/40 shadow-[0_28px_80px_rgba(0,0,0,0.35)] ${className}`}
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
          className="overflow-hidden rounded-2xl border border-pearl/10 bg-black/40 shadow-[0_30px_90px_rgba(0,0,0,0.42)] md:rounded-[2rem]"
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
            先把位置留下來，
            <br />
            讓自己每週出現。
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-mist/80 md:text-xl">
            你買的不是一串課程內容，而是一段會被日期、場館、教練和固定時段接住的期待。先選第一堂，再決定保留兩堂或四堂。
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

          <div className="mt-6 grid max-w-2xl grid-cols-3 gap-2">
            {['指定日期', '當堂教練', '每堂限量 6 席'].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-pearl/10 bg-black/35 px-3 py-2 text-center text-[11px] font-heading text-mist/78 md:text-sm"
              >
                {item}
              </div>
            ))}
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
        title="你先買下的，是一個會發生的自己。"
        subtitle="期待要被看見，也要被安排進行事曆。這幾週，你不是靠意志力撐，而是每週回到同一個場域。"
      />

      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
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

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {routeOrder.map((route, index) => {
          const content = bootCampRouteContent[route]
          const active = selectedRoute === route
          const accentClass =
            route === 'BOXING'
              ? 'border-blaze/35 bg-blaze/10'
              : 'border-neon/35 bg-neon/10'
          const buttonVariant = active ? 'primary' : 'secondary'

          return (
            <motion.article
              key={route}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: index * 0.08 }}
              className={`overflow-hidden rounded-2xl border bg-black/40 shadow-[0_28px_80px_rgba(0,0,0,0.35)] ${
                active ? 'ring-2 ring-neon/45' : ''
              } ${accentClass}`}
            >
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

function BookingProductPanel() {
  return (
    <div className="mb-5 rounded-2xl border border-pearl/10 bg-black/35 p-5 md:p-6">
      <div>
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">
          BOOK LIKE A ROOM
        </p>
        <h3 className="mt-2 font-heading text-2xl font-black leading-tight text-pearl md:text-4xl">
          先選第一堂，再確認後面保留哪些日期。
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist/70 md:text-base">
          每張梯次卡都會顯示場館、日期、時間、教練與剩餘名額。選兩堂或四堂後，系統會展開同館同時段的後續日期。
        </p>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-3">
        {bookingSteps.map((step, index) => (
          <div
            key={step}
            className="rounded-xl border border-pearl/10 bg-black/25 p-4"
          >
            <p className="font-heading text-sm font-black text-neon">
              0{index + 1}
            </p>
            <p className="mt-1 text-sm font-heading font-semibold leading-snug text-pearl">
              {step}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PriceStrip() {
  return (
    <div className="mb-6 grid grid-cols-2 gap-2 md:gap-3">
      {priceOptions.map((option) => (
        <div
          key={option.label}
          className={`rounded-2xl border p-4 md:p-5 ${
            option.highlight
              ? 'border-neon/35 bg-neon/10'
              : 'border-pearl/10 bg-black/30'
          }`}
        >
          <p className="font-heading text-xs tracking-[0.18em] text-mist/65">
            {option.label}
          </p>
          <p className="mt-2 font-heading text-lg font-black leading-tight text-pearl md:text-xl">
            {option.title}
          </p>
          <p className="mt-3 font-heading text-xl font-black text-neon">
            {option.price}
          </p>
        </div>
      ))}
    </div>
  )
}

function BookingSection({
  selectedRoute,
  onRouteChange,
}: {
  selectedRoute: BootCampRoute | null
  onRouteChange: (route: BootCampRoute | null) => void
}) {
  return (
    <SectionWrapper id="boot-camp-booking" padding="py-10 md:py-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-pearl/10 bg-black/30 p-4 md:p-8">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,59,92,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(40,236,210,0.1),transparent_44%)]" />

        <div className="relative">
          <BookingProductPanel />
          <PriceStrip />

          <WeeklyScheduleSection
            id="boot-camp-schedule"
            activeCategory="BOOT_CAMP"
            activeBootCampRoute={selectedRoute}
            onBootCampRouteChange={onRouteChange}
            categories={['BOOT_CAMP']}
            showCategoryTabs={false}
            showVenueFilter
            showBootCampRouteFilter={false}
            bookingMode="bootcamp"
            title="選擇你的第一堂"
            subtitle="先選你真的會到的館別、日期與時段。下一步再確認兩堂或四堂會保留哪些日期。"
            embedded
          />
        </div>
      </div>
    </SectionWrapper>
  )
}

function BootCampCoreSection() {
  return (
    <SectionWrapper id="boot-camp-core" fullWidth padding="py-10 md:py-20">
      <div className="mx-auto max-w-6xl border-y border-pearl/10 px-4 py-8 sm:px-8 md:py-12">
        <div className="max-w-3xl">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.28em] text-neon md:text-sm">
            {bootCampCoreContent.eyebrow}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-black leading-tight text-pearl md:text-5xl">
            {bootCampCoreContent.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-mist/75 md:text-lg">
            {bootCampCoreContent.description}
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-3">
          {bootCampCoreContent.pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-pearl/10 bg-black/25 p-4 md:p-5"
            >
              <p className="font-heading text-base font-semibold text-pearl">
                {pillar.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-mist/65">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

export function BootCampPage() {
  const [selectedRoute, setSelectedRoute] = useState<BootCampRoute | null>(null)

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [])

  const selectRouteAndScroll = useCallback(
    (route: BootCampRoute) => {
      setSelectedRoute(route)
      window.setTimeout(() => scrollTo('boot-camp-booking'), 80)
    },
    [scrollTo],
  )

  return (
    <div className="relative w-full overflow-x-hidden bg-abyss pb-24 md:pb-0">
      <Header />
      <main>
        <BootCampHero
          onPrimaryAction={() => scrollTo('boot-camp-routes')}
          onExpectationAction={() => scrollTo('boot-camp-expectation')}
        />
        <ExpectationSection onBookingAction={() => scrollTo('boot-camp-routes')} />
        <RouteSection
          selectedRoute={selectedRoute}
          onSelectRoute={selectRouteAndScroll}
        />
        <BookingSection
          selectedRoute={selectedRoute}
          onRouteChange={setSelectedRoute}
        />
        <BootCampCoreSection />
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
        onAction={() => scrollTo(selectedRoute ? 'boot-camp-booking' : 'boot-camp-routes')}
        secondaryActionLabel="路徑"
        onSecondaryAction={() => scrollTo('boot-camp-routes')}
      />
    </div>
  )
}
