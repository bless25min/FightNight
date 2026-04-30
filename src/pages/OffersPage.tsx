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

const pressurePainPoints = [
  {
    title: '先被熱鬧吸引，沒有錯',
    description:
      '想聽很重的音樂、想跟一群人一起動、想讓今晚不要又只是滑手機過掉。這不是膚淺，而是身體在提醒你：你需要被喚醒。',
  },
  {
    title: '真正累的不是身體，是一直忍住',
    description:
      '委屈、壓力和害怕吞久了，人會變得麻木、易怒、睡不好，明明很累，卻又停不下來。熱鬧和刺激，像是在替那一團卡住的東西找出口。',
  },
  {
    title: '你要的不是更吵，是重新回到自己身上',
    description:
      '真正吸引人的不是現場有多嗨，而是某個瞬間你終於不再飄著。注意力、情緒和身體都回來，只剩下呼吸、拳套和眼前那一下。',
  },
]

const oldFrameworkPoints = [
  {
    title: '熱鬧可以遮住空掉的感覺',
    description:
      '吃飯、唱歌、喝酒、聚會都能讓你暫時不想太多。但如果結束後又回到空、悶、累，那只是短暫蓋住，不是真的被處理。',
  },
  {
    title: '運動可以讓你累，卻不一定讓你釋放',
    description:
      '你可以流汗、可以痠、可以完成任務。但如果情緒還是卡在身體裡，那只是消耗體力，不是讓壓力有地方出去。',
  },
  {
    title: '新鮮感可以點燃一次，但很難接住你',
    description:
      '你真正需要的不是又一個第一次，而是一個能把你帶進去、讓你交出去、再把你安全帶回來的場。',
  },
]

const bridgeLayers = [
  {
    label: '第一層',
    title: '先讓看不見的壓力有形狀',
    description:
      '很多情緒說不清楚，但身體知道。肩膀緊、胸口悶、睡不好、一直煩，這些都需要一個比聊天更直接的出口。',
  },
  {
    label: '第二層',
    title: '再給它一個安全的去處',
    description:
      '拳套和沙包的價值在這裡出現：不是為了打人，也不是為了逞強，而是讓壓力可以被打出去，卻不傷害任何人。',
  },
  {
    label: '第三層',
    title: '最後用節奏把你帶回來',
    description:
      '音樂、人群、回合和現場引導，會讓你不是亂衝，而是在強烈裡被接住。這就是刺激和價值真正接上的地方。',
  },
]

function LockedSection({
  children,
  overlayTitle,
  overlayDescription,
  gateState,
  onGateAction,
}: {
  children: ReactNode
  overlayTitle: string
  overlayDescription?: string
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
          : overlayDescription || '完成 LINE Login 後，即可解鎖這個區塊的完整內容。'

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
            {overlayTitle}
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
    if (gateState.status === 'unlocked') {
      return `${gateState.profileName || '會員'}，你已完成解鎖，可以直接往下查看完整內容。`
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

function OffersPainSection() {
  return (
    <SectionWrapper id="offers-pain">
      <SectionHeading
        title="那個想找刺激的自己，其實很誠實"
        subtitle="首頁讓你看到一個很嗨的夜晚。方案頁要承接的是那個更安靜的理由：你可能不是只想玩，而是太久沒有把壓力真正放下。"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
        {pressurePainPoints.map((point, i) => (
          <motion.div
            key={point.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl border border-pearl/10 bg-black/30 p-5 md:p-6"
          >
            <p className="text-xs font-heading tracking-[0.28em] text-neon/80 uppercase">
              線索 0{i + 1}
            </p>
            <h3 className="mt-3 text-lg font-heading font-semibold text-pearl">
              {point.title}
            </h3>
            <p className="mt-3 text-sm md:text-base text-mist/80 leading-relaxed">
              {point.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto mt-8 md:mt-12 rounded-3xl border border-neon/15 bg-gradient-to-br from-neon/10 via-black/25 to-blaze/5 px-6 py-8 md:px-10 md:py-10 text-center">
        <p className="text-lg md:text-2xl font-heading font-semibold text-pearl leading-relaxed">
          Fight Night 接住的，就是那個一直想逃離日常、想找刺激、想重新有感覺的自己。不是把你推去硬撐，而是給你一個安全、強烈、有人帶著走的出口。
        </p>
      </div>
    </SectionWrapper>
  )
}

function OffersOldFrameworkSection() {
  return (
    <SectionWrapper id="offers-old-framework">
      <SectionHeading
        title="很多活動能讓你暫時逃開，但不一定能讓你回來"
        subtitle="Fight Night 的價值，不是比誰更吵、更累、更刺激，而是把熱鬧變成出口，把刺激變成釋放，把一晚的亢奮變成你重新回到自己身上的感覺。"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
        {oldFrameworkPoints.map((point, i) => (
          <motion.div
            key={point.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl border border-pearl/10 bg-black/30 p-5 md:p-6"
          >
            <h3 className="text-lg font-heading font-semibold text-pearl">
              {point.title}
            </h3>
            <p className="mt-3 text-sm md:text-base text-mist/80 leading-relaxed">
              {point.description}
            </p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}

function OffersBridgeSection() {
  return (
    <SectionWrapper id="offers-bridge">
      <SectionHeading
        title="所以不是突然談格鬥，而是壓力本來就在身體裡"
        subtitle="如果問題只是在腦袋裡，想通就夠了。但很多人的壓力是卡在身體裡，所以 Fight Night 要用拳套、沙包、節奏和人群，把那份卡住變成能被釋放、能被帶回來的過程。"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
        {bridgeLayers.map((layer, i) => (
          <motion.div
            key={layer.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl border border-neon/15 bg-gradient-to-br from-neon/10 via-black/30 to-blaze/5 p-5 md:p-6"
          >
            <p className="text-xs font-heading tracking-[0.26em] text-neon/85 uppercase">
              {layer.label}
            </p>
            <h3 className="mt-3 text-xl font-heading font-semibold text-pearl leading-tight">
              {layer.title}
            </h3>
            <p className="mt-3 text-sm md:text-base text-mist/80 leading-relaxed">
              {layer.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto mt-8 md:mt-12 rounded-3xl border border-pearl/10 bg-black/25 px-6 py-7 md:px-10 md:py-8 text-center">
        <p className="text-base md:text-xl font-heading font-semibold text-pearl leading-relaxed">
          到這裡，格鬥才自然出場：它不是課程的硬派包裝，而是把壓力變成動作、把刺激變成釋放、再把你安全帶回來的方法。
        </p>
      </div>
    </SectionWrapper>
  )
}

function OffersCurriculum({
  gateState,
  onGateAction,
}: {
  gateState: GateState
  onGateAction: () => void
}) {
  return (
    <SectionWrapper id="offers-curriculum">
      <SectionHeading
        title={offersCurriculumSectionContent.title}
        subtitle={offersCurriculumSectionContent.subtitle}
      />

      <p className="text-center text-base md:text-lg text-mist/80 max-w-3xl mx-auto -mt-2 mb-8 md:mb-12 leading-relaxed">
        {offersCurriculumSectionContent.description}
      </p>

      <LockedSection
        overlayTitle={offersCurriculumSectionContent.overlayTitle}
        overlayDescription={offersCurriculumSectionContent.overlayDescription}
        gateState={gateState}
        onGateAction={onGateAction}
      >
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
      </LockedSection>
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
          如果你只是被這個夜晚吸引，First Round 讓你安全進場。若你已經知道自己需要一個穩定出口，Signature 會把四次節奏接起來。
          Gear 不是紀念品，而是把這份進場感帶走。
        </p>
      </div>

      <LockedSection
        overlayTitle="登入後查看完整費用資訊"
        overlayDescription={offersPlanSectionContent.overlayDescription}
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

function OffersSessions({
  gateState,
  onGateAction,
}: {
  gateState: GateState
  onGateAction: () => void
}) {
  return (
    <SectionWrapper id="offers-sessions">
      <SectionHeading
        title={offersSessionSectionContent.title}
        subtitle={offersSessionSectionContent.subtitle}
      />

      <p className="text-center text-sm md:text-base text-neon/90 font-heading tracking-wide -mt-2 mb-8 md:mb-12">
        {offersSessionSectionContent.ruleLine}
      </p>

      <LockedSection
        overlayTitle="登入後查看完整活動場次"
        overlayDescription={offersSessionSectionContent.overlayDescription}
        gateState={gateState}
        onGateAction={onGateAction}
      >
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
      </LockedSection>

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
        <OffersPainSection />
        <OffersOldFrameworkSection />
        <OffersBridgeSection />
        <OffersCurriculum
          gateState={gateState}
          onGateAction={() => void handleGateAction()}
        />
        <OffersOutcomeSummary />
        <OffersPlans
          gateState={gateState}
          onGateAction={() => void handleGateAction()}
          onCtaAction={(url) => void handleCtaAction(url)}
        />
        <OffersSessions
          gateState={gateState}
          onGateAction={() => void handleGateAction()}
        />
      </main>
      <Footer onVenueAction={(url) => void handleCtaAction(url)} />
    </div>
  )
}
