import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import bootcampOriginPoster from '../assets/offers/bootcamp-origin-poster.png'
import bootcampModule1Poster from '../assets/offers/bootcamp-module-1-poster.png'
import bootcampModule2Poster from '../assets/offers/bootcamp-module-2-poster.png'
import bootcampModule3Poster from '../assets/offers/bootcamp-module-3-poster.png'
import bootcampModule4Poster from '../assets/offers/bootcamp-module-4-poster.png'
import bootcampModule5Poster from '../assets/offers/bootcamp-module-5-poster.png'
import bootcampModule6Poster from '../assets/offers/bootcamp-module-6-poster.png'
import offersHeroPoster from '../assets/offers/offers-hero-octagon-poster.png'
import offersPlansTransitionPoster from '../assets/offers/offers-plans-transition-poster.png'
import {
  bootCampFaqItems,
  curriculumModules,
  faqItems,
  fightNightPassPlan,
  offersCurriculumSectionContent,
  offersHeroContent,
  offersOutcomeSectionContent,
  offersPlans,
  offersPlanSectionContent,
  planScheduleTargetMap,
} from '../data/landingContent'
import type { LiffGateState } from '../hooks/useLiffGate'
import { useLiffGate } from '../hooks/useLiffGate'
import type { BootCampRoute, CourseCategory } from '../types'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { ExperienceFlowSection } from '../components/sections/ExperienceFlowSection'
import { FormulaSection } from '../components/sections/FormulaSection'
import { IdentitySection } from '../components/sections/IdentitySection'
import { NewModelSection } from '../components/sections/NewModelSection'
import { OldFrameworkBreakSection } from '../components/sections/OldFrameworkBreakSection'
import { PainSection } from '../components/sections/PainSection'
import { WeeklyScheduleSection } from '../components/sections/WeeklyScheduleSection'
import { FAQSection } from '../components/sections/FAQSection'
import { LockedContent } from '../components/ui/LockedContent'
import { PlanCard } from '../components/ui/PlanCard'
import { Button } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { SectionWrapper } from '../components/ui/SectionWrapper'
import { StickyActionBar } from '../components/ui/StickyActionBar'
import { ZoomableImage } from '../components/ui/ZoomableImage'

const curriculumPosterMap: Record<string, string> = {
  'module-1': bootcampModule1Poster,
  'module-2': bootcampModule2Poster,
  'module-3': bootcampModule3Poster,
  'module-4': bootcampModule4Poster,
  'module-5': bootcampModule5Poster,
  'module-6': bootcampModule6Poster,
}

function PosterFigure({
  src,
  alt,
  children,
  className = '',
  delay = 0,
  loading = 'lazy',
}: {
  src: string
  alt: string
  children: ReactNode
  className?: string
  delay?: number
  loading?: 'lazy' | 'eager'
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay }}
      className={`overflow-hidden rounded-2xl md:rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.35)] ${className}`}
    >
      <ZoomableImage src={src} alt={alt} className="w-full h-auto" loading={loading} />
      <figcaption className="sr-only">{children}</figcaption>
    </motion.figure>
  )
}

function OffersHero({ gateState }: { gateState: LiffGateState }) {
  const helperMessage = useMemo(() => {
    if (gateState.status === 'not-friend') {
      return '你已完成 LINE 登入，下一步加入官方帳號後，就能解鎖完整會員內容。'
    }
    if (gateState.status === 'missing-config') {
      return 'LIFF 設定尚未完成，請先補上正式環境變數。'
    }
    if (gateState.status === 'error') {
      return gateState.message || 'LIFF 驗證失敗，請稍後再試。'
    }
    return offersHeroContent.description
  }, [gateState])

  return (
    <section
      id="offers-hero"
      data-section="offers-hero"
      className="relative scroll-mt-20 pt-8 pb-2 md:pt-16 md:pb-4 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-abyss via-obsidian to-abyss" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-neon/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="sr-only"
        >
          {offersHeroContent.title}
        </motion.h1>

        <motion.figure
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto overflow-hidden rounded-2xl md:rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.4)] md:shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
        >
          <ZoomableImage
            src={offersHeroPoster}
            alt={`${offersHeroContent.title} ${offersHeroContent.subtitle}`}
            className="w-full h-auto"
            loading="eager"
          />
          <figcaption className="sr-only">
            <p>{offersHeroContent.subtitle}</p>
            <p>{offersHeroContent.description}</p>
          </figcaption>
        </motion.figure>

        {['missing-config', 'not-friend', 'error'].includes(
          gateState.status,
        ) && (
          <p className="mt-4 text-center text-sm md:text-base text-mist/70 max-w-2xl mx-auto">
            {helperMessage}
          </p>
        )}
      </div>
    </section>
  )
}

function OffersCurriculum() {
  return (
    <SectionWrapper id="offers-curriculum" padding="pt-4 pb-10 md:py-28">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        <PosterFigure
          src={bootcampOriginPoster}
          alt={`${offersCurriculumSectionContent.title} ${offersCurriculumSectionContent.subtitle}`}
        >
          <h2>{offersCurriculumSectionContent.title}</h2>
          <p>{offersCurriculumSectionContent.subtitle}</p>
          <p>{offersCurriculumSectionContent.description}</p>
        </PosterFigure>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {curriculumModules.map((module, i) => (
            <PosterFigure
              key={module.id}
              src={curriculumPosterMap[module.id]}
              alt={`${module.title} ${module.description}`}
              delay={i * 0.08}
              className="md:rounded-[1.75rem] shadow-[0_24px_60px_rgba(0,0,0,0.3)]"
            >
              <h3>
                {module.stage}. {module.title}
              </h3>
              <p>{module.description}</p>
            </PosterFigure>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

function OffersOutcomeSummary() {
  const inputs = offersOutcomeSectionContent.formulaInputs
  return (
    <SectionWrapper id="offers-outcome-summary">
      <div className="relative max-w-4xl mx-auto overflow-hidden rounded-3xl border border-neon/15 bg-gradient-to-br from-neon/10 via-black/35 to-blaze/10 px-5 py-7 md:px-10 md:py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 right-10 h-40 w-40 rounded-full bg-neon/15 blur-[110px]" />
          <div className="absolute -bottom-10 left-10 h-44 w-44 rounded-full bg-blaze/15 blur-[120px]" />
        </div>

        <div className="relative">
          <p className="text-center text-xs md:text-sm font-heading tracking-[0.32em] text-neon/85 uppercase">
            {offersOutcomeSectionContent.formulaLabel}
          </p>

          <div className="mt-6 md:mt-8 flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-center md:flex-wrap md:gap-3">
            {inputs.map((item, index) => (
              <div key={item} className="contents md:flex md:items-center md:gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="rounded-full border border-pearl/15 bg-black/35 px-5 py-2.5 text-center text-sm md:text-base font-heading text-pearl"
                >
                  {item}
                </motion.div>
                {index < inputs.length - 1 && (
                  <span
                    aria-hidden
                    className="self-center text-neon/80 text-base md:text-lg font-heading"
                  >
                    +
                  </span>
                )}
              </div>
            ))}

            <span
              aria-hidden
              className="self-center text-neon/80 text-base md:text-lg font-heading"
            >
              =
            </span>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: inputs.length * 0.06 }}
              className="rounded-full border border-neon/40 bg-neon/15 px-5 py-2.5 text-center text-sm md:text-base font-heading font-semibold text-pearl leading-snug"
            >
              {offersOutcomeSectionContent.formulaResult}
            </motion.div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

function OffersFightNightPlan({
  gateState,
  onGateAction,
  onCtaAction,
  onScheduleNav,
  scheduleCountByCategory,
  loginUrl,
}: {
  gateState: LiffGateState
  onGateAction: () => void
  onCtaAction: (redirectUrl: string, planId: string) => void
  onScheduleNav: (category: CourseCategory, route?: BootCampRoute) => void
  scheduleCountByCategory: Record<CourseCategory, number>
  loginUrl?: string
}) {
  return (
    <SectionWrapper id="offers-fight-night-plan">
      <SectionHeading
        title="Fight Night Pass"
        subtitle="如果你只想先嘗試一次，這張 pass 就是最直接的入口。"
      />

      <LockedContent
        title="登入後查看 Fight Night Pass"
        description="登入後可查看可購買日期、即時剩餘名額與價格。"
        gateState={gateState}
        loginUrl={loginUrl}
        onGateAction={onGateAction}
      >
        <div className="max-w-xl mx-auto">
          <PlanCard
            plan={fightNightPassPlan}
            onCtaAction={onCtaAction}
            scheduleCategory="FIGHT_NIGHT"
            scheduleCount={scheduleCountByCategory.FIGHT_NIGHT}
            onScheduleNav={onScheduleNav}
          />
        </div>
      </LockedContent>
    </SectionWrapper>
  )
}

function OffersPlans({
  gateState,
  onGateAction,
  onCtaAction,
  onScheduleNav,
  scheduleCountByCategory,
  loginUrl,
}: {
  gateState: LiffGateState
  onGateAction: () => void
  onCtaAction: (redirectUrl: string, planId: string) => void
  onScheduleNav: (category: CourseCategory, route?: BootCampRoute) => void
  scheduleCountByCategory: Record<CourseCategory, number>
  loginUrl?: string
}) {
  return (
    <SectionWrapper id="offers-plans">
      <div className="max-w-6xl mx-auto mb-8 md:mb-12">
        <PosterFigure
          src={offersPlansTransitionPoster}
          alt={`${offersPlanSectionContent.title} ${offersPlanSectionContent.subtitle}`}
        >
          <h2>{offersPlanSectionContent.title}</h2>
          <p>{offersPlanSectionContent.subtitle}</p>
          <p>
            如果你已經確認想走進更完整的系統，Boot Camp 會把刺激轉成壓力適應、防身反應與更穩定的身體記憶。
          </p>
        </PosterFigure>
      </div>

      <LockedContent
        title="登入後查看完整費用資訊"
        description="登入後可查看 Boot Camp 路徑、四週自動帶入場次、即時剩餘名額與價格。"
        gateState={gateState}
        loginUrl={loginUrl}
        onGateAction={onGateAction}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto items-start">
          {offersPlans.map((plan, i) => {
            const planTarget = planScheduleTargetMap[plan.id]
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={i}
                onCtaAction={onCtaAction}
                scheduleCategory={planTarget?.category}
                scheduleRoute={planTarget?.route}
                scheduleCount={
                  planTarget
                    ? scheduleCountByCategory[planTarget.category]
                    : undefined
                }
                onScheduleNav={onScheduleNav}
              />
            )
          })}
        </div>
      </LockedContent>

      <p className="text-center text-sm md:text-base text-mist/60 max-w-2xl mx-auto mt-8 md:mt-12">
        {offersPlanSectionContent.footnote}
      </p>
    </SectionWrapper>
  )
}

function OffersPlanJumpSection({
  onFightNight,
  onBootCamp,
}: {
  onFightNight: () => void
  onBootCamp: () => void
}) {
  return (
    <SectionWrapper
      id="offers-plan-jump"
      fullWidth
      padding="py-8 md:py-14"
      className="border-y border-pearl/10 bg-black/25 px-3 sm:px-8"
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <p className="text-xs md:text-sm font-heading tracking-[0.28em] text-neon uppercase mb-2">
            選擇你的入口
          </p>
          <p className="text-xl md:text-2xl font-heading font-bold text-pearl">
            先試一次，或直接走完整系統。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
          <Button variant="secondary" onClick={onFightNight} className="w-full sm:w-auto">
            FIGHT NIGHT
          </Button>
          <Button variant="primary" onClick={onBootCamp} className="w-full sm:w-auto">
            BOOT CAMP
          </Button>
        </div>
      </div>
    </SectionWrapper>
  )
}

const scheduleCountByCategory: Record<CourseCategory, number> = {
  FIGHT_NIGHT: 0,
  BOOT_CAMP: 0,
}

export function OffersPage() {
  const { gateState, requestGateAccess, openWhenUnlocked, loginUrl } =
    useLiffGate()

  const [scheduleCategory, setScheduleCategory] =
    useState<CourseCategory>('BOOT_CAMP')
  const [scheduleRoute, setScheduleRoute] =
    useState<BootCampRoute | null>(null)

  useEffect(() => {
    const targetId = window.location.hash.replace('#', '')
    if (!targetId) return

    const scrollToHashTarget = () => {
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: 'auto', block: 'start' })
    }

    const timers = [0, 120, 360, 800].map((delay) =>
      window.setTimeout(scrollToHashTarget, delay),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const navigateToSchedule = useCallback((
    category: CourseCategory,
    route?: BootCampRoute,
  ) => {
    setScheduleCategory(category)
    setScheduleRoute(category === 'BOOT_CAMP' ? route ?? null : null)
    const el = document.getElementById('weekly-schedule')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handlePlanCta = useCallback(
    (url: string, planId: string) => {
      if (planId === fightNightPassPlan.id) {
        navigateToSchedule('FIGHT_NIGHT')
        return
      }

      const target = planScheduleTargetMap[planId]
      if (target) {
        navigateToSchedule(target.category, target.route)
        return
      }

      void openWhenUnlocked(url)
    },
    [navigateToSchedule, openWhenUnlocked],
  )

  const scrollToFightNightPlan = useCallback(() => {
    document
      .getElementById('offers-fight-night-plan')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const scrollToBootCampPlans = useCallback(() => {
    document
      .getElementById('offers-plans')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="overflow-x-hidden w-full relative">
      <Header />
      <main>
        <PainSection />
        <OldFrameworkBreakSection />
        <NewModelSection />
        <FormulaSection />
        <ExperienceFlowSection />
        <IdentitySection />
        <OffersFightNightPlan
          gateState={gateState}
          onGateAction={() => void requestGateAccess()}
          onCtaAction={handlePlanCta}
          onScheduleNav={navigateToSchedule}
          scheduleCountByCategory={scheduleCountByCategory}
          loginUrl={loginUrl}
        />
        <FAQSection
          id="offers-fight-night-faq"
          title="常見問題"
          subtitle="先回答你心裡那些「可是...」"
          items={faqItems}
        />
        <OffersHero gateState={gateState} />
        <OffersCurriculum />
        <FAQSection
          id="boot-camp-faq"
          title="Boot Camp 常見問題"
          subtitle="先把四堂系統課會讓人猶豫的地方講清楚"
          items={bootCampFaqItems}
        />
        <OffersOutcomeSummary />
        <OffersPlans
          gateState={gateState}
          onGateAction={() => void requestGateAccess()}
          onCtaAction={handlePlanCta}
          onScheduleNav={navigateToSchedule}
          scheduleCountByCategory={scheduleCountByCategory}
          loginUrl={loginUrl}
        />
        <WeeklyScheduleSection
          title="目前可購買的課程名額"
          subtitle="像訂房一樣，選定場館、日期與時段後，再購買該場名額。"
          activeCategory={scheduleCategory}
          activeBootCampRoute={scheduleRoute}
          onBootCampRouteChange={setScheduleRoute}
          categories={['FIGHT_NIGHT', 'BOOT_CAMP']}
          showCategoryTabs
          showVenueFilter
          onCategoryChange={setScheduleCategory}
        />
        <OffersPlanJumpSection
          onFightNight={scrollToFightNightPlan}
          onBootCamp={scrollToBootCampPlans}
        />
      </main>
      <Footer onVenueAction={(url) => void openWhenUnlocked(url)} />
      {gateState.status === 'unlocked' && (
        <StickyActionBar
          eyebrow="方案入口"
          title="Fight Night 或 Boot Camp"
          detail="先試一次，或直接走完整系統"
          secondaryActionLabel="Fight Night"
          onSecondaryAction={scrollToFightNightPlan}
          actionLabel="Boot Camp"
          onAction={scrollToBootCampPlans}
        />
      )}
    </div>
  )
}
