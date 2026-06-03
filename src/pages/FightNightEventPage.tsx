import { motion, useInView } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import heroPoster from '../assets/landing/hero-poster.jpg'
import flowStep1 from '../assets/landing/flow-step-1.jpg'
import flowStep2 from '../assets/landing/flow-step-2.jpg'
import flowStep4 from '../assets/landing/flow-step-4.jpg'
import audiencePoster from '../assets/landing/audience-poster.jpg'
import collectiveEuphoriaCard from '../assets/landing/collective-euphoria-card.jpg'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { Seo } from '../components/Seo'
import { WeeklyScheduleSection } from '../components/sections/WeeklyScheduleSection'
import { Button } from '../components/ui/Button'
import { LockedContent } from '../components/ui/LockedContent'
import { SectionHeading } from '../components/ui/SectionHeading'
import { SectionWrapper } from '../components/ui/SectionWrapper'
import { StickyActionBar } from '../components/ui/StickyActionBar'
import { ZoomableImage } from '../components/ui/ZoomableImage'
import { siteConfig } from '../data/landingContent'
import { useLiffGate } from '../hooks/useLiffGate'
import { useTracking } from '../hooks/useTracking'
import { toAbsoluteUrl } from '../lib/url'

type EventMode = 'free_entry' | 'paid_pass'

const landingVariant = 'fightnight_event_independent_v1'

const eventFacts = [
  { label: '50 分鐘', value: '教練帶節奏' },
  { label: '新手可進', value: '不用拳擊基礎' },
  { label: '不對打', value: '以沙包與體能為主' },
  { label: 'LINE 確認', value: '預約後收到卡片' },
]

const eventFlow = [
  {
    title: '進場，不用先會',
    body: '到場後先跟著教練暖身，熟悉手套、沙包和節奏。第一次來的人不需要先懂拳擊或泰拳。',
  },
  {
    title: '被帶進同一個節奏',
    body: '教練用口令帶動全場，你只要跟著打、跟著呼吸，慢慢把下班後卡住的狀態推開。',
  },
  {
    title: '最後一段，把力氣打出去',
    body: '強度會往上，但不是要你硬撐。重點是安全地釋放，結束時真的感覺身體醒過來。',
  },
]

const proofTiles = [
  {
    image: flowStep1,
    title: '真實場館',
    body: '不是臨時活動空間，是 UFC GYM 的沙包與訓練區。',
  },
  {
    image: flowStep2,
    title: '有人帶節奏',
    body: '你不需要自己摸索動作，教練會用口令把全場帶在一起。',
  },
  {
    image: flowStep4,
    title: '不是對打',
    body: '主要是沙包、體能與節奏訓練，第一次來也能安全進入。',
  },
]

const fitItems = [
  '想找一個下班後真的會轉換狀態的晚上',
  '第一次接觸拳擊、泰拳或踢拳也可以',
  '可以自己一個人來，不需要揪到朋友才開始',
  '想要刺激感，但不想被丟進對打或硬派訓練',
]

const cautionItems = [
  '這不是正式格鬥對打課',
  '這不是只坐著看表演的派對',
  '如果你只想慢慢聊天放鬆，這晚會太有強度',
]

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function getEventMode(): EventMode {
  if (typeof window === 'undefined') return 'free_entry'
  const mode = new URLSearchParams(window.location.search).get('mode')
  return mode === 'paid_pass' ? 'paid_pass' : 'free_entry'
}

function getPrimaryAction(mode: EventMode) {
  if (mode === 'paid_pass') {
    return {
      label: '購買 Fight Night 入場票',
      entryTitle: '選一個活動場次',
      entrySubtitle:
        '這個版本測試直接購買入場票。場次確認後會進入付款流程，付款成功才會收到已付款確認卡。',
      scheduleCta: '購買這場入場票',
      bookingIntent: 'checkout' as const,
    }
  }

  return {
    label: '保留首次入場名額',
    entryTitle: '選一個晚上，先保留入場',
    entrySubtitle:
      '保留成功後會收到 LINE 免費體驗預約確認卡。618 首購優惠放在確認之後，不會取代預約動作。',
    scheduleCta: '保留這場入場名額',
    bookingIntent: 'free_trial' as const,
  }
}

function buildEventStructuredData(mode: EventMode) {
  const url = toAbsoluteUrl('/fight-night-event')
  const action = getPrimaryAction(mode)

  return [
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: 'Fight Night 活動入場頁',
      description:
        'UFCGYM TAIWAN Fight Night 獨立活動頁。選一個晚上進場，跟著教練、沙包與團體節奏安全釋放。',
      inLanguage: 'zh-Hant',
      isPartOf: {
        '@type': 'WebSite',
        name: siteConfig.brandName,
        url: toAbsoluteUrl('/'),
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl(heroPoster),
      },
      potentialAction: {
        '@type': 'ReserveAction',
        name: action.label,
        target: `${url}#event-entry`,
      },
    },
    {
      '@type': 'Event',
      name: 'Fight Night',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: {
        '@type': 'Place',
        name: 'UFCGYM TAIWAN',
        address: '台北與台中場館依可預約場次為準',
      },
      image: [toAbsoluteUrl(heroPoster)],
      description:
        '一場以教練口令、沙包、團體節奏與安全釋放為核心的 Fight Night 入場體驗。',
    },
  ]
}

function EventHero({ mode }: { mode: EventMode }) {
  const { track } = useTracking()
  const action = getPrimaryAction(mode)

  const handlePrimaryCta = () => {
    track({
      event: 'event_landing_cta_click',
      params: {
        landing_variant: landingVariant,
        mode,
        cta_id: 'hero_primary',
        destination: 'event-entry',
      },
      metaStandardEvent: 'Lead',
      lineEventName: 'LineLoginClick',
    })
    scrollToId('event-entry')
  }

  const handleFlowCta = () => {
    track({
      event: 'event_landing_cta_click',
      params: {
        landing_variant: landingVariant,
        mode,
        cta_id: 'hero_flow',
        destination: 'event-flow',
      },
    })
    scrollToId('event-flow')
  }

  return (
    <section
      id="event-hero"
      data-section="event-hero"
      className="relative min-h-[88svh] overflow-hidden bg-abyss"
    >
      <img
        src={heroPoster}
        alt="Fight Night 現場訓練氛圍"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,9,0.86)_0%,rgba(5,5,9,0.54)_48%,rgba(5,5,9,0.18)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-abyss to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[88svh] max-w-6xl flex-col justify-end px-4 pb-8 pt-28 sm:px-8 md:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.34em] text-blaze">
            Fight Night
          </p>
          <h1 className="mt-4 max-w-2xl font-heading text-4xl font-black leading-[1.04] text-pearl sm:text-5xl md:text-7xl">
            把一個普通晚上，打成會記得的晚上
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-pearl/80 md:text-lg">
            不是來上普通拳擊課。這是一場有人帶、可以安全進入、會把你從日常狀態拉出來的 Fight Night。
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={handlePrimaryCta}
              data-cta="event-hero-primary"
              className="w-full sm:w-auto"
            >
              {action.label}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleFlowCta}
              data-cta="event-hero-flow"
              className="w-full sm:w-auto"
            >
              先看當晚怎麼走
            </Button>
          </div>
        </motion.div>

        <div className="mt-8 grid grid-cols-2 border-y border-pearl/10 md:grid-cols-4">
          {eventFacts.map((fact) => (
            <div key={fact.label} className="border-pearl/10 py-3 md:border-l md:px-4">
              <p className="font-heading text-sm font-black text-pearl md:text-base">
                {fact.label}
              </p>
              <p className="mt-1 text-xs leading-snug text-mist/65">
                {fact.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function EventPromiseSection() {
  return (
    <SectionWrapper id="event-promise" padding="py-14 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.92fr_1.08fr] md:items-center">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">
            Event, not class
          </p>
          <h2 className="mt-3 font-heading text-3xl font-black leading-tight text-pearl md:text-5xl">
            先是一場夜晚，
            <br />
            才是一堂課。
          </h2>
          <p className="mt-5 text-base leading-relaxed text-mist/78 md:text-lg">
            廣告來的人不是先想研究課表，而是在找一個能讓自己醒過來的活動。這一頁把 Fight Night 當成一張入場票：你知道時間、知道會發生什麼，也知道自己第一次來不會被丟下。
          </p>
        </motion.div>

        <div className="grid gap-3">
          {[
            ['你買到的不是課名', '而是一個有人帶著你進入節奏的夜晚。'],
            ['你不用先變強', '只要願意進場，剩下的由教練和現場節奏帶你走。'],
            ['確認預約先發生', '618 首購優惠放在 LINE 確認之後，順序不再打架。'],
          ].map(([title, body]) => (
            <div
              key={title}
              className="rounded-lg border border-pearl/10 bg-pearl/[0.04] p-5"
            >
              <h3 className="font-heading text-xl font-black text-pearl">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mist/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

function EventFlowSection() {
  return (
    <SectionWrapper id="event-flow" padding="py-12 md:py-24">
      <SectionHeading
        title="那一晚會怎麼走"
        subtitle="把未知感降下來，使用者才敢真的按下預約或付款。"
      />

      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
        {eventFlow.map((step, index) => (
          <motion.article
            key={step.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            className="rounded-lg border border-pearl/10 bg-black/30 p-5"
          >
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-blaze">
              0{index + 1}
            </p>
            <h3 className="mt-4 font-heading text-2xl font-black leading-tight text-pearl">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-mist/72">
              {step.body}
            </p>
          </motion.article>
        ))}
      </div>
    </SectionWrapper>
  )
}

function EventProofSection() {
  return (
    <SectionWrapper id="event-proof" padding="py-12 md:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="讓人相信這不是想像出來的活動"
          subtitle="活動頁要有現場感。使用者要先看見自己可能站在哪裡，才會願意留下名額。"
        />

        <div className="grid gap-4 md:grid-cols-3">
          {proofTiles.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="overflow-hidden rounded-lg border border-pearl/10 bg-black/30"
            >
              <ZoomableImage
                src={item.image}
                alt={item.title}
                className="aspect-[4/3] w-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
              <div className="p-5">
                <h3 className="font-heading text-xl font-black text-pearl">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mist/72">
                  {item.body}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

function EventFitSection() {
  return (
    <SectionWrapper id="event-fit" padding="py-12 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div className="overflow-hidden rounded-lg border border-pearl/10 bg-black/30">
          <ZoomableImage
            src={audiencePoster}
            alt="Fight Night 適合第一次想進場的人"
            className="w-full"
            loading="lazy"
          />
        </div>

        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">
            Fit check
          </p>
          <h2 className="mt-3 font-heading text-3xl font-black leading-tight text-pearl md:text-5xl">
            你可以第一次來，
            <br />
            但不會像局外人。
          </h2>
          <p className="mt-5 text-base leading-relaxed text-mist/78">
            這個頁面要先消除「我是不是不夠會」的猶豫。Fight Night 的門檻不是技巧，而是你想不想給自己一個真的動起來的晚上。
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-blaze">
                適合
              </h3>
              <ul className="mt-3 space-y-2">
                {fitItems.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-mist/75">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-mist/55">
                先知道
              </h3>
              <ul className="mt-3 space-y-2">
                {cautionItems.map((item) => (
                  <li key={item} className="text-sm leading-relaxed text-mist/64">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

function EventMomentSection({ mode }: { mode: EventMode }) {
  const action = getPrimaryAction(mode)

  return (
    <section className="relative overflow-hidden bg-black py-14 md:py-24">
      <img
        src={collectiveEuphoriaCard}
        alt="Fight Night 結束後的集體釋放感"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9),rgba(0,0,0,0.62),rgba(0,0,0,0.82))]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-8">
        <div className="max-w-2xl">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-blaze">
            The decision
          </p>
          <h2 className="mt-3 font-heading text-3xl font-black leading-tight text-pearl md:text-5xl">
            這不是先想很久的決定，
            <br />
            是先給自己一個晚上。
          </h2>
          <p className="mt-5 text-base leading-relaxed text-mist/78 md:text-lg">
            所以最後一步不該複雜：選場次、確認資料、到 LINE 收到確認。優惠可以在確認後出現，但不能搶走預約本身。
          </p>
          <Button
            size="lg"
            className="mt-7"
            onClick={() => scrollToId('event-entry')}
            data-cta="event-mid-primary"
          >
            {action.label}
          </Button>
        </div>
      </div>
    </section>
  )
}

function EventEntrySection({ mode }: { mode: EventMode }) {
  const { track, trackGateAccess } = useTracking()
  const { gateState, requestGateAccess, loginUrl } = useLiffGate()
  const entryRef = useRef<HTMLDivElement>(null)
  const inView = useInView(entryRef, { once: true, margin: '-20% 0px -20% 0px' })
  const trackedEntryView = useRef(false)
  const action = getPrimaryAction(mode)

  useEffect(() => {
    if (!inView || trackedEntryView.current) return
    trackedEntryView.current = true
    track({
      event: 'event_ticket_selector_view',
      params: {
        landing_variant: landingVariant,
        mode,
        gate_status: gateState.status,
      },
      metaStandardEvent: 'ViewContent',
      lineEventName: 'TicketView',
    })
  }, [gateState.status, inView, mode, track])

  const handleGateAction = () => {
    track({
      event: 'event_landing_gate_click',
      params: {
        landing_variant: landingVariant,
        mode,
        gate_status: gateState.status,
      },
      metaStandardEvent: 'Lead',
      lineEventName: 'LineLoginClick',
    })
    trackGateAccess('fightnight_event_entry', gateState.status)

    if (loginUrl && ['loading', 'logged-out'].includes(gateState.status)) {
      window.location.href = loginUrl
      return
    }

    void requestGateAccess()
  }

  const handleViewFirstPurchaseOffer = () => {
    track({
      event: 'free_trial_add_on_view_click',
      params: {
        landing_variant: landingVariant,
        mode,
        source: 'fightnight_event_page',
        offer_code: '618_MIDYEAR_FIRST_PURCHASE_HALF',
      },
    })

    window.history.pushState(
      {},
      '',
      '/boot-camp?from=free-trial&source=fight-night-event',
    )
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 0)
  }

  return (
    <SectionWrapper id="event-entry" padding="py-12 md:py-24">
      <div ref={entryRef} className="mx-auto max-w-6xl">
        <SectionHeading title={action.entryTitle} subtitle={action.entrySubtitle} />

        <LockedContent
          gateState={gateState}
          title="先用 LINE 確認身分，再保留入場"
          description="這樣預約成功後才能把確認卡片送到你的 LINE，也能避免重複預約或名額錯亂。"
          onGateAction={handleGateAction}
          loginUrl={loginUrl}
          lockedEyebrow="Fight Night Entry"
          actionLabel={
            gateState.status === 'not-friend'
              ? undefined
              : '用 LINE 繼續'
          }
          actionNote="只用來確認預約與發送卡片，不會自動發送喚回訊息。"
        >
          <div className="rounded-lg border border-pearl/10 bg-black/24 p-3 md:p-5">
            <WeeklyScheduleSection
              id="event-ticket-selector"
              activeCategory="FIGHT_NIGHT"
              categories={['FIGHT_NIGHT']}
              showCategoryTabs={false}
              showVenueFilter
              showCategoryLead={false}
              title="選擇 Fight Night 場次"
              subtitle="只列出適合活動入場的少量場次。選好後會先確認資料，再送出預約或付款。"
              embedded
              displayLimit={6}
              bookingIntent={action.bookingIntent}
              freeTrialCtaLabel={action.scheduleCta}
              freeTrialBadgeLabel="首次入場免費"
              onFreeTrialAddOnClick={handleViewFirstPurchaseOffer}
            />
          </div>
        </LockedContent>
      </div>
    </SectionWrapper>
  )
}

function EventFaqSection() {
  return (
    <SectionWrapper id="event-faq" padding="py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          title="預約前最常卡住的問題"
          subtitle="把疑慮放在送出前，讓使用者不用自己猜。"
        />
        <div className="grid gap-3">
          {[
            ['第一次來會不會跟不上？', '不需要先會拳擊或泰拳。教練會從暖身與基礎節奏開始，重點是安全地跟上現場。'],
            ['會不會需要跟別人對打？', '不會。Fight Night 以沙包、體能與教練口令為主，不是對打場。'],
            ['預約成功後要做什麼？', '你會收到 LINE 免費體驗預約確認卡。到場前看 LINE 確認資訊就好。'],
            ['618 首購優惠在哪裡？', '先保留預約，確認成功後再看 618 首購方案。優惠是下一步，不是取代預約。'],
          ].map(([question, answer]) => (
            <div
              key={question}
              className="rounded-lg border border-pearl/10 bg-pearl/[0.035] p-5"
            >
              <h3 className="font-heading text-lg font-black text-pearl">
                {question}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mist/72">
                {answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

export function FightNightEventPage() {
  const mode = getEventMode()
  const action = getPrimaryAction(mode)
  const structuredData = useMemo(() => buildEventStructuredData(mode), [mode])
  const { track } = useTracking()

  useEffect(() => {
    track({
      event: 'event_landing_view',
      params: {
        landing_variant: landingVariant,
        mode,
      },
      metaStandardEvent: 'ViewContent',
      lineEventName: 'ViewContent',
    })
  }, [mode, track])

  return (
    <div className="overflow-x-hidden bg-abyss text-pearl">
      <Seo
        title="Fight Night 活動入場頁｜UFCGYM TAIWAN"
        description="選一個晚上進場，跟著教練、沙包與團體節奏安全釋放。第一次來也可以保留 Fight Night 入場名額。"
        canonicalPath="/fight-night-event"
        keywords={[
          'Fight Night',
          'UFCGYM TAIWAN',
          '拳擊體驗',
          '泰拳體驗',
          '下班活動',
          '免費體驗預約',
        ]}
        image={heroPoster}
        structuredData={structuredData}
      />
      <Header />
      <main>
        <EventHero mode={mode} />
        <EventPromiseSection />
        <EventFlowSection />
        <EventProofSection />
        <EventFitSection />
        <EventMomentSection mode={mode} />
        <EventEntrySection mode={mode} />
        <EventFaqSection />
      </main>
      <Footer />
      <StickyActionBar
        eyebrow="Fight Night"
        title="選一個晚上進場"
        detail={mode === 'paid_pass' ? '付款後 LINE 確認' : '預約後 LINE 確認'}
        actionLabel={action.label}
        onAction={() => scrollToId('event-entry')}
      />
    </div>
  )
}
