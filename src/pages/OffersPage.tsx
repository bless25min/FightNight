import { motion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
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
  offersCurriculumSectionContent,
  offersHeroContent,
  offersOutcomeSectionContent,
  offersPlans,
  offersPlanSectionContent,
  offersSessionSectionContent,
  planScheduleCategoryMap,
  sessions,
} from '../data/landingContent'
import { SCHEDULE_DISPLAY_LIMIT } from '../data/weeklySchedule'
import type { LiffGateState } from '../hooks/useLiffGate'
import { useLiffGate } from '../hooks/useLiffGate'
import type { CourseCategory, SessionCapacity } from '../types'
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
import { SectionHeading } from '../components/ui/SectionHeading'
import { SectionWrapper } from '../components/ui/SectionWrapper'

const capacityStyles: Record<
  SessionCapacity,
  { label: string; className: string }
> = {
  仍可報名: {
    label: '仍可報名',
    className: 'bg-neon/15 text-neon border-neon/30',
  },
  名額緊張: {
    label: '名額緊張',
    className: 'bg-gold/15 text-gold border-gold/30',
  },
  即將額滿: {
    label: '即將額滿',
    className: 'bg-blaze/15 text-blaze border-blaze/30',
  },
  本月已額滿: {
    label: '本月已額滿',
    className: 'bg-pearl/10 text-mist/60 border-pearl/10',
  },
}

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
      <img src={src} alt={alt} className="w-full h-auto" loading={loading} />
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
      className="relative pt-20 pb-2 md:pt-36 md:pb-20 overflow-hidden"
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
          <img
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

function OffersPlans({
  gateState,
  onGateAction,
  onCtaAction,
  onScheduleNav,
  scheduleCountByCategory,
  liffUrl,
}: {
  gateState: LiffGateState
  onGateAction: () => void
  onCtaAction: (redirectUrl: string, planId: string) => void
  onScheduleNav: (category: CourseCategory) => void
  scheduleCountByCategory: Record<CourseCategory, number>
  liffUrl?: string
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
            如果你想先驗證入口，First Round 讓你完整進場一次。若你想看到刺激如何變成壓力適應、防身反應與自信成長，Boot Camp 會讓你蛻變。
          </p>
        </PosterFigure>
      </div>

      <LockedContent
        title="登入後查看完整費用資訊"
        gateState={gateState}
        liffUrl={liffUrl}
        onGateAction={onGateAction}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto items-start">
          {offersPlans.map((plan, i) => {
            const planCategory = planScheduleCategoryMap[plan.id]
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={i}
                onCtaAction={onCtaAction}
                scheduleCategory={planCategory}
                scheduleCount={
                  planCategory ? scheduleCountByCategory[planCategory] : undefined
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

function OffersSessions() {
  return (
    <SectionWrapper id="offers-sessions">
      <SectionHeading
        title={offersSessionSectionContent.title}
        subtitle={offersSessionSectionContent.subtitle}
      />

      <p className="text-center text-sm md:text-base text-neon/90 font-heading tracking-wide -mt-2 mb-8 md:mb-12">
        {offersSessionSectionContent.ruleLine}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
        {sessions.map((session, i) => {
          const capacity = capacityStyles[session.capacity]
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-pearl/10 bg-black/30 p-5 md:p-6 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base md:text-lg font-heading font-semibold text-pearl leading-snug">
                  {session.venueName}
                </h3>
                <span
                  className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-heading font-medium border ${capacity.className}`}
                >
                  {capacity.label}
                </span>
              </div>

              <div className="space-y-1 text-sm text-mist">
                <p className="text-pearl/90 font-heading">
                  {session.date}{' '}
                  <span className="text-mist/60">{session.weekday}</span>
                </p>
                <p>{session.time}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <p className="text-center text-xs md:text-sm text-mist/50 max-w-2xl mx-auto mt-6 md:mt-8">
        {offersSessionSectionContent.footnote}
      </p>
    </SectionWrapper>
  )
}

const scheduleCountByCategory: Record<CourseCategory, number> = {
  FIGHT_NIGHT: SCHEDULE_DISPLAY_LIMIT,
  BOOT_CAMP: SCHEDULE_DISPLAY_LIMIT,
}

export function OffersPage() {
  const { gateState, requestGateAccess, openWhenUnlocked, liffUrl } =
    useLiffGate()

  const [scheduleCategory, setScheduleCategory] =
    useState<CourseCategory>('FIGHT_NIGHT')

  const navigateToSchedule = useCallback((category: CourseCategory) => {
    setScheduleCategory(category)
    const el = document.getElementById('weekly-schedule')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <div className="overflow-x-hidden w-full relative">
      <Header />
      <main>
        <OffersHero gateState={gateState} />
        <PainSection />
        <OldFrameworkBreakSection />
        <NewModelSection />
        <FormulaSection />
        <ExperienceFlowSection />
        <IdentitySection />
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
          onCtaAction={(url) => void openWhenUnlocked(url)}
          onScheduleNav={navigateToSchedule}
          scheduleCountByCategory={scheduleCountByCategory}
          liffUrl={liffUrl}
        />
        <OffersSessions />
        <WeeklyScheduleSection
          activeCategory={scheduleCategory}
          onCategoryChange={setScheduleCategory}
        />
        <FAQSection />
      </main>
      <Footer onVenueAction={(url) => void openWhenUnlocked(url)} />
    </div>
  )
}
