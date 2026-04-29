import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  curriculumModules,
  offersCurriculumSectionContent,
  offersHeroContent,
  offersPlans,
  offersPlanSectionContent,
  offersProofSectionContent,
  offersSessionSectionContent,
  offersStatusCopy,
  sessions,
  siteConfig,
} from '../data/landingContent'
import proofLeadPoster from '../assets/landing/flow-step-1.png'
import proofTrainingPoster from '../assets/landing/flow-step-2.png'
import proofIntensityPoster from '../assets/landing/flow-step-3.png'
import proofReleasePoster from '../assets/landing/flow-step-4.png'
import proofAfterglowPoster from '../assets/landing/flow-step-5.png'
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
    title: '你明明不想退，身體卻先縮了',
    description:
      '有些場面一靠近，你就先笑、先忍、先把話吞回去。不是你沒脾氣，是身體已經學會先求安全。',
  },
  {
    title: '壓力沒有消失，只是換地方住',
    description:
      '它會住進睡眠、胸口、肩頸、心跳和脾氣裡。白天看起來正常，晚上卻很難真正放下。',
  },
  {
    title: '你開始避開一切會讓你失控的東西',
    description:
      '不想碰衝突、不想見人、不想解釋。生活看似安靜，其實你的自由正在一點一點縮小。',
  },
]

const oldFrameworkPoints = [
  {
    title: '把自己麻掉',
    description:
      '滑手機、喝酒、暴食、把行程塞滿，都能暫時關掉感覺，但隔天壓力還在。',
  },
  {
    title: '把世界關小',
    description:
      '少說、少見、少參與，短期像保護自己，長期會讓你更孤單、更不敢出手。',
  },
  {
    title: '等到爆掉，才知道自己已經滿了',
    description:
      '爆發不是釋放，是系統過載。真正需要的不是下一次忍更久，而是學會在壓力中穩住。',
  },
]

const proofMoments = [
  {
    id: 'guided-entry',
    image: proofLeadPoster,
    title: '有人在旁邊把你帶進狀態',
    caption: '新手不需要自己摸索，現場會有人看節奏、看動作、看安全感。',
  },
  {
    id: 'training-room',
    image: proofTrainingPoster,
    title: '不是亂打，是被編排過的進場',
    caption: '分組、沙包、節奏和距離感，都會被安排在可控的範圍裡。',
  },
  {
    id: 'group-push',
    image: proofIntensityPoster,
    title: '群體會把你推到平常到不了的位置',
    caption: '你不是一個人在撐，現場的聲音、節奏和人會一起把你推進去。',
  },
  {
    id: 'release',
    image: proofReleasePoster,
    title: '真正釋放時，世界會變得很安靜',
    caption: '注意力被收回身體，只剩下呼吸、拳套、沙包和那一下。',
  },
  {
    id: 'afterglow',
    image: proofAfterglowPoster,
    title: '結束後留下的，不只是汗',
    caption: '你會記得自己完成了一件平常不會做的事，也記得那群一起進場的人。',
  },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function LockedSection({
  children,
  overlayTitle,
  overlayDescription,
  gateState,
}: {
  children: ReactNode
  overlayTitle: string
  overlayDescription?: string
  gateState: GateState
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
          ? '你已完成 LINE 登入，但還需要先加入官方帳號。可從頁面右上角完成解鎖。'
          : `${overlayDescription || '完成 LINE Login 後，即可解鎖這個區塊的完整內容。'} 可從頁面右上角操作。`

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
        </div>
      </div>
    </div>
  )
}

function OffersHero({ gateState }: { gateState: GateState }) {
  const helperMessage = useMemo(() => {
    if (gateState.status === 'not-friend') {
      return '你已完成 LINE 登入，下一步可從頁面右上角加入官方帳號，解鎖完整會員內容。'
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
    return `${offersHeroContent.description} 想解鎖完整內容，可從頁面右上角進入。`
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
        title="你不是不夠強，是太久沒有出口"
        subtitle="真正消耗人的不是一次衝突，而是每一次都把委屈、壓力和害怕收回身體裡，假裝自己還可以。"
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
          Fight Night 要處理的不是情緒表面，而是那個壓力一靠近就先退讓、先麻木、先失去自己的反應。
        </p>
      </div>
    </SectionWrapper>
  )
}

function OffersOldFrameworkSection() {
  return (
    <SectionWrapper id="offers-old-framework">
      <SectionHeading
        title="舊方法只能讓你暫時沒感覺"
        subtitle="你可以逃開、麻痺、轉移注意，但只要身體還是把壓力判定成威脅，下一次你還是會回到同一個反應。"
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

function OffersCurriculum({ gateState }: { gateState: GateState }) {
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

function OffersPlans({
  gateState,
  onCtaAction,
}: {
  gateState: GateState
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
          如果你只想驗證一次，選 First Round。若你已經知道這會成為你的出口，直接選 Signature。
          拳套方案買的不是裝備，而是把那晚的狀態帶回生活。
        </p>
      </div>

      <LockedSection
        overlayTitle="登入後查看完整費用資訊"
        overlayDescription={offersPlanSectionContent.overlayDescription}
        gateState={gateState}
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
                onClick={() => onCtaAction(siteConfig.lineUrl)}
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

function OffersProofGallery() {
  return (
    <SectionWrapper id="offers-proof">
      <SectionHeading
        title={offersProofSectionContent.title}
        subtitle={offersProofSectionContent.subtitle}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto">
        {proofMoments.map((moment, i) => (
          <motion.div
            key={moment.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`group overflow-hidden rounded-2xl md:rounded-[1.75rem] border border-pearl/10 bg-black/40 shadow-[0_24px_70px_rgba(0,0,0,0.35)] ${
              i === 0 ? 'md:col-span-2 xl:col-span-2' : ''
            }`}
          >
            <img
              src={moment.image}
              alt={`${moment.title}｜${moment.caption}`}
              loading="lazy"
              className="h-full min-h-[260px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}

function OffersSessions({
  gateState,
}: {
  gateState: GateState
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
        <OffersHero gateState={gateState} />
        <OffersPainSection />
        <OffersOldFrameworkSection />
        <OffersCurriculum gateState={gateState} />
        <OffersProofGallery />
        <OffersPlans gateState={gateState} onCtaAction={(url) => void handleCtaAction(url)} />
        <OffersSessions gateState={gateState} />
      </main>
      <Footer onVenueAction={(url) => void handleCtaAction(url)} />
    </div>
  )
}
