import { motion, useInView } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import heroPoster from '../assets/landing/hero-poster.jpg'
import flowStep1 from '../assets/landing/flow-step-1.jpg'
import flowStep3 from '../assets/landing/flow-step-3.jpg'
import flowStep4 from '../assets/landing/flow-step-4.jpg'
import belongingCard from '../assets/landing/belonging-card.jpg'
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
import { getLineRequestContext } from '../lib/lineContext'
import { toAbsoluteUrl } from '../lib/url'

type FirstPurchaseOfferState =
  | 'idle'
  | 'checking'
  | 'eligible'
  | 'ineligible'
  | 'error'

const landingVariant = 'event_experience'
const lockedOfferBadgeLabel = '首次免費入場'

const eventFlowScenes = [
  {
    id: 'arrival',
    image: flowStep1,
    label: '入場',
    title: '先把拳套戴上，不用先證明自己會打。',
    body: '動作會從新手也能跟上的節奏開始，教練先讓你進入現場，不是把你丟進技術考試。',
  },
  {
    id: 'rhythm',
    image: flowStep3,
    label: '被帶入',
    title: '口令、沙包、回合，開始把注意力收回來。',
    body: '你不用靠意志力硬撐，現場節奏會把你從日常裡拉出來，讓身體知道下一拳要往哪裡去。',
  },
  {
    id: 'release',
    image: flowStep4,
    label: '釋放',
    title: '最累的時候，反而是最清醒的時候。',
    body: '壓力會被放進每一個回合裡。你不是來學一套動作，你是來完成一個晚上。',
  },
]

const trustBoundaries = [
  '不安排學員互相攻防',
  '不需要拳擊或泰拳基礎',
  '教練會依現場狀態調整強度',
  '保留成功後 LINE 會送出確認卡',
]

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function buildEventStructuredData() {
  const url = toAbsoluteUrl('/fight-night-event')

  return [
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: 'Fight Night 入場體驗',
      description:
        'UFCGYM TAIWAN Fight Night 是以拳套、沙包、教練口令與集體節奏組成的夜間壓力釋放體驗。',
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
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: '首頁',
          item: toAbsoluteUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Fight Night 入場體驗',
          item: url,
        },
      ],
    },
  ]
}

function EventHero() {
  const { track } = useTracking()

  const handlePrimaryCta = () => {
    track({
      event: 'event_landing_cta_click',
      params: {
        landing_variant: landingVariant,
        cta_id: 'hero_reserve_entry',
        destination: 'event-entry',
      },
      metaStandardEvent: 'Lead',
      lineEventName: 'LineLoginClick',
    })
    scrollToId('event-entry')
  }

  const handleSecondaryCta = () => {
    track({
      event: 'event_landing_cta_click',
      params: {
        landing_variant: landingVariant,
        cta_id: 'hero_view_flow',
        destination: 'event-flow',
      },
    })
    scrollToId('event-flow')
  }

  return (
    <section
      id="event-hero"
      data-section="event-hero"
      className="relative min-h-screen overflow-hidden bg-abyss"
    >
      <img
        src={heroPoster}
        alt="Fight Night 拳套、沙包與集體節奏的入場體驗"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,15,0.78)_0%,rgba(10,10,15,0.34)_44%,rgba(10,10,15,0.62)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-abyss to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-end px-3 pb-8 pt-24 sm:px-8 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="ml-auto max-w-xl text-left md:text-right"
        >
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.28em] text-blaze">
            Fight Night
          </p>
          <h1 className="mt-3 font-heading text-4xl font-black leading-tight text-pearl md:text-6xl">
            不是上課。
            <br />
            是保留一個會讓你醒過來的晚上。
          </h1>
          <p className="mt-5 text-base leading-relaxed text-pearl/78 md:text-lg">
            跟著教練口令、沙包、音樂和全場節奏，把壓力打進一個可以完成的回合裡。
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row md:justify-end">
            <Button
              size="lg"
              onClick={handlePrimaryCta}
              data-cta="event-hero-reserve-entry"
              className="w-full sm:w-auto"
            >
              保留本週免費入場
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleSecondaryCta}
              data-cta="event-hero-view-flow"
              className="w-full sm:w-auto"
            >
              這一晚會發生什麼
            </Button>
          </div>
        </motion.div>

        <div className="mt-8 grid grid-cols-3 gap-px border-y border-pearl/10 bg-pearl/10">
          {['拳套入場', '沙包回合', 'LINE 確認'].map((item) => (
            <div key={item} className="bg-abyss/82 px-2 py-3 text-center">
              <p className="text-xs font-heading font-semibold text-pearl md:text-sm">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function EventExpectationSection() {
  return (
    <SectionWrapper id="event-positioning" padding="py-14 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[0.95fr_1.05fr] md:items-end">
          <div>
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.28em] text-neon/85">
              Reframe
            </p>
            <h2 className="mt-3 font-heading text-3xl font-black leading-tight text-pearl md:text-5xl">
              先讓人想進場，
              <br />
              再讓他選場次。
            </h2>
          </div>
          <p className="text-base leading-relaxed text-mist/78 md:text-lg">
            如果第一眼就像課表，用戶會開始評估自己會不會拳擊、會不會被推銷、是不是要開始長期上課。這個頁面先承接的是活動期待：今晚想做一件刺激、熱血、可以釋放壓力的事。
          </p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {[
            {
              title: '不是先問程度',
              body: '先告訴他這晚不用先會，現場會從能跟上的動作開始。',
            },
            {
              title: '不是先推方案',
              body: '先完成入場保留，LINE 確認後再自然接 618 首購優惠。',
            },
            {
              title: '不是賣一堂課',
              body: '先賣一個晚上，一段能被教練和全場節奏帶入的體驗。',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-pearl/10 bg-pearl/[0.035] p-5"
            >
              <h3 className="font-heading text-xl font-bold text-pearl">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-mist/72">
                {item.body}
              </p>
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
        title="這一晚會怎麼把你帶進去"
        subtitle="不用先知道自己會不會。先知道你會被怎麼接住。"
      />

      <div className="mx-auto mt-8 grid max-w-6xl gap-4 md:mt-12 md:grid-cols-3">
        {eventFlowScenes.map((scene, index) => (
          <motion.article
            key={scene.id}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.08 }}
            className="overflow-hidden rounded-lg border border-pearl/10 bg-black/36"
          >
            <ZoomableImage
              src={scene.image}
              alt={scene.title}
              className="aspect-[4/3] w-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className="p-5">
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-blaze">
                {scene.label}
              </p>
              <h3 className="mt-3 font-heading text-xl font-bold leading-snug text-pearl">
                {scene.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-mist/72">
                {scene.body}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </SectionWrapper>
  )
}

function EventSafetySection() {
  return (
    <SectionWrapper id="event-safety" padding="py-10 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_0.9fr] md:items-center">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="-mx-3 overflow-hidden rounded-none border-y border-pearl/10 bg-black/36 sm:mx-0 sm:rounded-lg sm:border"
        >
          <ZoomableImage
            src={belongingCard}
            alt="Fight Night 現場的集體節奏與歸屬感"
            className="w-full"
            loading="lazy"
          />
        </motion.div>

        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.28em] text-neon/85">
            Boundaries
          </p>
          <h2 className="mt-3 font-heading text-3xl font-black leading-tight text-pearl md:text-5xl">
            活動感要強，
            <br />
            安全感也要先說清楚。
          </h2>
          <p className="mt-5 text-base leading-relaxed text-mist/78">
            這頁不把 Fight Night 包成一般健身課，但也不讓用戶誤會自己會被丟進實戰。刺激來自節奏、口令、沙包和群體，不是來自危險。
          </p>

          <div className="mt-6 grid gap-2">
            {trustBoundaries.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-pearl/10 bg-pearl/[0.035] px-4 py-3"
              >
                <p className="text-sm font-medium text-pearl">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

function EventEntrySection() {
  const { track, trackGateAccess } = useTracking()
  const { gateState, requestGateAccess, loginUrl } = useLiffGate()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px -20% 0px' })
  const trackedEntryView = useRef(false)
  const [firstPurchaseOfferState, setFirstPurchaseOfferState] =
    useState<FirstPurchaseOfferState>('idle')

  useEffect(() => {
    if (!inView || trackedEntryView.current) return
    trackedEntryView.current = true
    track({
      event: 'event_entry_view',
      params: {
        landing_variant: landingVariant,
        gate_status: gateState.status,
      },
      metaStandardEvent: 'ViewContent',
      lineEventName: 'TicketView',
    })
  }, [gateState.status, inView, track])

  useEffect(() => {
    if (gateState.status !== 'unlocked') return

    let active = true

    fetch('/api/shopline/first-purchase-offer', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        lineContext: getLineRequestContext(),
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active) return
        const eligible = data?.eligible === true
        setFirstPurchaseOfferState(eligible ? 'eligible' : 'ineligible')
        track({
          event: 'first_purchase_offer_check',
          params: {
            landing_variant: landingVariant,
            offer_code: '618_MIDYEAR_FIRST_PURCHASE_HALF',
            eligible,
            reason: typeof data?.reason === 'string' ? data.reason : '',
          },
        })
      })
      .catch(() => {
        if (!active) return
        setFirstPurchaseOfferState('error')
      })

    return () => {
      active = false
    }
  }, [gateState.status, track])

  const handleGateAction = () => {
    track({
      event: 'event_landing_gate_click',
      params: {
        landing_variant: landingVariant,
        gate_status: gateState.status,
      },
      metaStandardEvent: 'Lead',
      lineEventName: 'LineLoginClick',
    })
    trackGateAccess('event_landing', gateState.status)
    if (loginUrl && ['loading', 'logged-out'].includes(gateState.status)) {
      window.location.href = loginUrl
      return
    }
    void requestGateAccess()
  }

  const handleViewFirstPurchaseOffer = () => {
    track({
      event: 'free_trial_bootcamp_bridge_click',
      params: {
        landing_variant: landingVariant,
        source: 'event_landing',
        offer_eligible: firstPurchaseOfferState === 'eligible',
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
      <div ref={ref} className="mx-auto max-w-5xl">
        <SectionHeading
          title="本週可入場場次"
          subtitle="先保留一個晚上。確認卡會送到 LINE，優惠在確認後再看。"
        />

        <div className="mt-8">
          <LockedContent
            gateState={gateState}
            title="用 LINE 確認你的入場名額"
            description="登入後選一個本週場次，送出資料就會保留免費入場名額，LINE 會同步收到確認卡。"
            onGateAction={handleGateAction}
            loginUrl={loginUrl}
            lockedEyebrow="Fight Night Entry"
            actionLabel={
              gateState.status === 'not-friend'
                ? undefined
                : 'LINE 快速確認名額'
            }
            actionNote="每人僅限一次首次免費入場。"
          >
            <WeeklyScheduleSection
              id="event-free-entry-schedule"
              activeCategory="FIGHT_NIGHT"
              categories={['FIGHT_NIGHT']}
              showCategoryTabs={false}
              showVenueFilter
              title="選你想進場的那一晚"
              subtitle="填完資料後會直接保留此場，LINE 會送出免費體驗確認卡。"
              embedded
              bookingIntent="choice"
              firstPurchaseOfferEligible={firstPurchaseOfferState === 'eligible'}
              freeTrialCtaLabel="保留這場入場名額"
              freeTrialBadgeLabel={lockedOfferBadgeLabel}
              onFreeTrialAddOnClick={handleViewFirstPurchaseOffer}
            />
          </LockedContent>
        </div>
      </div>
    </SectionWrapper>
  )
}

export function FightNightEventPage() {
  const structuredData = useMemo(() => buildEventStructuredData(), [])

  return (
    <div className="overflow-x-hidden bg-abyss text-pearl">
      <Seo
        title="Fight Night 入場體驗｜UFCGYM TAIWAN"
        description="保留一個會讓你醒過來的晚上。跟著教練口令、沙包、音樂和全場節奏，把壓力打進一個可以完成的回合裡。"
        canonicalPath="/fight-night-event"
        keywords={[
          'Fight Night',
          'UFCGYM TAIWAN',
          '台北夜間活動',
          '拳擊體驗',
          '壓力釋放',
          '免費入場體驗',
        ]}
        image={heroPoster}
        structuredData={structuredData}
      />
      <Header />
      <main>
        <EventHero />
        <EventExpectationSection />
        <EventFlowSection />
        <EventSafetySection />
        <EventEntrySection />
      </main>
      <Footer />
      <StickyActionBar
        eyebrow="Fight Night"
        title="保留本週免費入場"
        detail="用 LINE 確認場次"
        actionLabel="選場次"
        onAction={() => scrollToId('event-entry')}
      />
    </div>
  )
}
