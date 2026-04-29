import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  coaches,
  curriculumModules,
  offersCoachSectionContent,
  offersCurriculumSectionContent,
  offersFinalCtaContent,
  offersHeroContent,
  offersPlans,
  offersPlanSectionContent,
  offersSessionSectionContent,
  offersStatusCopy,
  offersVenueSectionContent,
  sessions,
  siteConfig,
  venues,
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
  { label: string; className: string; available: boolean }
> = {
  仍可報名: {
    label: '仍可報名',
    className: 'bg-neon/15 text-neon border-neon/30',
    available: true,
  },
  名額緊張: {
    label: '名額緊張',
    className: 'bg-gold/15 text-gold border-gold/30',
    available: true,
  },
  即將額滿: {
    label: '即將額滿',
    className: 'bg-blaze/15 text-blaze border-blaze/30',
    available: true,
  },
  本月已額滿: {
    label: '本月已額滿',
    className: 'bg-pearl/10 text-mist/60 border-pearl/10',
    available: false,
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

const unlockPreviewItems = [
  {
    title: '你為什麼總是先縮起來',
    description:
      '不是你太脆弱，而是你已經習慣先把自己縮小，讓事情趕快過去。',
  },
  {
    title: '以前的方法為什麼沒改變你',
    description:
      '你不是沒試過，只是很多方法只能讓你暫時撐過去，沒有真的把你帶出來。',
  },
  {
    title: '四堂系統怎麼讓你變穩',
    description:
      '從把壓力打開開始，到真正長出力量、判斷與底氣，這裡會把整條路說清楚。',
  },
  {
    title: '教練、場次與方案內容',
    description:
      '你也會看到由誰帶你走這段改變、什麼時候進場，以及現在最適合你的選擇。',
  },
]

const pressurePainPoints = [
  {
    title: '當下，你總是先忍住',
    description:
      '面對強勢的人、權威的人、帶壓迫感的情境時，第一反應常常不是表達，而是先低頭、先忍住、先把自己縮小。',
  },
  {
    title: '事後，那些情緒沒有真的離開',
    description:
      '那些說不出口的委屈、憤怒、害怕和無力，最後都留在身體裡。表面看起來沒事，心裡其實累積了很多沒有出口的壓力。',
  },
  {
    title: '你真正想要的，不只是當下舒服',
    description:
      '不是再忍一次，也不是短暫忘記，而是希望自己有一天面對壓力時，真的能站穩、看清楚、不要再那麼容易被壓住。',
  },
]

const oldFrameworkPoints = [
  {
    title: '忍住',
    description:
      '大多數時候，你只能先把情緒壓回去，讓當下趕快過去。事情結束了，但壓力反應沒有真的離開。',
  },
  {
    title: '轉移',
    description:
      '滑手機、工作、睡覺、吃東西、讓自己忙起來，都能暫時不去感覺，但那只是把不舒服往後延。',
  },
  {
    title: '短暫發洩',
    description:
      '偶爾爆掉一次也許會舒服一點，但回到現實，面對壓力時，你還是會很快回到原本退縮、慌張或僵住的模式。',
  },
]

const whyItWorksPoints = [
  {
    title: '壓力反應不只在腦裡，也在身體裡',
    description:
      '當一個人長期習慣的是縮、僵、忍住，遇到情況時就會下意識先退。這不是你不夠勇敢，而是身體已經記住那種反應。',
  },
  {
    title: '這套訓練先讓你把壓力釋放出來',
    description:
      '透過節奏、擊打、出力和帶動，把長期悶住的情緒從身體裡打開，先讓你不再只是靠忍耐撐過去。',
  },
  {
    title: '再把釋放，慢慢變成力量、判斷與底氣',
    description:
      '當你反覆練習站穩、出力、看距離、做反應，身體就會慢慢學會另一種回應方式。恐懼感和壓力感，也就不再像以前那樣輕易把你壓住。',
  },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function LockedSection({
  children,
  overlayTitle,
  gateState,
  onPrimaryAction,
}: {
  children: ReactNode
  overlayTitle: string
  gateState: GateState
  onPrimaryAction: () => void
}) {
  if (gateState.status === 'unlocked') {
    return <>{children}</>
  }

  const primaryLabel =
    gateState.status === 'not-friend' ? '加入官方帳號後解鎖' : '快速登入查看'

  const helperText =
    gateState.status === 'missing-config'
      ? '尚未設定 LIFF ID，請先補上環境變數。'
      : gateState.status === 'error'
        ? gateState.message || 'LIFF 驗證失敗，請稍後再試。'
        : gateState.status === 'not-friend'
          ? '你已完成 LINE 登入，但還需要先加入官方帳號，才能解鎖會員內容。'
          : '快速完成 LINE Login 後，即可解鎖這個區塊的完整內容。'

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
          <div className="mt-5 flex justify-center">
            <Button size="lg" onClick={onPrimaryAction} data-cta="offers-unlock">
              {primaryLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OffersHero({
  gateState,
  onPrimaryAction,
}: {
  gateState: GateState
  onPrimaryAction: () => void
}) {
  const helperMessage = useMemo(() => {
    if (gateState.status === 'not-friend') {
      return '你已完成 LINE 登入，下一步先加入官方帳號，才能查看完整會員內容。'
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

  const primaryLabel =
    gateState.status === 'unlocked'
      ? '查看完整內容'
      : gateState.status === 'not-friend'
        ? '加入官方帳號後解鎖'
        : offersHeroContent.primaryCta

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

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Button size="lg" onClick={onPrimaryAction}>
            {primaryLabel}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => scrollTo(gateState.status === 'unlocked' ? 'offers-pain' : 'offers-preview')}
          >
            {offersHeroContent.secondaryCta}
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

function OffersUnlockPreview() {
  return (
    <SectionWrapper id="offers-preview">
      <SectionHeading
        title="你會在這裡看到什麼"
        subtitle="不是一堆課表和價錢，而是把你為什麼總是忍住、這套系統怎麼讓你走出來，完整講清楚。"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
        {unlockPreviewItems.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl border border-pearl/10 bg-black/30 p-5 md:p-6"
          >
            <p className="text-xs font-heading tracking-[0.25em] text-neon/80 uppercase">
              預覽
            </p>
            <h3 className="mt-3 text-lg font-heading font-semibold text-pearl">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-mist/75 leading-relaxed">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}

function OffersPainSection() {
  return (
    <SectionWrapper id="offers-pain">
      <SectionHeading
        title="你不是沒有情緒，而是一直都只能低頭忍住"
        subtitle="很多人面對壓力、壓迫、衝突與負面情緒時，第一反應不是表達，而是先縮起來。久了，連自己都忘了什麼叫真正站穩。"
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
              痛點 0{i + 1}
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
          你想要的，不只是發洩一次。
          <br />
          而是有一天面對壓力時，不再下意識低頭，而是真的能站穩、看清楚、把自己留在原地。
        </p>
      </div>
    </SectionWrapper>
  )
}

function OffersOldFrameworkSection() {
  return (
    <SectionWrapper id="offers-old-framework">
      <SectionHeading
        title="以前的方法，為什麼沒有真的改變你"
        subtitle="因為多數方法只是幫你先不要那麼難受，不是真的在改變你面對壓力時的身體反應。"
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

function OffersCurriculum({
  gateState,
  onPrimaryAction,
}: {
  gateState: GateState
  onPrimaryAction: () => void
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
        gateState={gateState}
        onPrimaryAction={onPrimaryAction}
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

function OffersWhyItWorksSection() {
  return (
    <SectionWrapper id="offers-why-it-works">
      <SectionHeading
        title="為什麼這套訓練，能讓恐懼感與壓力感慢慢降下來"
        subtitle="因為壓力反應不只存在情緒裡，也存在身體裡。當身體學會另一種回應方式，你整個人就會慢慢不一樣。"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
        {whyItWorksPoints.map((point, i) => (
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

      <p className="text-center text-base md:text-lg text-mist/80 max-w-4xl mx-auto mt-8 md:mt-12 leading-relaxed">
        所以四堂課後你帶走的，不只是流汗後的短暫輕鬆，而是更能掌握力量、看懂距離、
        穩住反應。那些以前一下就把你壓住的情境，會開始沒有那麼容易把你整個人吞掉。
      </p>
    </SectionWrapper>
  )
}

function OffersPlans({
  gateState,
  onPrimaryAction,
}: {
  gateState: GateState
  onPrimaryAction: () => void
}) {
  return (
    <SectionWrapper id="offers-plans">
      <SectionHeading
        title={offersPlanSectionContent.title}
        subtitle={offersPlanSectionContent.subtitle}
      />

      <LockedSection
        overlayTitle="登入後查看完整費用資訊"
        gateState={gateState}
        onPrimaryAction={onPrimaryAction}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto items-start">
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
                href={siteConfig.lineUrl}
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

function OffersCoaches({
  gateState,
  onPrimaryAction,
}: {
  gateState: GateState
  onPrimaryAction: () => void
}) {
  return (
    <SectionWrapper id="offers-coaches">
      <SectionHeading
        title={offersCoachSectionContent.title}
        subtitle={offersCoachSectionContent.subtitle}
      />

      <p className="text-center text-base md:text-lg text-mist/80 max-w-3xl mx-auto -mt-2 mb-8 md:mb-12 leading-relaxed">
        {offersCoachSectionContent.description}
      </p>

      <LockedSection
        overlayTitle="登入後查看完整教練資訊"
        gateState={gateState}
        onPrimaryAction={onPrimaryAction}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {coaches.map((coach, i) => (
            <motion.div
              key={coach.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-pearl/10 bg-black/30 p-5 md:p-6 flex flex-col gap-3"
            >
              <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-pearl/5 to-pearl/0 border border-pearl/5 flex items-center justify-center text-mist/30 text-xs">
                教練照片
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-pearl">
                  {coach.name}
                </h3>
                <p className="text-sm text-mist/70 mt-0.5">{coach.title}</p>
              </div>
              <p className="text-sm text-mist leading-relaxed flex-1">
                {coach.bio}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {coach.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </LockedSection>
    </SectionWrapper>
  )
}

function OffersSessions({
  gateState,
  onPrimaryAction,
}: {
  gateState: GateState
  onPrimaryAction: () => void
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
        gateState={gateState}
        onPrimaryAction={onPrimaryAction}
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

                <Button
                  variant={capacity.available ? 'ghost' : 'secondary'}
                  className="w-full mt-auto"
                  href={capacity.available ? session.lineUrl : siteConfig.lineUrl}
                  data-cta={`offers-session-${session.id}`}
                >
                  {capacity.available
                    ? offersSessionSectionContent.bookCtaLabel
                    : '加入 LINE 等候通知'}
                </Button>
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

function OffersVenues({
  gateState,
  onPrimaryAction,
}: {
  gateState: GateState
  onPrimaryAction: () => void
}) {
  return (
    <SectionWrapper id="offers-venues">
      <SectionHeading
        title={offersVenueSectionContent.title}
        subtitle={offersVenueSectionContent.subtitle}
      />

      <LockedSection
        overlayTitle="登入後查看完整場館資訊"
        gateState={gateState}
        onPrimaryAction={onPrimaryAction}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {venues.map((venue, i) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-pearl/10 bg-black/30 p-5 md:p-6 flex flex-col gap-3"
            >
              <h3 className="text-base md:text-lg font-heading font-semibold text-pearl">
                {venue.name}
              </h3>
              <div className="space-y-1.5 text-sm text-mist/80 leading-relaxed flex-1">
                <p>{venue.address}</p>
                <p className="text-mist/60">{venue.transit}</p>
              </div>
              <Button
                variant="secondary"
                className="w-full mt-1"
                href={venue.lineUrl}
                data-cta={`offers-venue-${venue.id}`}
              >
                {offersVenueSectionContent.ctaLabel}
              </Button>
            </motion.div>
          ))}
        </div>
      </LockedSection>
    </SectionWrapper>
  )
}

function OffersFinalCta({
  gateState,
  onPrimaryAction,
}: {
  gateState: GateState
  onPrimaryAction: () => void
}) {
  const primaryLabel =
    gateState.status === 'not-friend'
      ? '加入官方帳號後解鎖'
      : gateState.status === 'unlocked'
        ? '查看完整內容'
        : offersFinalCtaContent.primaryCta

  return (
    <SectionWrapper id="offers-final" className="relative text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-neon/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold leading-tight"
        >
          {offersFinalCtaContent.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-3 md:mt-4 text-base sm:text-lg md:text-xl text-mist"
        >
          {offersFinalCtaContent.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Button size="lg" onClick={onPrimaryAction} data-cta="offers-final-primary">
            {primaryLabel}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => scrollTo('offers-hero')}
          >
            {offersFinalCtaContent.secondaryCta}
          </Button>
        </motion.div>
      </div>
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

  const handlePrimaryAction = useCallback(async () => {
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

      scrollTo('offers-pain')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'LIFF 驗證失敗，請稍後再試。'
      setGateState({ status: 'error', message })
    }
  }, [liffId, runGateCheck])

  useEffect(() => {
    const onHeaderAction = () => {
      void handlePrimaryAction()
    }
    window.addEventListener('offers-auth-action', onHeaderAction)
    return () => window.removeEventListener('offers-auth-action', onHeaderAction)
  }, [handlePrimaryAction])

  return (
    <div className="overflow-x-hidden w-full relative">
      <Header />
      <main>
        <OffersHero gateState={gateState} onPrimaryAction={() => void handlePrimaryAction()} />
        <OffersUnlockPreview />
        <OffersPainSection />
        <OffersOldFrameworkSection />
        <OffersCurriculum
          gateState={gateState}
          onPrimaryAction={() => void handlePrimaryAction()}
        />
        <OffersWhyItWorksSection />
        <OffersCoaches
          gateState={gateState}
          onPrimaryAction={() => void handlePrimaryAction()}
        />
        <OffersSessions
          gateState={gateState}
          onPrimaryAction={() => void handlePrimaryAction()}
        />
        <OffersPlans gateState={gateState} onPrimaryAction={() => void handlePrimaryAction()} />
        <OffersVenues gateState={gateState} onPrimaryAction={() => void handlePrimaryAction()} />
        <OffersFinalCta
          gateState={gateState}
          onPrimaryAction={() => void handlePrimaryAction()}
        />
      </main>
      <Footer />
    </div>
  )
}
