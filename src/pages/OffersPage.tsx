import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import bootcampModule2Poster from '../assets/offers/bootcamp-module-2-poster.jpg'
import bootcampModule3Poster from '../assets/offers/bootcamp-module-3-poster.jpg'
import bootcampModule5Poster from '../assets/offers/bootcamp-module-5-poster.jpg'
import bootcampModule6Poster from '../assets/offers/bootcamp-module-6-poster.jpg'
import offersHeroPoster from '../assets/offers/offers-hero-octagon-poster.jpg'
import offersPlansTransitionPoster from '../assets/offers/offers-plans-transition-poster.jpg'
import {
  bootCampCoreContent,
  bootCampFaqItems,
  bootCampRouteContent,
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
import { useTracking } from '../hooks/useTracking'
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

const curriculumPosterMap: Partial<Record<string, string>> = {
  'module-2': bootcampModule2Poster,
  'module-3': bootcampModule3Poster,
  'module-5': bootcampModule5Poster,
  'module-6': bootcampModule6Poster,
}

const mobileFullBleedImageFrame =
  '-mx-3 rounded-none border-y border-x-0 sm:mx-0 sm:rounded-2xl sm:border md:rounded-[2rem]'

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
      className={`overflow-hidden border-pearl/10 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.35)] ${mobileFullBleedImageFrame} ${className}`}
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
          className="-mx-3 overflow-hidden rounded-none border-y border-pearl/10 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.4)] sm:mx-auto sm:rounded-2xl sm:border md:rounded-[2rem] md:shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
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

        {['not-friend', 'error'].includes(gateState.status) && (
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
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="border-y border-pearl/10 px-2 py-8 md:px-0 md:py-12"
        >
          <p className="font-heading text-xs md:text-sm font-semibold tracking-[0.28em] uppercase text-neon/85">
            BOOT CAMP EXPECTATION
          </p>
          <h2 className="mt-3 font-heading text-3xl md:text-5xl font-black leading-tight text-pearl">
            {offersCurriculumSectionContent.title}
          </h2>
          <p className="mt-4 max-w-3xl text-base md:text-lg leading-relaxed text-mist/78">
            {offersCurriculumSectionContent.subtitle}
          </p>
          <p className="mt-3 max-w-3xl text-sm md:text-base leading-relaxed text-mist/62">
            {offersCurriculumSectionContent.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {curriculumModules.map((module, i) => {
            const poster = curriculumPosterMap[module.id]
            if (!poster) {
              return null
            }

            return (
              <PosterFigure
                key={module.id}
                src={poster}
                alt={`${module.title} ${module.description}`}
                delay={i * 0.08}
                className="md:rounded-[1.75rem] shadow-[0_24px_60px_rgba(0,0,0,0.3)]"
              >
                <h3>
                  {module.stage}. {module.title}
                </h3>
                <p>{module.description}</p>
              </PosterFigure>
            )
          })}
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
            如果你已經確認想走進更完整的系統，Boot Camp 會把一晚的刺激轉成更穩定、更敢行動的身體記憶。
          </p>
        </PosterFigure>
      </div>

      <BootCampCoreSection />

      <BootCampRouteComparison
        onRouteSelect={(route) => onScheduleNav('BOOT_CAMP', route)}
      />

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

function BootCampCoreSection() {
  return (
    <div className="mx-auto mb-8 max-w-6xl md:mb-10">
      <div className="border-y border-pearl/10 py-6 md:py-8">
        <div className="max-w-3xl">
          <p className="text-xs md:text-sm font-heading tracking-[0.28em] text-neon uppercase">
            {bootCampCoreContent.eyebrow}
          </p>
          <h3 className="mt-3 text-2xl md:text-4xl font-heading font-bold text-pearl leading-tight">
            {bootCampCoreContent.title}
          </h3>
          <p className="mt-4 text-sm md:text-lg leading-relaxed text-mist/75">
            {bootCampCoreContent.description}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:mt-7 md:grid-cols-3">
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
    </div>
  )
}

function BootCampRouteComparison({
  onRouteSelect,
}: {
  onRouteSelect: (route: BootCampRoute) => void
}) {
  const routes: BootCampRoute[] = ['BOXING', 'MUAY_THAI']

  return (
    <div className="mx-auto mb-8 grid max-w-6xl grid-cols-1 gap-4 md:mb-10 md:grid-cols-2 md:gap-6">
      {routes.map((route) => {
        const content = bootCampRouteContent[route]
        const accentClass =
          route === 'BOXING'
            ? 'border-blaze/25 bg-blaze/10'
            : 'border-neon/25 bg-neon/10'
        const badgeClass =
          route === 'BOXING'
            ? 'border-blaze/35 bg-blaze/15 text-blaze'
            : 'border-neon/35 bg-neon/15 text-neon'

        return (
          <motion.article
            key={route}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className={`rounded-2xl border p-5 md:p-6 ${accentClass}`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-heading tracking-[0.24em] text-mist/55">
                  {content.badge}
                </p>
                <h3 className="mt-1 text-2xl font-heading font-bold text-pearl">
                  {content.label}
                </h3>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-heading tracking-wide ${badgeClass}`}
              >
                {content.shortLabel}
              </span>
            </div>

            <p className="text-base font-heading font-semibold leading-snug text-pearl">
              {content.headline}
            </p>
            <p className="mt-3 rounded-xl border border-pearl/10 bg-black/25 px-3 py-2 text-sm leading-relaxed text-neon/85">
              {content.fighterLesson}
            </p>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-mist/75">
              {content.summary}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-mist/60">
              {content.bestFor}
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
              variant={route === 'BOXING' ? 'secondary' : 'primary'}
              className="mt-5 w-full"
              onClick={() => onRouteSelect(route)}
              data-cta={`bootcamp-route-${route.toLowerCase()}`}
            >
              看這條路徑可購買場次
            </Button>
          </motion.article>
        )
      })}
    </div>
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
  const { track, trackGateAccess } = useTracking()

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

  const navigateToSchedule = useCallback(
    (category: CourseCategory, route?: BootCampRoute) => {
      track({
        event: 'offer_schedule_nav_click',
        params: {
          category,
          route: route ?? 'none',
        },
      })
      setScheduleCategory(category)
      setScheduleRoute(category === 'BOOT_CAMP' ? route ?? null : null)
      const el = document.getElementById('weekly-schedule')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    [track],
  )

  const handleGateAction = useCallback(() => {
    trackGateAccess('offers_page', gateState.status)
    if (!loginUrl) void requestGateAccess()
  }, [gateState.status, loginUrl, requestGateAccess, trackGateAccess])

  const handlePlanCta = useCallback(
    (url: string, planId: string) => {
      if (planId === fightNightPassPlan.id) {
        track({
          event: 'plan_cta_click',
          params: {
            plan_id: planId,
            action_type: 'schedule_nav',
          },
        })
        navigateToSchedule('FIGHT_NIGHT')
        return
      }

      const target = planScheduleTargetMap[planId]
      if (target) {
        track({
          event: 'plan_cta_click',
          params: {
            plan_id: planId,
            action_type: 'schedule_nav',
            category: target.category,
            route: target.route ?? 'none',
          },
        })
        navigateToSchedule(target.category, target.route)
        return
      }

      track({
        event: 'plan_cta_click',
        params: {
          plan_id: planId,
          action_type: 'line_gate',
        },
        metaStandardEvent: 'Lead',
        lineEventName: 'LeadClick',
      })
      void openWhenUnlocked(url)
    },
    [navigateToSchedule, openWhenUnlocked, track],
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
          onGateAction={handleGateAction}
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
          onGateAction={handleGateAction}
          onCtaAction={handlePlanCta}
          onScheduleNav={navigateToSchedule}
          scheduleCountByCategory={scheduleCountByCategory}
          loginUrl={loginUrl}
        />
        <WeeklyScheduleSection
          title="目前可購買的課程名額"
          subtitle="先選一個你真的會出現的日期、場館與時段，再把那一場的位置保留下來。"
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
      <Footer />
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
