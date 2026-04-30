import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  curriculumModules,
  offersCurriculumSectionContent,
  offersHeroContent,
  offersOutcomeSectionContent,
  offersPlans,
  offersPlanSectionContent,
  offersSessionSectionContent,
  offersStatusCopy,
  sessions,
} from '../data/landingContent'
import { loadLiffSdk } from '../lib/liff'
import type { SessionCapacity } from '../types'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
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

type GateStatus =
  | 'loading'
  | 'missing-config'
  | 'logged-out'
  | 'not-friend'
  | 'unlocked'
  | 'error'

type GateState = {
  status: GateStatus
  message?: string
  profileName?: string
}

function LockedSection({
  children,
  title,
  gateState,
  onGateAction,
}: {
  children: ReactNode
  title: string
  gateState: GateState
  onGateAction: () => void
}) {
  if (gateState.status === 'unlocked') {
    return <>{children}</>
  }

  const helperText =
    gateState.status === 'missing-config'
      ? '尚未設定 LIFF ID，請先補上環境變數。'
      : gateState.status === 'error'
        ? gateState.message || 'LIFF 驗證失敗，請稍後再試。'
        : gateState.status === 'not-friend'
          ? '你已完成 LINE 登入，但還需要先加入官方帳號，才能解鎖完整內容。'
          : '完成 LINE Login 後，即可解鎖這個區塊的完整內容。'

  const actionLabel =
    gateState.status === 'logged-out'
      ? 'LINE Login 查看完整內容'
      : gateState.status === 'not-friend'
        ? '加入官方帳號後解鎖'
        : null

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[6px] opacity-35">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-pearl/10 bg-obsidian/90 px-6 py-7 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs md:text-sm font-heading tracking-[0.3em] text-neon/80 uppercase">
            LINE 會員專屬內容
          </p>
          <h3 className="mt-3 text-xl md:text-2xl font-heading font-bold text-pearl">
            {title}
          </h3>
          <p className="mt-3 text-sm md:text-base text-mist/75 leading-relaxed">
            {helperText}
          </p>
          {actionLabel && (
            <Button
              size="lg"
              className="mt-5"
              onClick={onGateAction}
              data-cta="offers-gate-action"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function OffersHero({ gateState }: { gateState: GateState }) {
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
      className="relative pt-28 pb-12 md:pt-36 md:pb-20 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-abyss via-obsidian to-abyss" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-neon/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-3 sm:px-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold leading-tight"
        >
          {offersHeroContent.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-3 md:mt-4 text-lg md:text-xl text-mist max-w-2xl mx-auto"
        >
          {offersHeroContent.subtitle}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-4 md:mt-6 text-sm md:text-base text-mist/70 max-w-2xl mx-auto"
        >
          {helperMessage}
        </motion.p>
      </div>
    </section>
  )
}

function OffersCurriculum() {
  return (
    <SectionWrapper id="offers-curriculum">
      <SectionHeading
        title={offersCurriculumSectionContent.title}
        subtitle={offersCurriculumSectionContent.subtitle}
      />

      <p className="text-center text-base md:text-lg text-mist/80 max-w-3xl mx-auto -mt-2 mb-8 md:mb-12 leading-relaxed">
        {offersCurriculumSectionContent.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
        {curriculumModules.map((module, i) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl border border-pearl/10 bg-black/30 p-5 md:p-6 flex gap-4"
          >
            <div className="shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br from-blaze/20 to-neon/20 border border-pearl/10 flex items-center justify-center">
              <span className="text-lg font-heading font-bold text-pearl">
                {module.stage}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-heading font-semibold text-pearl">
                {module.title}
              </h3>
              <p className="mt-2 text-sm text-mist/80 leading-relaxed">
                {module.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}

function OffersOutcomeSummary() {
  return (
    <SectionWrapper id="offers-outcome-summary">
      <SectionHeading
        title={offersOutcomeSectionContent.title}
        subtitle={offersOutcomeSectionContent.subtitle}
      />

      <div className="max-w-6xl mx-auto rounded-3xl border border-neon/15 bg-gradient-to-br from-neon/10 via-black/30 to-blaze/10 px-5 py-6 md:px-8 md:py-8">
        <p className="text-center text-xs md:text-sm font-heading tracking-[0.28em] text-neon/85 uppercase">
          {offersOutcomeSectionContent.formulaLabel}
        </p>

        <div className="mt-5 flex flex-col items-center justify-center gap-3 text-center md:flex-row md:flex-wrap">
          {offersOutcomeSectionContent.formulaInputs.map((item, index) => (
            <div key={item} className="flex items-center gap-3">
              <div className="rounded-full border border-pearl/10 bg-black/25 px-4 py-2 text-sm md:text-base text-pearl">
                {item}
              </div>
              {index < offersOutcomeSectionContent.formulaInputs.length - 1 ? (
                <span className="text-neon/80 text-lg md:text-xl">+</span>
              ) : (
                <span className="text-neon/80 text-lg md:text-xl">=</span>
              )}
            </div>
          ))}

          <div className="rounded-full border border-neon/30 bg-neon/15 px-5 py-2 text-sm md:text-base font-heading text-pearl">
            {offersOutcomeSectionContent.formulaResult}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto mt-6 md:mt-8">
        {offersOutcomeSectionContent.summaryCards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl border border-pearl/10 bg-black/30 p-5 md:p-6"
          >
            <p className="text-xs md:text-sm font-heading tracking-[0.22em] text-neon/80 uppercase">
              {card.label}
            </p>
            <h3 className="mt-3 text-xl md:text-2xl font-heading font-bold text-pearl leading-tight">
              {card.title}
            </h3>
            <p className="mt-3 text-sm md:text-base text-mist/80 leading-relaxed">
              {card.description}
            </p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}

function OffersPlans({
  gateState,
  onGateAction,
  onCtaAction,
}: {
  gateState: GateState
  onGateAction: () => void
  onCtaAction: (redirectUrl: string) => void
}) {
  return (
    <SectionWrapper id="offers-plans">
      <SectionHeading
        title={offersPlanSectionContent.title}
        subtitle={offersPlanSectionContent.subtitle}
      />

      <div className="max-w-4xl mx-auto -mt-4 mb-8 md:mb-12 rounded-2xl border border-pearl/10 bg-black/20 px-5 py-5 md:px-6 md:py-6">
        <p className="text-sm md:text-base text-mist/80 leading-relaxed">
          如果你想先驗證入口，First Round 讓你完整進場一次。若你想看到刺激如何變成壓力適應、防身反應與自信成長，Boot Camp 會讓你蛻變。
          Gear 不是紀念品，而是把這份進場感和身體記憶帶回生活。
        </p>
      </div>

      <LockedSection
        title="登入後查看完整費用資訊"
        gateState={gateState}
        onGateAction={onGateAction}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto items-start">
          {offersPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className={`relative rounded-2xl p-5 md:p-8 border transition-all duration-300 ${
                plan.highlight
                  ? 'glass border-neon/40 glow-neon md:scale-105'
                  : 'glass border-pearl/10 hover:border-pearl/20'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant={plan.highlight ? 'highlight' : 'gold'}>
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <h3 className="text-2xl font-heading font-bold mt-1 md:mt-2 mb-1">
                {plan.name}
              </h3>
              <p className="text-sm text-mist mb-3">{plan.subtitle}</p>
              <p className="text-sm md:text-base text-neon/90 leading-relaxed mb-3">
                {plan.teaserCopy}
              </p>
              <p className="text-sm md:text-base text-pearl/85 leading-relaxed mb-5 md:mb-6">
                {plan.description}
              </p>

              <div className="mb-5 md:mb-6">
                <span className="text-3xl md:text-4xl font-heading font-black text-pearl">
                  {plan.price}
                </span>
              </div>

              <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-mist"
                  >
                    <span className="text-neon mt-0.5 flex-shrink-0">•</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.ctaVariant}
                className="w-full"
                onClick={() => onCtaAction(plan.checkoutUrl)}
                data-cta={`offers-plan-${plan.id}`}
              >
                {plan.ctaLabel}
              </Button>
            </motion.div>
          ))}
        </div>
      </LockedSection>

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

export function OffersPage() {
  const [gateState, setGateState] = useState<GateState>({ status: 'loading' })

  const liffId = import.meta.env.VITE_LINE_LIFF_ID

  const runGateCheck = useCallback(async () => {
    if (!liffId) {
      setGateState({
        status: 'missing-config',
        message: '找不到 VITE_LINE_LIFF_ID，請先補上正式環境變數。',
      })
      return
    }

    try {
      const liff = await loadLiffSdk()
      await liff.init({
        liffId,
        withLoginOnExternalBrowser: false,
      })

      if (!liff.isLoggedIn()) {
        setGateState({ status: 'logged-out' })
        return
      }

      const [profile, friendship] = await Promise.all([
        liff.getProfile(),
        liff.getFriendship(),
      ])

      if (friendship.friendFlag) {
        setGateState({
          status: 'unlocked',
          profileName: profile.displayName,
        })
        return
      }

      setGateState({
        status: 'not-friend',
        profileName: profile.displayName,
        message: offersStatusCopy.notLoggedIn,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'LIFF 驗證失敗，請稍後再試。'
      setGateState({ status: 'error', message })
    }
  }, [liffId])

  useEffect(() => {
    void runGateCheck()
  }, [runGateCheck])

  const handleGateAction = useCallback(async () => {
    if (!liffId) {
      setGateState({
        status: 'missing-config',
        message: '找不到 VITE_LINE_LIFF_ID，請先補上正式環境變數。',
      })
      return
    }

    try {
      const liff = await loadLiffSdk()
      await liff.init({
        liffId,
        withLoginOnExternalBrowser: false,
      })

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href })
        return
      }

      const friendship = await liff.getFriendship()
      if (!friendship.friendFlag) {
        await liff.requestFriendship()
      }

      await runGateCheck()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'LIFF 驗證失敗，請稍後再試。'
      setGateState({ status: 'error', message })
    }
  }, [liffId, runGateCheck])

  const handleCtaAction = useCallback(
    async (redirectUrl: string) => {
      if (!liffId) {
        setGateState({
          status: 'missing-config',
          message: '找不到 VITE_LINE_LIFF_ID，請先補上正式環境變數。',
        })
        return
      }

      try {
        const liff = await loadLiffSdk()
        await liff.init({
          liffId,
          withLoginOnExternalBrowser: false,
        })

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href })
          return
        }

        const friendship = await liff.getFriendship()
        if (!friendship.friendFlag) {
          await liff.requestFriendship()
          await runGateCheck()
          return
        }

        window.open(redirectUrl, '_blank', 'noopener,noreferrer')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'LIFF 驗證失敗，請稍後再試。'
        setGateState({ status: 'error', message })
      }
    },
    [liffId, runGateCheck],
  )

  return (
    <div className="overflow-x-hidden w-full relative">
      <Header />
      <main>
        <OffersHero gateState={gateState} />
        <OffersCurriculum />
        <OffersOutcomeSummary />
        <OffersPlans
          gateState={gateState}
          onGateAction={() => void handleGateAction()}
          onCtaAction={(url) => void handleCtaAction(url)}
        />
        <OffersSessions />
      </main>
      <Footer onVenueAction={(url) => void handleCtaAction(url)} />
    </div>
  )
}
