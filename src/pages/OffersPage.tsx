import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import {
  coaches,
  offersCoachSectionContent,
  offersFinalCtaContent,
  offersHeroContent,
  offersPlanSectionContent,
  offersSessionSectionContent,
  offersVenueSectionContent,
  sessions,
  siteConfig,
  ticketPlans,
  venues,
} from '../data/landingContent'
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

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function LockedSection({
  children,
  overlayTitle,
}: {
  children: ReactNode
  overlayTitle: string
}) {
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
            快速完成 LINE Login 後，即可解鎖這個區塊的完整內容。
          </p>
          <div className="mt-5 flex justify-center">
            <Button size="lg" href={siteConfig.lineUrl} data-cta="offers-unlock">
              {offersHeroContent.primaryCta}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OffersHero() {
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
          {offersHeroContent.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Button size="lg" href={siteConfig.lineUrl}>
            {offersHeroContent.primaryCta}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => scrollTo('offers-preview')}
          >
            {offersHeroContent.secondaryCta}
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

function OffersUnlockPreview() {
  const items = [
    {
      title: '活動場次',
      description: '查看每月第一個星期五晚上 10 點的可報名狀態。',
    },
    {
      title: '費用資訊',
      description: '查看不同入場方式與對應費用資訊。',
    },
    {
      title: '教練資訊',
      description: '查看本次帶課教練與活動編排重點。',
    },
  ]

  return (
    <SectionWrapper id="offers-preview">
      <SectionHeading
        title="登入後會解鎖這些內容"
        subtitle="先確認你要看的方向，再用 LINE Login 快速進入。"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="rounded-2xl border border-pearl/10 bg-black/30 p-5 md:p-6"
          >
            <p className="text-xs font-heading tracking-[0.25em] text-neon/80 uppercase">
              Locked
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

function OffersPlans() {
  return (
    <SectionWrapper id="offers-plans">
      <SectionHeading
        title={offersPlanSectionContent.title}
        subtitle={offersPlanSectionContent.subtitle}
      />

      <LockedSection overlayTitle="登入後查看完整費用資訊">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto items-start">
          {ticketPlans.map((plan, i) => (
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

function OffersCoaches() {
  return (
    <SectionWrapper id="offers-coaches">
      <SectionHeading
        title={offersCoachSectionContent.title}
        subtitle={offersCoachSectionContent.subtitle}
      />

      <p className="text-center text-base md:text-lg text-mist/80 max-w-3xl mx-auto -mt-2 mb-8 md:mb-12 leading-relaxed">
        {offersCoachSectionContent.description}
      </p>

      <LockedSection overlayTitle="登入後查看完整教練資訊">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
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

      <LockedSection overlayTitle="登入後查看完整活動場次">
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
                  variant={capacity.available ? 'primary' : 'secondary'}
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

function OffersVenues() {
  return (
    <SectionWrapper id="offers-venues">
      <SectionHeading
        title={offersVenueSectionContent.title}
        subtitle={offersVenueSectionContent.subtitle}
      />

      <LockedSection overlayTitle="登入後查看完整場館資訊">
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

function OffersFinalCta() {
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
          <Button
            size="lg"
            href={siteConfig.lineUrl}
            data-cta="offers-final-primary"
          >
            {offersFinalCtaContent.primaryCta}
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
  return (
    <div className="overflow-x-hidden w-full relative">
      <Header />
      <main>
        <OffersHero />
        <OffersUnlockPreview />
        <OffersPlans />
        <OffersCoaches />
        <OffersSessions />
        <OffersVenues />
        <OffersFinalCta />
      </main>
      <Footer />
    </div>
  )
}
