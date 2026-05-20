import { motion } from 'framer-motion'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Seo } from '../components/Seo'
import { Button } from '../components/ui/Button'
import { SectionWrapper } from '../components/ui/SectionWrapper'
import { findSeoGuide, seoGuides } from '../data/seoGuides'
import { siteConfig, venues } from '../data/landingContent'
import { toAbsoluteUrl } from '../lib/url'
import logo from '../assets/ufcgymtaiwan_logo.svg'

type SeoGuidePageProps = {
  slug: string
}

function buildStructuredData(
  guide: NonNullable<ReturnType<typeof findSeoGuide>>,
  canonicalPath: string,
) {
  const url = toAbsoluteUrl(canonicalPath)

  return [
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: guide.title,
      description: guide.description,
      inLanguage: 'zh-Hant',
      isPartOf: {
        '@type': 'WebSite',
        name: siteConfig.brandName,
        url: toAbsoluteUrl('/'),
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl(guide.heroImage),
      },
      about: guide.keywords,
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
          name: '搜尋指南',
          item: toAbsoluteUrl('/#footer-guides'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: guide.footerLabel,
          item: url,
        },
      ],
    },
    {
      '@type': 'ItemList',
      name: `${guide.footerLabel}重點`,
      itemListElement: guide.sections.map((section, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: section.title,
      })),
    },
  ]
}

function MissingGuidePage() {
  return (
    <div className="min-h-screen bg-abyss text-pearl">
      <Header />
      <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-start justify-center px-3 py-28 sm:px-8">
        <img src={logo} alt={siteConfig.brandName} className="h-8" />
        <p className="mt-8 font-heading text-sm uppercase tracking-[0.28em] text-neon/80">
          GUIDE NOT FOUND
        </p>
        <h1 className="mt-4 font-heading text-4xl font-black leading-tight md:text-6xl">
          這個搜尋指南不存在
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-mist/75 md:text-lg">
          可以回到 Boot Camp 頁面，直接查看目前可預訂的拳擊與泰拳梯次。
        </p>
        <Button href="/boot-camp" size="lg" className="mt-8">
          查看 Boot Camp 計畫
        </Button>
      </main>
      <Footer />
    </div>
  )
}

export function SeoGuidePage({ slug }: SeoGuidePageProps) {
  const guide = findSeoGuide(slug)

  if (!guide) {
    return <MissingGuidePage />
  }

  const canonicalPath = `/guides/${guide.slug}`
  const focusedVenues = venues.filter((venue) =>
    guide.venueIds.includes(venue.id),
  )

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-abyss text-pearl">
      <Seo
        title={`${guide.title}｜${siteConfig.brandName}`}
        description={guide.description}
        canonicalPath={canonicalPath}
        keywords={guide.keywords}
        image={guide.heroImage}
        structuredData={buildStructuredData(guide, canonicalPath)}
      />
      <Header />

      <main>
        <section className="relative overflow-hidden pt-24 pb-10 md:pt-32 md:pb-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-abyss via-black to-abyss" />
            <div className="absolute left-1/2 top-1/4 h-[420px] w-[740px] -translate-x-1/2 rounded-full bg-neon/8 blur-[150px]" />
          </div>

          <div className="relative z-10 mx-auto grid max-w-6xl gap-8 px-3 sm:px-8 md:grid-cols-[0.95fr_1.05fr] md:items-center">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
            >
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-neon/85 md:text-sm">
                {guide.eyebrow}
              </p>
              <h1 className="mt-4 font-heading text-4xl font-black leading-[1.02] md:text-6xl">
                {guide.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-mist/78 md:text-xl">
                {guide.description}
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {guide.searchIntents.map((intent) => (
                  <span
                    key={intent}
                    className="rounded-full border border-neon/20 bg-neon/10 px-3 py-1.5 text-xs font-medium text-neon/90 md:text-sm"
                  >
                    {intent}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/boot-camp" size="lg">
                  查看 Boot Camp 計畫
                </Button>
                <Button href="/offers" variant="secondary" size="lg">
                  先看單堂體驗
                </Button>
              </div>
            </motion.div>

            <motion.figure
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12 }}
              className="overflow-hidden rounded-2xl border border-pearl/10 bg-black/40 shadow-[0_28px_90px_rgba(0,0,0,0.36)] md:rounded-[2rem]"
            >
              <img
                src={guide.heroImage}
                alt={guide.heroAlt}
                className="h-auto w-full"
                loading="eager"
              />
            </motion.figure>
          </div>
        </section>

        <SectionWrapper id="guide-answers" padding="py-8 md:py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {guide.sections.map((section, index) => (
              <motion.article
                key={section.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                className="rounded-2xl border border-pearl/10 bg-black/35 p-5 md:p-6"
              >
                <p className="font-heading text-xs uppercase tracking-[0.24em] text-neon/75">
                  0{index + 1}
                </p>
                <h2 className="mt-3 font-heading text-2xl font-black leading-tight text-pearl">
                  {section.title}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-mist/76 md:text-base">
                  {section.answer}
                </p>
                {section.bullets && (
                  <ul className="mt-4 space-y-2 text-sm leading-relaxed text-mist/72">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.article>
            ))}
          </div>
        </SectionWrapper>

        <SectionWrapper id="guide-venues" padding="py-8 md:py-16">
          <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-start">
            <div>
              <p className="font-heading text-xs uppercase tracking-[0.28em] text-neon/80">
                LOCATION
              </p>
              <h2 className="mt-3 font-heading text-4xl font-black leading-tight text-pearl md:text-5xl">
                先選你真的會抵達的場館
              </h2>
              <p className="mt-4 text-base leading-relaxed text-mist/75 md:text-lg">
                搜尋課程時最容易忽略的是距離。場館越順路，你越可能在下班後真的出現。
              </p>
            </div>

            <div className="grid gap-3">
              {focusedVenues.map((venue) => (
                <article
                  key={venue.id}
                  className="rounded-2xl border border-pearl/10 bg-black/35 p-5"
                >
                  <h3 className="font-heading text-xl font-black text-pearl">
                    {venue.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist/78">
                    {venue.address}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-mist/58">
                    {venue.transit}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </SectionWrapper>

        <SectionWrapper id="guide-faq" padding="py-8 md:py-16">
          <div className="mx-auto max-w-4xl">
            <p className="font-heading text-xs uppercase tracking-[0.28em] text-neon/80">
              QUICK ANSWERS
            </p>
            <h2 className="mt-3 font-heading text-4xl font-black leading-tight text-pearl md:text-5xl">
              常見搜尋問題
            </h2>
            <div className="mt-6 divide-y divide-pearl/10 rounded-2xl border border-pearl/10 bg-black/35">
              {guide.faqs.map((faq) => (
                <details key={faq.question} className="group p-5 md:p-6">
                  <summary className="cursor-pointer list-none font-heading text-lg font-black text-pearl marker:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {faq.question}
                      <span className="text-neon transition-transform group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-mist/75 md:text-base">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </SectionWrapper>

        <SectionWrapper id="guide-next-step" padding="py-8 md:py-20">
          <div className="rounded-2xl border border-neon/20 bg-neon/10 p-5 md:flex md:items-center md:justify-between md:gap-8 md:p-7">
            <div>
              <p className="font-heading text-xs uppercase tracking-[0.28em] text-neon/80">
                NEXT STEP
              </p>
              <h2 className="mt-2 font-heading text-3xl font-black leading-tight text-pearl md:text-4xl">
                把搜尋變成第一堂課
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mist/74 md:text-base">
                如果你已經知道自己想找拳擊、泰拳或壓力釋放運動，下一步就是選場館、日期與堂數。
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row md:mt-0">
              <Button href="/boot-camp" size="lg">
                查看 Boot Camp 計畫
              </Button>
              <Button href="/offers" variant="secondary" size="lg">
                看 Fight Night Pass
              </Button>
            </div>
          </div>
        </SectionWrapper>

        <SectionWrapper id="guide-index" padding="py-8 md:py-16">
          <div className="grid gap-3 md:grid-cols-4">
            {seoGuides.map((item) => (
              <a
                key={item.slug}
                href={`/guides/${item.slug}`}
                className="rounded-2xl border border-pearl/10 bg-black/25 p-4 transition-colors hover:border-neon/30 hover:bg-neon/10"
              >
                <p className="font-heading text-base font-black text-pearl">
                  {item.footerLabel}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-mist/62">
                  {item.footerDescription}
                </p>
              </a>
            ))}
          </div>
        </SectionWrapper>
      </main>

      <Footer />
    </div>
  )
}
