import { motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { FAQSection } from '../components/sections/FAQSection'
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
} from '../data/landingContent'
import { useLiffGate } from '../hooks/useLiffGate'
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
    label: '進場前',
    title: '從願意出門開始。',
    description:
      '下班後走進場館，是這段旅程的第一個動作。先把位置留好，今晚就不會又被日常帶走。',
  },
  {
    src: bootcampModule5Poster,
    label: '訓練後',
    title: '離開時，身體會記得。',
    description:
      '流汗、喘氣、被教練帶回穩定。你會帶走一種感覺：壓力靠近時，我還能動。',
  },
]

const priceOptions = [
  {
    label: '兩堂',
    title: '先跑兩次，確認身體進得去',
    price: 'NT$1,800',
    description:
      '適合先試水溫。固定同一時段上兩堂，感受這條路徑是不是你的出口。',
  },
  {
    label: '四堂',
    title: '保留四週，讓狀態開始留下',
    price: 'NT$3,800',
    description:
      '主推。每週同一時間回到場館，讓身體逐步記住穩住、釋放與往前的感覺。',
    highlight: true,
  },
]

const decisionCards = [
  {
    title: '想更敢正面面對',
    description: '常常退讓、吞下去、說不出口。拳擊路徑會比較像你需要的入口。',
    route: 'BOXING' as BootCampRoute,
  },
  {
    title: '想把悶住的能量打開',
    description: '覺得自己太久沒有被點燃。泰拳路徑會給你更強烈的全身釋放。',
    route: 'MUAY_THAI' as BootCampRoute,
  },
  {
    title: '想先把時間留下',
    description: '選一個會出現的時段，比再想很久更有用。',
    route: null,
  },
]

const coachProofCards = [
  {
    title: '購買前看得到當堂教練',
    description: '不同課程會有不同教練；你選梯次時，會看到那一堂是誰帶你進場。',
  },
  {
    title: '教練負責控場與安全邊界',
    description: '教練會控制強度，讓新手在可承受的範圍裡進入壓力，再被帶回穩定。',
  },
  {
    title: '路徑不同，核心一致',
    description: '拳擊與泰拳只是入口；每一條路徑都在學 Fighter 如何面對壓力、穩住反應、做出下一步。',
  },
]

const bookingSteps = [
  {
    label: '1 選路徑',
    description: '拳擊偏正面面對，泰拳偏全身釋放。先選更像你的那條路。',
  },
  {
    label: '2 選第一堂',
    description: '選一個你真的能出現的館別、日期、時間與教練。',
  },
  {
    label: '3 保留後續',
    description: '兩堂先確認，四堂完整養成；後續週次自動沿用同館同時段。',
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
  unlocked,
  onPrimaryAction,
  onRouteAction,
}: {
  unlocked: boolean
  onPrimaryAction: () => void
  onRouteAction: () => void
}) {
  return (
    <section
      id="boot-camp-hero"
      data-section="boot-camp-hero"
      className="relative overflow-hidden pt-8 pb-10 md:pt-16 md:pb-16"
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
            alt="Boot Camp 完整方案主視覺"
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
            讓身體每週回到狀態。
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-mist/80 md:text-xl">
            Boot Camp 給你一段固定節奏：選第一堂、確認教練與場館，再把接下來兩堂或四堂接上。你不用先變厲害，只要讓自己開始出現。
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={onPrimaryAction}
              data-cta="bootcamp-hero-primary"
            >
              {unlocked ? '查看可購買梯次' : 'LINE 登入看梯次'}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={onRouteAction}
              data-cta="bootcamp-hero-routes"
            >
              先看拳擊 / 泰拳差異
            </Button>
          </div>

          <div className="mt-6 grid max-w-2xl grid-cols-3 gap-2">
            {['指定日期', '當堂教練', '線上限量 6 席'].map((item) => (
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
    <SectionWrapper id="boot-camp-expectation" padding="py-12 md:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="先看見那個會出現的自己。"
          subtitle="從下班後走進場館，到訓練後帶著喘息離開，Boot Camp 把期待落在日期、館別、時間與教練上。"
        />

        <div className="grid gap-4 md:grid-cols-[0.88fr_1.12fr] md:gap-6">
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
                <h2 className="mt-2 font-heading text-2xl font-black leading-tight text-pearl md:text-3xl">
                  {scene.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-mist/72 md:text-base">
                  {scene.description}
                </p>
              </div>
            </VisualPanel>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {decisionCards.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => {
                if (card.route) {
                  document.getElementById('boot-camp-routes')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                  return
                }
                onBookingAction()
              }}
              className="rounded-2xl border border-pearl/10 bg-black/30 p-5 text-left transition-colors hover:border-neon/40 hover:bg-neon/10"
            >
              <p className="font-heading text-lg font-black text-pearl">
                {card.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-mist/68">
                {card.description}
              </p>
            </button>
          ))}
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

function RouteSection({
  onSelectRoute,
}: {
  onSelectRoute: (route: BootCampRoute) => void
}) {
  return (
    <SectionWrapper id="boot-camp-routes">
      <SectionHeading
        title="拳擊或泰拳，先選你想走進的狀態。"
        subtitle="拳擊偏正面面對，泰拳偏全身釋放。兩條路都用 Fighter 的訓練邏輯帶你學會面對壓力。"
      />

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        {routeOrder.map((route, index) => {
          const content = bootCampRouteContent[route]
          const accentClass =
            route === 'BOXING'
              ? 'border-blaze/25 bg-blaze/10'
              : 'border-neon/25 bg-neon/10'
          const buttonVariant = route === 'BOXING' ? 'secondary' : 'primary'

          return (
            <motion.article
              key={route}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: index * 0.08 }}
              className={`overflow-hidden rounded-2xl border bg-black/40 shadow-[0_28px_80px_rgba(0,0,0,0.35)] ${accentClass}`}
            >
              <div className="relative">
                <ZoomableImage
                  src={routeImages[route]}
                  alt={`${content.label}：${content.headline}`}
                  className="h-auto w-full"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/42 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-[58%] max-w-md flex-col justify-end p-5 md:p-8">
                  <div className="max-w-xs">
                    <p className="font-heading text-xs uppercase tracking-[0.24em] text-neon/75">
                      {content.badge}
                    </p>
                    <h3 className="mt-2 font-heading text-3xl font-black leading-tight text-pearl md:text-5xl">
                      {content.label}
                    </h3>
                    <p className="mt-3 font-heading text-lg font-bold leading-snug text-pearl md:text-xl">
                      {content.headline}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-pearl/10 bg-black/82 p-5 md:p-6">
                <p className="mt-3 text-sm leading-relaxed text-mist/72 md:text-base">
                  {content.summary}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {content.skills.map((skill) => (
                    <div
                      key={skill}
                      className="rounded-xl border border-pearl/10 bg-black/25 px-3 py-2 text-sm text-mist/80"
                    >
                      {skill}
                    </div>
                  ))}
                </div>

                <Button
                  variant={buttonVariant}
                  className="mt-5 w-full"
                  onClick={() => onSelectRoute(route)}
                  data-cta={`bootcamp-route-${route.toLowerCase()}`}
                >
                  看這條路徑可購買梯次
                </Button>
              </div>
            </motion.article>
          )
        })}
      </div>
    </SectionWrapper>
  )
}

function CoachProofSection() {
  return (
    <SectionWrapper id="boot-camp-coach-proof">
      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-8">
        <VisualPanel
          src={bootcampModule2Poster}
          alt="Boot Camp 教練帶領新手理解壓力訓練"
          imageClassName="h-auto w-full"
        />

        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.28em] text-neon/85">
            COACH TRUST
          </p>
          <h2 className="mt-3 font-heading text-3xl font-black leading-tight text-pearl md:text-5xl">
            選梯次時，你會看到當堂教練。
          </h2>
          <p className="mt-4 text-base leading-relaxed text-mist/75 md:text-lg">
            每堂課由實際排定教練帶領。課表卡會顯示教練、館別、時間與路徑，讓你知道那一晚誰帶你進場。
          </p>

          <div className="mt-5 space-y-3">
            {coachProofCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-pearl/10 bg-black/30 p-4"
              >
                <p className="font-heading text-base font-bold text-pearl">
                  {card.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-mist/68">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

function BookingProductPanel() {
  return (
    <div className="mb-6 rounded-2xl border border-pearl/10 bg-black/35 p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">
            RESERVE YOUR SPOT
          </p>
          <h3 className="mt-2 font-heading text-2xl font-black leading-tight text-pearl md:text-4xl">
            選第一堂，把後面的節奏一起留下。
          </h3>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-mist/70 md:text-right">
          先選路徑入口，再保留同館同時段的兩堂或四堂。每週回到同一個位置，狀態才有機會留下來。
        </p>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-3">
        {bookingSteps.map((step) => (
          <div
            key={step.label}
            className="rounded-xl border border-pearl/10 bg-black/25 p-4"
          >
            <p className="font-heading text-base font-black text-pearl">
              {step.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mist/68">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PriceStrip() {
  return (
    <div className="mb-7 grid gap-3 md:grid-cols-2">
      {priceOptions.map((option) => (
        <div
          key={option.label}
          className={`rounded-2xl border p-5 ${
            option.highlight
              ? 'border-neon/35 bg-neon/10'
              : 'border-pearl/10 bg-black/30'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 inline-flex rounded-full border border-pearl/10 bg-pearl/5 px-2.5 py-1 text-[11px] font-heading tracking-wide text-mist/70">
                {option.label}
              </p>
              <p className="font-heading text-xl font-black text-pearl">
                {option.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-mist/70">
                {option.description}
              </p>
            </div>
            <p className="shrink-0 font-heading text-lg font-black text-neon">
              {option.price}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function BookingSection({
  gateState,
  loginUrl,
  selectedRoute,
  onGateAction,
  onRouteChange,
}: {
  gateState: ReturnType<typeof useLiffGate>['gateState']
  loginUrl?: string
  selectedRoute: BootCampRoute | null
  onGateAction: () => void
  onRouteChange: (route: BootCampRoute | null) => void
}) {
  return (
    <SectionWrapper id="boot-camp-booking">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-pearl/10 bg-black/30 p-4 md:p-8">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,59,92,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(40,236,210,0.1),transparent_44%)]" />

        <div className="relative">
          <BookingProductPanel />
          <PriceStrip />

          <LockedContent
            gateState={gateState}
            title="登入後選 Boot Camp 梯次"
            description="登入後可查看指定日期、實際教練、四週自動帶入與即時剩餘名額。"
            loginUrl={loginUrl}
            onGateAction={onGateAction}
          >
            <WeeklyScheduleSection
              id="boot-camp-schedule"
              activeCategory="BOOT_CAMP"
              activeBootCampRoute={selectedRoute}
              onBootCampRouteChange={onRouteChange}
              categories={['BOOT_CAMP']}
              showCategoryTabs={false}
              showVenueFilter
              title="選擇你的 Boot Camp 梯次"
              subtitle="先選一個你真的會出現的場次。選定第一堂後，兩堂或四堂會自動保留同館同時段。"
              embedded
            />
          </LockedContent>
        </div>
      </div>
    </SectionWrapper>
  )
}

export function BootCampPage() {
  const [selectedRoute, setSelectedRoute] = useState<BootCampRoute | null>(null)
  const { gateState, loginUrl, requestGateAccess, openWhenUnlocked } =
    useLiffGate()

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [])

  const scrollToSchedule = useCallback(
    (route?: BootCampRoute) => {
      setSelectedRoute(route ?? null)
      window.setTimeout(() => scrollTo('boot-camp-booking'), 80)
    },
    [scrollTo],
  )

  const handlePrimaryAction = useCallback(() => {
    if (gateState.status === 'unlocked') {
      scrollToSchedule(selectedRoute ?? undefined)
      return
    }

    void requestGateAccess()
  }, [gateState.status, requestGateAccess, scrollToSchedule, selectedRoute])

  return (
    <div className="relative w-full overflow-x-hidden bg-abyss pb-24 md:pb-0">
      <Header />
      <main>
        <BootCampHero
          unlocked={gateState.status === 'unlocked'}
          onPrimaryAction={handlePrimaryAction}
          onRouteAction={() => scrollTo('boot-camp-routes')}
        />
        <BookingSection
          gateState={gateState}
          loginUrl={loginUrl}
          selectedRoute={selectedRoute}
          onGateAction={() => void requestGateAccess()}
          onRouteChange={setSelectedRoute}
        />
        <ExpectationSection onBookingAction={() => scrollToSchedule()} />
        <RouteSection onSelectRoute={scrollToSchedule} />
        <BootCampCoreSection />
        <CoachProofSection />
        <FAQSection
          id="boot-camp-faq"
          title="Boot Camp 常見問題"
          subtitle="只回答購買前最後會卡住的地方"
          items={bootCampFaqItems}
        />
      </main>
      <Footer onVenueAction={(url) => void openWhenUnlocked(url)} />
      <StickyActionBar
        eyebrow={gateState.status === 'unlocked' ? '已解鎖' : 'BOOT CAMP'}
        title="保留你的 Boot Camp 梯次"
        detail={gateState.status === 'unlocked' ? '選日期與路徑' : '登入後看剩餘名額'}
        actionLabel={gateState.status === 'unlocked' ? '看梯次' : 'LINE 登入'}
        onAction={handlePrimaryAction}
        secondaryActionLabel="路徑"
        onSecondaryAction={() => scrollTo('boot-camp-routes')}
      />
    </div>
  )
}
