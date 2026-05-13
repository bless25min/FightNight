import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { venues } from '../../data/landingContent'
import {
  buildCourseBookingUrl,
  SCHEDULE_DISPLAY_LIMIT,
  weeklyCourses,
  weeklyScheduleSectionContent,
} from '../../data/weeklySchedule'
import type { CourseCategory, WeeklyCourse } from '../../types'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionWrapper } from '../ui/SectionWrapper'

function getTodayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const CATEGORY_ORDER: CourseCategory[] = ['FIGHT_NIGHT', 'BOOT_CAMP']

const categoryMeta: Record<
  CourseCategory,
  {
    label: string
    tabActiveClass: string
    badgeClass: string
    lead: string
  }
> = {
  FIGHT_NIGHT: {
    label: 'FIGHT NIGHT',
    tabActiveClass: 'bg-blaze text-abyss border-blaze',
    badgeClass: 'border-blaze/40 bg-blaze/15 text-blaze',
    lead: '節奏與體能驅動。第一次進場、想跟著音樂與教練吶喊進入狀態的人，從這裡開始。',
  },
  BOOT_CAMP: {
    label: 'BOOT CAMP',
    tabActiveClass: 'bg-neon text-abyss border-neon',
    badgeClass: 'border-neon/40 bg-neon/15 text-neon',
    lead: '技術與格鬥邏輯。想把刺激變成可以記住的身體反射、進入完整系統訓練的人。',
  },
}

function venueShortName(fullName: string) {
  const idx = fullName.indexOf('—')
  return idx >= 0 ? fullName.slice(idx + 1).trim() : fullName
}

function sortByVenueThenName(a: WeeklyCourse, b: WeeklyCourse) {
  if (a.venueId !== b.venueId) return a.venueId < b.venueId ? -1 : 1
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
}

function sortByTime(a: WeeklyCourse, b: WeeklyCourse) {
  if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1
  return sortByVenueThenName(a, b)
}

type DateGroup = {
  date: string
  weekday: string
  items: WeeklyCourse[]
}

function groupByDate(courses: WeeklyCourse[]): DateGroup[] {
  const map = new Map<string, DateGroup>()
  for (const c of courses) {
    if (!map.has(c.date)) {
      map.set(c.date, { date: c.date, weekday: c.weekday, items: [] })
    }
    map.get(c.date)!.items.push(c)
  }
  const groups = Array.from(map.values())
  groups.sort((a, b) => (a.date < b.date ? -1 : 1))
  for (const g of groups) g.items.sort(sortByTime)
  return groups
}

function formatShortDate(iso: string) {
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  return `${Number(parts[1])}/${Number(parts[2])}`
}

const venueShortLookup = (() => {
  const map: Record<string, string> = {}
  for (const v of venues) map[v.id] = venueShortName(v.name)
  return map
})()

type Props = {
  activeCategory?: CourseCategory
  onCategoryChange?: (category: CourseCategory) => void
}

export function WeeklyScheduleSection({
  activeCategory: controlledCategory,
  onCategoryChange,
}: Props = {}) {
  const [internalCategory, setInternalCategory] =
    useState<CourseCategory>('FIGHT_NIGHT')
  const activeCategory = controlledCategory ?? internalCategory
  const setActiveCategory = (c: CourseCategory) => {
    if (onCategoryChange) onCategoryChange(c)
    else setInternalCategory(c)
  }

  const displayCourses = useMemo(() => {
    const today = getTodayLocal()
    return weeklyCourses
      .filter((c) => c.category === activeCategory && c.date >= today)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1
        return sortByTime(a, b)
      })
      .slice(0, SCHEDULE_DISPLAY_LIMIT)
  }, [activeCategory])

  const dateGroups = useMemo(
    () => groupByDate(displayCourses),
    [displayCourses],
  )

  const meta = categoryMeta[activeCategory]

  return (
    <SectionWrapper id="weekly-schedule">
      <SectionHeading
        title={weeklyScheduleSectionContent.title}
        subtitle={weeklyScheduleSectionContent.subtitle}
      />

      {/* Category tabs */}
      <div
        role="tablist"
        aria-label="選擇課程方向"
        className="flex flex-wrap justify-center gap-2 md:gap-3 mb-4 md:mb-6"
      >
        {CATEGORY_ORDER.map((cat) => {
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

      <p className="text-center text-sm md:text-base text-mist/75 max-w-2xl mx-auto mb-7 md:mb-10 leading-snug">
        {meta.lead}
      </p>

      {/* Date groups */}
      <div className="max-w-5xl mx-auto space-y-7 md:space-y-10">
        {dateGroups.length === 0 ? (
          <p className="text-center text-sm text-mist/60">
            這個方向近期沒有開課，先用 LINE 加入會員，下一輪開放會優先通知你。
          </p>
        ) : (
          dateGroups.map((g, gIdx) => (
            <motion.div
              key={`${activeCategory}-${g.date}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: gIdx * 0.04 }}
            >
              <div className="flex items-baseline gap-3 mb-3 md:mb-4 border-b border-pearl/10 pb-2">
                <h3 className="text-lg md:text-xl font-heading font-bold text-pearl">
                  週{g.weekday}
                </h3>
                <span className="text-sm md:text-base text-mist/60 font-heading tabular-nums">
                  {formatShortDate(g.date)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {g.items.map((c) => {
                  const bookingUrl = buildCourseBookingUrl(c)
                  return (
                    <a
                      key={c.id}
                      href={bookingUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`報名 ${c.name}，${formatShortDate(c.date)} 週${c.weekday} ${c.startTime}–${c.endTime}，${c.venueName}`}
                      data-cta={`schedule-${c.id}`}
                      className="group rounded-xl border border-pearl/10 bg-black/30 px-4 py-3 md:px-5 md:py-4 flex flex-col gap-1.5 hover:border-pearl/30 hover:bg-black/45 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm md:text-base font-heading text-pearl tabular-nums">
                          {c.startTime}–{c.endTime}
                        </span>
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] md:text-xs font-heading font-medium tracking-wide border ${meta.badgeClass}`}
                        >
                          {venueShortLookup[c.venueId] ?? c.venueName}
                        </span>
                      </div>
                      <p className="text-sm md:text-base text-pearl font-medium leading-snug">
                        {c.name}
                      </p>
                      <p className="text-xs md:text-sm text-mist/55 font-heading tracking-wide">
                        {c.nameEn}
                      </p>
                      <p className="text-xs md:text-sm text-mist/60">
                        {c.coach}
                      </p>
                      <span className="mt-1 text-xs md:text-sm font-heading text-mist/55 group-hover:text-pearl transition-colors">
                        前往報名 →
                      </span>
                    </a>
                  )
                })}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <p className="text-center text-xs md:text-sm text-mist/50 max-w-2xl mx-auto mt-10 md:mt-14">
        {weeklyScheduleSectionContent.footnote}
      </p>
    </SectionWrapper>
  )
}
