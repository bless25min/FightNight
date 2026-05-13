import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  planSummaryByCategory,
  venues,
} from '../../data/landingContent'
import {
  buildCourseBookingUrl,
  SCHEDULE_DISPLAY_LIMIT,
  weeklyCourses,
  weeklyScheduleSectionContent,
} from '../../data/weeklySchedule'
import type { CourseCategory, WeeklyCourse } from '../../types'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionWrapper } from '../ui/SectionWrapper'

const CATEGORY_ORDER: CourseCategory[] = ['FIGHT_NIGHT', 'BOOT_CAMP']

const categoryMeta: Record<
  CourseCategory,
  {
    label: string
    tabActiveClass: string
    badgeClass: string
    ctaClass: string
    lead: string
  }
> = {
  FIGHT_NIGHT: {
    label: 'FIGHT NIGHT',
    tabActiveClass: 'bg-blaze text-abyss border-blaze',
    badgeClass: 'border-blaze/40 bg-blaze/15 text-blaze',
    ctaClass: 'bg-blaze text-abyss hover:bg-blaze/90',
    lead: '節奏與體能。零基礎能跟，第一次靠近格鬥的人從這裡開始。',
  },
  BOOT_CAMP: {
    label: 'BOOT CAMP',
    tabActiveClass: 'bg-neon text-abyss border-neon',
    badgeClass: 'border-neon/40 bg-neon/15 text-neon',
    ctaClass: 'bg-neon text-abyss hover:bg-neon/90',
    lead: '技術與格鬥邏輯。系統化訓練，把刺激變成可以記住的身體反射。',
  },
}

function getTodayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function venueShortName(fullName: string) {
  const idx = fullName.indexOf('—')
  return idx >= 0 ? fullName.slice(idx + 1).trim() : fullName
}

function sortByVenueThenName(a: WeeklyCourse, b: WeeklyCourse) {
  if (a.venueId !== b.venueId) return a.venueId < b.venueId ? -1 : 1
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
}

function formatShortDate(iso: string) {
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  return `${Number(parts[1])}/${Number(parts[2])}`
}

function getRelativeDayLabel(isoDate: string, todayIso: string): string | null {
  if (isoDate === todayIso) return '今晚'
  const today = new Date(`${todayIso}T00:00:00`)
  const target = new Date(`${isoDate}T00:00:00`)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff === 1) return '明天'
  if (diff === 2) return '後天'
  return null
}

const venueShortLookup = (() => {
  const map: Record<string, string> = {}
  for (const v of venues) map[v.id] = venueShortName(v.name)
  return map
})()

const venueLandmarks: Record<string, string> = {
  'venue-dunnan': '忠孝敦化站',
  'venue-neihu': '港墘站',
  'venue-taichung': '勤美誠品綠園道',
}

type Props = {
  id?: string
  activeCategory?: CourseCategory
  onCategoryChange?: (category: CourseCategory) => void
  categories?: CourseCategory[]
  showCategoryTabs?: boolean
  showVenueFilter?: boolean
  title?: string
  subtitle?: string
  embedded?: boolean
  className?: string
}

export function WeeklyScheduleSection({
  id = 'weekly-schedule',
  activeCategory: controlledCategory,
  onCategoryChange,
  categories = CATEGORY_ORDER,
  showCategoryTabs = categories.length > 1,
  showVenueFilter = false,
  title = weeklyScheduleSectionContent.title,
  subtitle = weeklyScheduleSectionContent.subtitle,
  embedded = false,
  className = '',
}: Props = {}) {
  const fallbackCategory = categories[0] ?? 'FIGHT_NIGHT'
  const [internalCategory, setInternalCategory] =
    useState<CourseCategory>(fallbackCategory)
  const activeCategory =
    controlledCategory && categories.includes(controlledCategory)
      ? controlledCategory
      : internalCategory
  const setActiveCategory = (c: CourseCategory) => {
    if (onCategoryChange) onCategoryChange(c)
    else setInternalCategory(c)
  }
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null)

  const scrollSchedule = (direction: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return

    const card = el.querySelector<HTMLElement>('[data-schedule-card]')
    const style = window.getComputedStyle(el)
    const gap = Number.parseFloat(style.columnGap || style.gap || '16') || 16
    const distance = (card?.offsetWidth ?? el.clientWidth * 0.85) + gap
    el.scrollBy({ left: direction * distance, behavior: 'smooth' })
  }

  const todayIso = useMemo(() => getTodayLocal(), [])

  const upcomingCourses = useMemo(() => {
    return weeklyCourses
      .filter((c) => c.category === activeCategory && c.date >= todayIso)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1
        if (a.startTime !== b.startTime)
          return a.startTime < b.startTime ? -1 : 1
        return sortByVenueThenName(a, b)
      })
  }, [activeCategory, todayIso])

  const venueOptions = useMemo(() => {
    return venues
      .map((venue) => ({
        venue,
        count: upcomingCourses.filter((c) => c.venueId === venue.id).length,
      }))
      .filter((option) => option.count > 0)
  }, [upcomingCourses])

  const displayCourses = useMemo(() => {
    return upcomingCourses
      .filter((c) => !activeVenueId || c.venueId === activeVenueId)
      .slice(0, SCHEDULE_DISPLAY_LIMIT)
  }, [activeVenueId, upcomingCourses])

  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }, [activeCategory, activeVenueId])

  useEffect(() => {
    if (!activeVenueId) return
    const stillAvailable = venueOptions.some(
      (option) => option.venue.id === activeVenueId,
    )
    if (!stillAvailable) setActiveVenueId(null)
  }, [activeVenueId, venueOptions])

  const meta = categoryMeta[activeCategory]
  const planSummary = planSummaryByCategory[activeCategory]
  const earliest = displayCourses[0]
  const earliestLabel = earliest
    ? `最快 ${
        getRelativeDayLabel(earliest.date, todayIso) ??
        `${formatShortDate(earliest.date)} 週${earliest.weekday}`
      } ${earliest.startTime} 可上`
    : null

  const content = (
    <>
      <SectionHeading
        title={title}
        subtitle={subtitle}
        className={embedded ? 'mb-5 md:mb-7' : ''}
      />

      {showCategoryTabs && (
        <div
          role="tablist"
          aria-label="選擇課程方向"
          className="flex flex-wrap justify-center gap-2 md:gap-3 mb-4 md:mb-6"
        >
          {categories.map((cat) => {
            const active = cat === activeCategory
            const m = categoryMeta[cat]
            return (
              <button
                key={cat}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm md:text-base font-heading font-semibold tracking-[0.15em] transition-colors border ${
                  active
                    ? m.tabActiveClass
                    : 'bg-black/30 text-mist border-pearl/15 hover:border-pearl/35 hover:text-pearl'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      )}

      <p className="text-center text-sm md:text-base text-mist/75 max-w-2xl mx-auto mb-2 md:mb-3 leading-snug">
        {meta.lead}
      </p>

      {earliestLabel && (
        <p className="text-center text-base md:text-lg font-heading font-semibold text-pearl mb-7 md:mb-10 tabular-nums">
          {earliestLabel}
        </p>
      )}

      <div className="max-w-6xl mx-auto">
        {showVenueFilter && upcomingCourses.length > 0 && (
          <div className="mb-5 md:mb-6 rounded-2xl border border-pearl/10 bg-black/25 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs md:text-sm font-heading tracking-[0.22em] text-neon/80 uppercase">
                上課地點
              </p>
              <p className="text-xs text-mist/55">
                點選篩選下方課表
              </p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
              <button
                type="button"
                aria-pressed={activeVenueId === null}
                onClick={() => setActiveVenueId(null)}
                className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${
                  activeVenueId === null
                    ? 'border-neon/50 bg-neon/15'
                    : 'border-pearl/10 bg-black/25 hover:border-pearl/25'
                }`}
              >
                <p className="text-sm font-heading font-semibold text-pearl">
                  全部場館
                </p>
                <p className="mt-1 text-xs text-mist/70">
                  {upcomingCourses.length} 場可選
                </p>
              </button>

              {venueOptions.map(({ venue, count }) => (
                <button
                  key={venue.id}
                  type="button"
                  aria-pressed={activeVenueId === venue.id}
                  onClick={() => setActiveVenueId(venue.id)}
                  className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${
                    activeVenueId === venue.id
                      ? 'border-neon/50 bg-neon/15'
                      : 'border-pearl/10 bg-black/25 hover:border-pearl/25'
                  }`}
                >
                  <p className="text-sm font-heading font-semibold text-pearl">
                    {venueShortLookup[venue.id] ?? venue.name}
                  </p>
                  <p className="mt-1 text-xs text-mist/70">
                    {venueLandmarks[venue.id] ?? venue.transit} · {count} 場
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {displayCourses.length === 0 ? (
          <p className="text-center text-sm text-mist/60">
            這個方向近期沒有開課，先用 LINE 加入會員，下一輪開放會優先通知你。
          </p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs md:text-sm font-heading tracking-[0.18em] text-mist/55 uppercase">
                {displayCourses.length} 場可選
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="上一堂課"
                  onClick={() => scrollSchedule(-1)}
                  className="h-10 px-3 rounded-full border border-pearl/15 bg-black/35 text-sm font-heading text-mist hover:text-pearl hover:border-pearl/30 transition-colors"
                >
                  ← 上一堂
                </button>
                <button
                  type="button"
                  aria-label="下一堂課"
                  onClick={() => scrollSchedule(1)}
                  className="h-10 px-3 rounded-full border border-pearl/15 bg-black/35 text-sm font-heading text-mist hover:text-pearl hover:border-pearl/30 transition-colors"
                >
                  下一堂 →
                </button>
              </div>
            </div>

            <div
              ref={scrollerRef}
              className="-mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-3 pb-4 sm:mx-0 sm:px-0 md:gap-5"
            >
              {displayCourses.map((c, i) => {
                const bookingUrl = buildCourseBookingUrl(c)
                const dayLabel = getRelativeDayLabel(c.date, todayIso)
                return (
                  <motion.a
                    key={c.id}
                    href={bookingUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`預留 ${c.name}，${formatShortDate(c.date)} 週${c.weekday} ${c.startTime}–${c.endTime}，${c.venueName}`}
                    data-cta={`schedule-${c.id}`}
                    data-schedule-card
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="group flex min-h-[22rem] shrink-0 basis-[82vw] snap-start flex-col gap-3 rounded-2xl border border-pearl/15 bg-black/35 p-5 transition-colors hover:border-pearl/30 hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl/40 sm:basis-[22rem] md:basis-[21rem] md:p-6 lg:basis-[22rem] xl:basis-[23rem]"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-xl md:text-2xl font-heading font-bold text-pearl tracking-wide">
                        {dayLabel ?? `週${c.weekday}`}
                      </span>
                      <span
                        className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] md:text-xs font-heading font-medium tracking-wide border ${meta.badgeClass}`}
                      >
                        {venueShortLookup[c.venueId] ?? c.venueName}
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-mist/70 font-heading tabular-nums">
                      {formatShortDate(c.date)} · {c.startTime}–{c.endTime}
                    </p>

                    <div className="border-t border-pearl/10 pt-3">
                      <p className="text-base md:text-lg text-pearl font-semibold leading-snug">
                        {c.name}
                      </p>
                      <p className="text-xs md:text-sm text-mist/55 font-heading tracking-wide">
                        {c.nameEn}
                      </p>
                      <p className="text-xs md:text-sm text-mist/65 mt-1.5">
                        教練 {c.coach}
                      </p>
                    </div>

                    <div className="border-t border-pearl/10 pt-3">
                      <p className="text-[10px] md:text-xs font-heading tracking-[0.2em] text-mist/55 mb-1">
                        可用方案
                      </p>
                      <p className="text-sm md:text-base text-pearl font-heading font-semibold">
                        {planSummary.label}
                      </p>
                      <p className="text-sm md:text-base text-pearl/85 tabular-nums">
                        {planSummary.price}
                        {planSummary.hint && (
                          <span className="text-mist/55 text-xs ml-2">
                            {planSummary.hint}
                          </span>
                        )}
                      </p>
                    </div>

                    <div
                      className={`mt-auto inline-flex items-center justify-center gap-1.5 w-full px-4 py-3 rounded-xl font-heading font-bold tracking-wide text-sm md:text-base transition-colors ${meta.ctaClass}`}
                    >
                      預留這一場
                      <span aria-hidden>→</span>
                    </div>
                  </motion.a>
                )
              })}
            </div>
          </>
        )}
      </div>

      <p className="text-center text-xs md:text-sm text-mist/50 max-w-2xl mx-auto mt-8 md:mt-12">
        {weeklyScheduleSectionContent.footnote}
      </p>
    </>
  )

  if (embedded) {
    return (
      <div id={id} data-section={id} className={className}>
        {content}
      </div>
    )
  }

  return (
    <SectionWrapper id={id} className={className}>
      {content}
    </SectionWrapper>
  )
}
