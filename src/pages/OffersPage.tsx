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
    title: '壓力為什麼會一路累積',
    description:
      '你不是太脆弱，而是每次都把委屈、壓力和害怕吞回去，久了身體和情緒都會開始抗議。',
  },
  {
    title: '你現在都怎麼撐過去',
    description:
      '食慾亂掉、睡不好、躲人、靠酒精或別的東西麻痺自己，很多方法都只是暫時撐過去。',
  },
  {
    title: '職業選手怎麼把恐懼變可控',
    description:
      '職業格鬥選手不是靠天生勇敢，而是把恐懼、壓力、打擊和重新站起來，練成身體習慣。',
  },
  {
    title: '什麼方案最值得你',
    description:
      '你也會看到由誰帶你走、什麼時候進場，以及每一種方案到底值在哪裡。',
  },
]

const pressurePainPoints = [
  {
    title: '遇到狀況時，你總是先吞下去',
    description:
      '面對強勢的人、帶壓迫感的場面，第一反應常常不是表達，而是先低頭、先忍住、先讓事情趕快過去。',
  },
  {
    title: '久了，身體會先開始抗議',
    description:
      '很多人壓力長期累積後，會開始睡不好、心悸、胸悶、頭痛，甚至整個人一直處在很緊、很累、很難真正放鬆的狀態。',
  },
  {
    title: '情緒也會慢慢失去彈性',
    description:
      '你可能會反覆想起不舒服的事、變得更容易煩躁、注意力很難集中，甚至對很多人和事慢慢失去感覺。',
  },
  {
    title: '生活會開始越縮越小',
    description:
      '你會避開某些情境、不想見人、對原本喜歡的事情失去興趣，最後不是事情變少了，而是你能活得自在的空間變小了。',
  },
]

const oldFrameworkPoints = [
  {
    title: '習慣開始失衡',
    description:
      '有些人會突然吃很多，有些人會完全沒胃口。看起來只是狀態不好，其實是壓力已經開始改變你的日常。',
  },
  {
    title: '開始依賴麻痺自己的東西',
    description:
      '抽更多菸、喝更多酒、靠藥物、安眠或鎮定類的東西撐過去，短期像有用，但身體只會越來越失去主導權。',
  },
  {
    title: '人會慢慢退開',
    description:
      '你可能越來越不想見人，對以前熱衷的事提不起勁，也不想解釋自己怎麼了，最後只剩下越來越安靜地退後。',
  },
  {
    title: '行為會開始失控',
    description:
      '坐立不安、很難待在原地，甚至做出傷害自己或讓自己後悔的事。很多人不是故意失控，而是已經撐太久了。',
  },
]

const whyItWorksPoints = [
  {
    title: '恐懼不是靠講道理消失',
    description:
      '職業格鬥選手不是靠意志力說服自己不要怕，而是一次一次進入「有壓力但可控」的情境，讓身體慢慢知道自己可以留在原地。',
  },
  {
    title: '壓力要先被拆成可操作的東西',
    description:
      '呼吸、節奏、步伐、出手、回到姿勢，這些具體動作會把混亂變成你當下能抓住的東西，情緒就不再是唯一主導。',
  },
  {
    title: '重新站起來也可以被練出來',
    description:
      '真正的改變不是從來不亂，而是亂了之後還能回來。當這件事被反覆練進身體裡，你的底氣就會開始長出來。',
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
  onPrimaryAction,
}: {
  children: ReactNode
  overlayTitle: string
  overlayDescription?: string
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
          : overlayDescription || '快速完成 LINE Login 後，即可解鎖這個區塊的完整內容。'

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

function OffersUnlockBridge({
  onPrimaryAction,
}: {
  onPrimaryAction: () => void
}) {
  const items = [
    '完整四次內容怎麼一步一步把你帶回來',
    '這次由哪些帶領者陪你走進狀態',
    '哪一館還有名額、哪一個時段最適合你',
    '你現在該先試一次，還是直接做完整投入',
  ]

  return (
    <SectionWrapper id="offers-unlock-bridge" padding="py-6 md:py-12">
      <div className="relative max-w-5xl mx-auto overflow-hidden rounded-3xl border border-neon/15 bg-gradient-to-br from-neon/10 via-black/30 to-blaze/10 px-6 py-8 md:px-10 md:py-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 h-36 w-36 rounded-full bg-neon/10 blur-[80px]" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-blaze/10 blur-[90px]" />
        </div>

        <div className="relative">
          <p className="text-xs md:text-sm font-heading tracking-[0.28em] text-neon/80 uppercase">
            如果你讀到這裡
          </p>
          <h2 className="mt-3 text-2xl md:text-3xl font-heading font-bold text-pearl leading-tight">
            代表你不是只想再忍一次，
            <br />
            你是真的想讓自己不一樣。
          </h2>
          <p className="mt-4 text-sm md:text-base text-mist/80 max-w-3xl leading-relaxed">
            接下來解鎖的，不是冷冰冰的課表和價錢，而是你最需要知道的幾件事：
            這四次內容怎麼把你帶出來、誰會陪你走、什麼時候能進場，以及你現在最適合怎麼開始。
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {items.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-pearl/10 bg-black/20 px-4 py-4 text-sm md:text-base text-mist/85"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-mist/65">
              不用填一堆資料，LINE Login 後就能直接看完整內容。
            </p>
            <Button size="lg" onClick={onPrimaryAction} data-cta="offers-bridge-unlock">
              快速登入查看
            </Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
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
        subtitle="不是一堆價格和話術，而是把你的壓力怎麼累積、舊方法怎麼失效、以及這四次內容為什麼真的值得，完整講清楚。"
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
        title="你不是撐不住，你是已經撐太久了"
        subtitle="每次遇到狀況都把委屈、壓力和害怕默默吞下去，久了出問題的通常不只情緒，連睡眠、身體、專注力和生活狀態都會一起被拖下去。"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
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
          你想要的，不只是當下撐過去。
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
        subtitle="很多人不是沒試著處理，而是一直用錯方法。那些方式也許能暫時讓你不要那麼難受，但沒有一個真的在處理你面對壓力時整個人會亂掉的根本問題。"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
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
        overlayDescription={offersCurriculumSectionContent.overlayDescription}
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
        title="為什麼這套邏輯，真的能改變一個人"
        subtitle="因為職業格鬥選手一輩子都在做同一件事：把抽象的恐懼和壓力，轉成具體、可重複、可控制的身體反應。"
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
        所以四次之後你帶走的，不只是一次很爽的釋放，而是一種更能留在原地的反應方式。
        那些以前一下就把你壓住的情境，會開始沒有那麼容易把你整個人吞掉。
      </p>
    </SectionWrapper>
  )
}

function OffersPlans({
  gateState,
  onPrimaryAction,
  onCtaAction,
}: {
  gateState: GateState
  onPrimaryAction: () => void
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
          如果你現在在判斷哪一個最值得：
          想先親身確認這個體驗到底有沒有那麼特別，可以從「初次體驗一堂」開始；
          想把第一次做得更完整、更有記憶點，可以選「初次體驗一堂＋拳套」；
          想一次拿到最完整的爽感、價值感與改變感，最推薦「Signature 四次完整體驗」；
          想把這份狀態真的延續回生活裡，適合「Signature 四次完整體驗＋專屬裝備」；
          如果你希望先被好好接住、再進正式場次，就從「Private Onboarding」開始。
        </p>
      </div>

      <LockedSection
        overlayTitle="登入後查看完整費用資訊"
        overlayDescription={offersPlanSectionContent.overlayDescription}
        gateState={gateState}
        onPrimaryAction={onPrimaryAction}
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
        overlayDescription={offersCoachSectionContent.overlayDescription}
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
  onCtaAction,
}: {
  gateState: GateState
  onPrimaryAction: () => void
  onCtaAction: (redirectUrl: string) => void
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
                  onClick={() =>
                    onCtaAction(
                      capacity.available ? session.lineUrl : siteConfig.lineUrl,
                    )
                  }
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
  onCtaAction,
}: {
  gateState: GateState
  onPrimaryAction: () => void
  onCtaAction: (redirectUrl: string) => void
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
                onClick={() => onCtaAction(venue.lineUrl)}
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
        <OffersHero gateState={gateState} onPrimaryAction={() => void handlePrimaryAction()} />
        <OffersUnlockPreview />
        <OffersPainSection />
        <OffersOldFrameworkSection />
        <OffersUnlockBridge onPrimaryAction={() => void handlePrimaryAction()} />
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
          onCtaAction={(url) => void handleCtaAction(url)}
        />
        <OffersPlans
          gateState={gateState}
          onPrimaryAction={() => void handlePrimaryAction()}
          onCtaAction={(url) => void handleCtaAction(url)}
        />
        <OffersVenues
          gateState={gateState}
          onPrimaryAction={() => void handlePrimaryAction()}
          onCtaAction={(url) => void handleCtaAction(url)}
        />
        <OffersFinalCta
          gateState={gateState}
          onPrimaryAction={() => void handlePrimaryAction()}
        />
      </main>
      <Footer onVenueAction={(url) => void handleCtaAction(url)} />
    </div>
  )
}
