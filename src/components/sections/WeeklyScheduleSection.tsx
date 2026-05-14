import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  bootCampRouteContent,
  planSummaryByCategory,
  venues,
} from '../../data/landingContent'
import {
  findCoachProfile,
  getCoachDisplayName,
  type CoachProfile,
} from '../../data/coachProfiles'
import {
  buildCourseBookingUrl,
  ONLINE_BOOKING_START_OFFSET_DAYS,
  ONLINE_SALES_SEAT_LIMIT,
  SCHEDULE_DISPLAY_LIMIT,
  weeklyCourses,
  weeklyScheduleSectionContent,
} from '../../data/weeklySchedule'
import { useSessionAvailability } from '../../hooks/useSessionAvailability'
import type { BootCampRoute, CourseCategory, WeeklyCourse } from '../../types'
import { Button } from '../ui/Button'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionWrapper } from '../ui/SectionWrapper'

const CATEGORY_ORDER: CourseCategory[] = ['FIGHT_NIGHT', 'BOOT_CAMP']
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const BOOT_CAMP_ROUTE_ORDER: Array<BootCampRoute | null> = [
  null,
  'BOXING',
  'MUAY_THAI',
]

const bootCampPackageMeta: Record<
  2 | 4,
  { label: string; price: string; description: string }
> = {
  2: {
    label: '兩堂',
    price: 'NT$1,800',
    description: '先確認這條路徑是不是你的出口',
  },
  4: {
    label: '四堂',
    price: 'NT$3,800',
    description: '保留四週，讓節奏開始留下',
  },
}

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
    lead: '選定日期與場館，保留今晚進入狀態的位置。',
  },
  BOOT_CAMP: {
    label: 'BOOT CAMP',
    tabActiveClass: 'bg-neon text-abyss border-neon',
    badgeClass: 'border-neon/40 bg-neon/15 text-neon',
    lead: '選場館、開始日期、每周習慣的起點。',
  },
}

function getTodayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getNextWeeklyOccurrence(course: WeeklyCourse, fromIso: string) {
  let date = course.date
  while (date < fromIso) {
    date = addDays(date, 7)
  }

  if (date === course.date) return course

  return {
    ...course,
    id: `${course.id}-${date}`,
    date,
  }
}

function getWeekdayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return WEEKDAY_LABELS[d.getDay()] ?? ''
}

function getBootCampSeries(course: WeeklyCourse, count: 2 | 4) {
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(course.date, index * 7)
    return {
      id: getSessionInventoryId(course, date),
      date,
      weekday: getWeekdayLabel(date),
      startTime: course.startTime,
      endTime: course.endTime,
    }
  })
}

function getSessionInventoryId(course: WeeklyCourse, date = course.date) {
  if (date === course.date) return course.id
  const dynamicDateSuffix = /-\d{4}-\d{2}-\d{2}$/
  const baseId = course.id.replace(dynamicDateSuffix, '')
  return `${baseId}-${date}`
}

function venueShortName(fullName: string) {
  const idx = fullName.indexOf('—')
  return idx >= 0 ? fullName.slice(idx + 1).trim() : fullName
}

function sortByVenueThenName(a: WeeklyCourse, b: WeeklyCourse) {
  if (a.venueId !== b.venueId) return a.venueId < b.venueId ? -1 : 1
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
}

function getBootCampRoute(course: WeeklyCourse): BootCampRoute | null {
  if (course.name.includes('泰拳') || course.name.includes('踢拳')) return 'MUAY_THAI'
  if (course.name.includes('拳擊')) return 'BOXING'
  return null
}

function isBootCampEntryCourse(course: WeeklyCourse) {
  if (course.category !== 'BOOT_CAMP') return true
  return getBootCampRoute(course) !== null
}

function getBootCampRouteLabel(course: WeeklyCourse) {
  const route = getBootCampRoute(course)
  if (route) return bootCampRouteContent[route].label
  return 'Boot Camp'
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

function DisabledCta({
  children,
  className = '',
}: {
  children: string
  className?: string
}) {
  return (
    <button
      type="button"
      disabled
      className={`inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-pearl/10 bg-pearl/5 px-4 py-3 text-sm font-heading font-bold tracking-wide text-mist/45 ${className}`}
    >
      {children}
    </button>
  )
}

function getRemainingLabel(remaining: number, hasLiveData = false) {
  if (remaining <= 0) return '已售完'
  return `${hasLiveData ? '即時' : ''}剩餘 ${remaining} 席`
}

function getRemainingBadgeClass(remaining: number, defaultClass: string) {
  if (remaining <= 0) return 'border-pearl/15 bg-pearl/5 text-mist/45'
  if (remaining <= 2) return 'border-blaze/50 bg-blaze/15 text-blaze'
  return defaultClass
}

function CoachCard({
  coachName,
  profile,
  expanded,
  onToggle,
}: {
  coachName: string
  profile: CoachProfile | null
  expanded: boolean
  onToggle: () => void
}) {
  const displayName = profile?.shortName ?? getCoachDisplayName(coachName)
  const initials = displayName.slice(0, 1).toUpperCase()
  const previewTags = profile
    ? [profile.role, ...profile.specialties.slice(0, 2)]
    : ['教練介紹待補']

  return (
    <div className="mt-4 rounded-xl border border-pearl/10 bg-black/25 p-3">
      <div className="flex items-center gap-3">
        {profile ? (
          <img
            src={profile.photo}
            alt={profile.displayName}
            className="h-14 w-14 shrink-0 rounded-full border border-pearl/15 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-pearl/10 bg-pearl/8 font-heading text-lg font-black text-mist">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-heading uppercase tracking-[0.22em] text-mist/55">
            當堂教練
          </p>
          <p className="mt-1 truncate font-heading text-lg font-black text-pearl">
            {displayName}
          </p>
          <div className="mt-1 flex gap-1.5 overflow-x-auto pb-0.5">
            {previewTags.map((tag) => (
              <span
                key={tag}
                className="shrink-0 rounded-full border border-pearl/10 bg-pearl/5 px-2 py-0.5 text-[10px] text-mist/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {profile ? (
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 rounded-full border border-neon/25 bg-neon/10 px-3 py-1.5 text-xs font-heading font-bold text-neon transition-colors hover:border-neon/45 hover:bg-neon/15"
          >
            {expanded ? '收合' : '看教練'}
          </button>
        ) : (
          <span className="shrink-0 rounded-full border border-pearl/10 bg-pearl/5 px-3 py-1.5 text-xs text-mist/45">
            待補
          </span>
        )}
      </div>

      {expanded && profile && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 overflow-hidden rounded-xl border border-neon/15 bg-neon/8 p-3"
        >
          <p className="text-sm leading-relaxed text-mist/82">
            {profile.intro}
          </p>

          <div className="mt-3 grid gap-1.5">
            {profile.trustPoints.map((point) => (
              <div
                key={point}
                className="flex gap-2 text-xs leading-relaxed text-mist/72"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                <span>{point}</span>
              </div>
            ))}
          </div>

          {profile.record && (
            <p className="mt-3 rounded-lg border border-pearl/10 bg-black/20 px-3 py-2 text-xs leading-relaxed text-mist/70">
              {profile.record}
            </p>
          )}

          {profile.languages && (
            <p className="mt-2 text-[11px] text-mist/52">
              語言：{profile.languages.join(' / ')}
            </p>
          )}
        </motion.div>
      )}

      {!profile && (
        <p className="mt-2 text-xs leading-relaxed text-mist/50">
          這位教練的照片與完整介紹之後補上；目前先以課表排定名稱為準。
        </p>
      )}
    </div>
  )
}

type Props = {
  id?: string
  activeCategory?: CourseCategory
  onCategoryChange?: (category: CourseCategory) => void
  activeBootCampRoute?: BootCampRoute | null
  onBootCampRouteChange?: (route: BootCampRoute | null) => void
  categories?: CourseCategory[]
  showCategoryTabs?: boolean
  showVenueFilter?: boolean
  showBootCampRouteFilter?: boolean
  title?: string
  subtitle?: string
  embedded?: boolean
  bookingMode?: 'standard' | 'bootcamp'
  className?: string
}

export function WeeklyScheduleSection({
  id = 'weekly-schedule',
  activeCategory: controlledCategory,
  onCategoryChange,
  activeBootCampRoute: controlledBootCampRoute,
  onBootCampRouteChange,
  categories = CATEGORY_ORDER,
  showCategoryTabs = categories.length > 1,
  showVenueFilter = false,
  showBootCampRouteFilter = true,
  title = weeklyScheduleSectionContent.title,
  subtitle = weeklyScheduleSectionContent.subtitle,
  embedded = false,
  bookingMode = 'standard',
  className = '',
}: Props = {}) {
  const fallbackCategory = categories[0] ?? 'FIGHT_NIGHT'
  const [internalCategory, setInternalCategory] =
    useState<CourseCategory>(fallbackCategory)
  const [internalBootCampRoute, setInternalBootCampRoute] =
    useState<BootCampRoute | null>(null)
  const activeCategory =
    controlledCategory && categories.includes(controlledCategory)
      ? controlledCategory
      : internalCategory
  const activeBootCampRoute =
    activeCategory === 'BOOT_CAMP'
      ? controlledBootCampRoute ?? internalBootCampRoute
      : null
  const setActiveCategory = (c: CourseCategory) => {
    if (onCategoryChange) onCategoryChange(c)
    else setInternalCategory(c)
  }
  const setActiveBootCampRoute = useCallback((route: BootCampRoute | null) => {
    if (onBootCampRouteChange) onBootCampRouteChange(route)
    else setInternalBootCampRoute(route)
  }, [onBootCampRouteChange])
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeVenueId, setActiveVenueId] = useState<string | null>(null)
  const [activeDateIso, setActiveDateIso] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<{
    courseId: string
    packageSize: 2 | 4
  } | null>(null)
  const [expandedCoachCourseId, setExpandedCoachCourseId] =
    useState<string | null>(null)
  const isBootCampBookingMode =
    bookingMode === 'bootcamp' && activeCategory === 'BOOT_CAMP'

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
  const bookableFromIso = useMemo(
    () => addDays(todayIso, ONLINE_BOOKING_START_OFFSET_DAYS),
    [todayIso],
  )

  const allUpcomingCourses = useMemo(() => {
    const courseBySlot = new Map<string, WeeklyCourse>()

    for (const course of weeklyCourses) {
      if (course.category !== activeCategory || !isBootCampEntryCourse(course)) {
        continue
      }

      const nextCourse = getNextWeeklyOccurrence(course, bookableFromIso)
      const slotKey = [
        nextCourse.category,
        nextCourse.venueId,
        nextCourse.date,
        nextCourse.startTime,
        nextCourse.endTime,
        nextCourse.name,
      ].join('|')

      if (!courseBySlot.has(slotKey)) {
        courseBySlot.set(slotKey, nextCourse)
      }
    }

    return Array.from(courseBySlot.values())
      .filter(
        (c) =>
          c.category === activeCategory &&
          c.date >= bookableFromIso &&
          isBootCampEntryCourse(c),
      )
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1
        if (a.startTime !== b.startTime)
          return a.startTime < b.startTime ? -1 : 1
        return sortByVenueThenName(a, b)
      })
  }, [activeCategory, bookableFromIso])

  const upcomingCourses = useMemo(() => {
    if (activeCategory !== 'BOOT_CAMP' || !activeBootCampRoute) {
      return allUpcomingCourses
    }
    return allUpcomingCourses.filter(
      (course) => getBootCampRoute(course) === activeBootCampRoute,
    )
  }, [activeBootCampRoute, activeCategory, allUpcomingCourses])

  const routeOptions = useMemo(() => {
    if (activeCategory !== 'BOOT_CAMP') return []

    return BOOT_CAMP_ROUTE_ORDER.map((route) => ({
      route,
      count:
        route === null
          ? allUpcomingCourses.length
          : allUpcomingCourses.filter((c) => getBootCampRoute(c) === route)
              .length,
    })).filter((option) => option.count > 0)
  }, [activeCategory, allUpcomingCourses])

  const venueOptions = useMemo(() => {
    return venues
      .map((venue) => ({
        venue,
        count: upcomingCourses.filter((c) => c.venueId === venue.id).length,
      }))
      .filter((option) => option.count > 0)
  }, [upcomingCourses])

  const venueFilteredCourses = useMemo(() => {
    return upcomingCourses.filter((c) => !activeVenueId || c.venueId === activeVenueId)
  }, [activeVenueId, upcomingCourses])

  const dateOptions = useMemo(() => {
    const dates = new Map<string, { date: string; weekday: string; count: number }>()

    for (const course of venueFilteredCourses) {
      const existing = dates.get(course.date)
      if (existing) {
        existing.count += 1
        continue
      }

      dates.set(course.date, {
        date: course.date,
        weekday: course.weekday || getWeekdayLabel(course.date),
        count: 1,
      })
    }

    return Array.from(dates.values()).sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
    )
  }, [venueFilteredCourses])

  const displayCourses = useMemo(() => {
    const dateFilteredCourses =
      isBootCampBookingMode && activeDateIso
        ? venueFilteredCourses.filter((course) => course.date === activeDateIso)
        : venueFilteredCourses

    return dateFilteredCourses.slice(0, SCHEDULE_DISPLAY_LIMIT)
  }, [activeDateIso, isBootCampBookingMode, venueFilteredCourses])

  const availabilitySessionIds = useMemo(() => {
    return displayCourses.flatMap((course) => {
      if (activeCategory !== 'BOOT_CAMP') {
        return [getSessionInventoryId(course)]
      }

      return getBootCampSeries(course, 4).map((session) => session.id)
    })
  }, [activeCategory, displayCourses])

  const { getAvailability, hasLiveData } =
    useSessionAvailability(availabilitySessionIds)

  const getPackageAvailability = useCallback(
    (course: WeeklyCourse, count: 1 | 2 | 4) => {
      const sessionIds =
        count === 1
          ? [getSessionInventoryId(course)]
          : getBootCampSeries(course, count).map((session) => session.id)
      const records = sessionIds.map((sessionId) => getAvailability(sessionId))
      const capacity = Math.min(
        ...records.map((record) => record.capacity),
        ONLINE_SALES_SEAT_LIMIT,
      )
      const remaining = Math.min(...records.map((record) => record.remaining))

      return {
        capacity,
        remaining,
        sold: Math.max(0, capacity - remaining),
      }
    },
    [getAvailability],
  )

  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }, [activeCategory, activeBootCampRoute, activeVenueId])

  useEffect(() => {
    if (!activeVenueId) return
    const stillAvailable = venueOptions.some(
      (option) => option.venue.id === activeVenueId,
    )
    if (!stillAvailable) setActiveVenueId(null)
  }, [activeVenueId, venueOptions])

  useEffect(() => {
    if (!isBootCampBookingMode) {
      if (activeDateIso) setActiveDateIso(null)
      return
    }

    if (dateOptions.length === 0) {
      if (activeDateIso) setActiveDateIso(null)
      return
    }

    const stillAvailable = dateOptions.some(
      (option) => option.date === activeDateIso,
    )

    if (!activeDateIso || !stillAvailable) {
      setActiveDateIso(dateOptions[0].date)
    }
  }, [activeDateIso, dateOptions, isBootCampBookingMode])

  useEffect(() => {
    setSelectedBooking(null)
    setExpandedCoachCourseId(null)
  }, [activeCategory, activeBootCampRoute, activeVenueId, activeDateIso])

  useEffect(() => {
    if (!activeBootCampRoute) return
    const stillAvailable = routeOptions.some(
      (option) => option.route === activeBootCampRoute,
    )
    if (!stillAvailable) setActiveBootCampRoute(null)
  }, [activeBootCampRoute, routeOptions, setActiveBootCampRoute])

  const meta = categoryMeta[activeCategory]
  const planSummary = planSummaryByCategory[activeCategory]
  const purchaseSteps =
    isBootCampBookingMode
      ? ['1 選路徑', '2 選場館日期', '3 確認堂數']
      : activeCategory === 'BOOT_CAMP'
      ? ['1 選路徑', '2 選梯次', '3 保留位置']
      : ['1 選場館', '2 選日期', '3 保留位置']
  const earliest = displayCourses[0]
  const earliestLabel = earliest && !isBootCampBookingMode
    ? `最早可購買 ${formatShortDate(earliest.date)} 週${earliest.weekday} ${earliest.startTime}`
    : null

  const content = (
    <>
      <SectionHeading
        title={title}
        subtitle={subtitle}
        align={isBootCampBookingMode ? 'left' : 'center'}
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

      {!isBootCampBookingMode && (
        <p className="mx-auto mb-2 max-w-2xl text-center text-sm leading-snug text-mist/75 md:mb-3 md:text-base">
          {meta.lead}
        </p>
      )}

      {earliestLabel && (
        <p className="text-center text-base md:text-lg font-heading font-semibold text-pearl mb-7 md:mb-10 tabular-nums">
          {earliestLabel}
        </p>
      )}

      <div className="mx-auto mb-6 grid max-w-3xl grid-cols-3 gap-2 text-center md:mb-8">
        {purchaseSteps.map((step) => (
          <div
            key={step}
            className="rounded-xl border border-pearl/10 bg-black/25 px-2.5 py-2 text-[11px] font-heading font-semibold tracking-wide text-mist/80 md:text-sm"
          >
            {step}
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        {showVenueFilter && upcomingCourses.length > 0 && (
          <div className="mb-5 md:mb-6 rounded-2xl border border-pearl/10 bg-black/25 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs md:text-sm font-heading tracking-[0.22em] text-neon/80 uppercase">
                1 選上課地點
              </p>
              <p className="text-xs text-mist/55">
                只看你方便到場的館別
              </p>
            </div>

            <div
              className={`mt-3 gap-2 ${
                isBootCampBookingMode
                  ? '-mx-1 flex snap-x overflow-x-auto px-1 pb-1'
                  : 'grid grid-cols-1 md:grid-cols-4'
              }`}
            >
              <button
                type="button"
                aria-pressed={activeVenueId === null}
                onClick={() => setActiveVenueId(null)}
                className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${
                  isBootCampBookingMode ? 'min-w-[8.5rem] snap-start' : ''
                } ${
                  activeVenueId === null
                    ? 'border-neon/50 bg-neon/15'
                    : 'border-pearl/10 bg-black/25 hover:border-pearl/25'
                }`}
              >
                <p className="text-sm font-heading font-semibold text-pearl">
                  全部場館
                </p>
                <p className="mt-1 text-xs text-mist/70">
                  {upcomingCourses.length} 場可購買
                </p>
              </button>

              {venueOptions.map(({ venue, count }) => (
                <button
                  key={venue.id}
                  type="button"
                  aria-pressed={activeVenueId === venue.id}
                  onClick={() => setActiveVenueId(venue.id)}
                  className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${
                    isBootCampBookingMode ? 'min-w-[9.5rem] snap-start' : ''
                  } ${
                    activeVenueId === venue.id
                      ? 'border-neon/50 bg-neon/15'
                      : 'border-pearl/10 bg-black/25 hover:border-pearl/25'
                  }`}
                >
                  <p className="text-sm font-heading font-semibold text-pearl">
                    {venueShortLookup[venue.id] ?? venue.name}
                  </p>
                  <p className="mt-1 text-xs text-mist/70">
                    {venueLandmarks[venue.id] ?? venue.transit} · {count} 場可購買
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {isBootCampBookingMode && dateOptions.length > 0 && (
          <div className="mb-5 rounded-2xl border border-pearl/10 bg-black/25 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs md:text-sm font-heading tracking-[0.22em] text-neon/80 uppercase">
                2 選第一堂日期
              </p>
              <p className="text-xs text-mist/55">
                會自動帶入後續週次
              </p>
            </div>

            <div className="-mx-1 mt-3 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
              {dateOptions.map((option) => {
                const active = option.date === activeDateIso
                const relativeLabel = getRelativeDayLabel(option.date, todayIso)

                return (
                  <button
                    key={option.date}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveDateIso(option.date)}
                    className={`min-w-[5.75rem] snap-start rounded-xl border px-3 py-3 text-left transition-colors ${
                      active
                        ? 'border-neon/50 bg-neon/15'
                        : 'border-pearl/10 bg-black/25 hover:border-pearl/25'
                    }`}
                  >
                    <p className="font-heading text-base font-black text-pearl tabular-nums">
                      {formatShortDate(option.date)}
                    </p>
                    <p className="mt-1 text-xs text-mist/70">
                      {relativeLabel ?? `週${option.weekday}`} · {option.count} 場
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {activeCategory === 'BOOT_CAMP' &&
          showBootCampRouteFilter &&
          routeOptions.length > 0 && (
            <div className="mb-5 md:mb-6 rounded-2xl border border-neon/15 bg-neon/5 p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs md:text-sm font-heading tracking-[0.22em] text-neon/80 uppercase">
                  2 選風格路徑
                </p>
                <p className="text-xs text-mist/55">
                  核心都是 Fighter 壓力應對
                </p>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                {routeOptions.map(({ route, count }) => {
                  const active = route === activeBootCampRoute
                  const label = route ? bootCampRouteContent[route].label : '全部路徑'
                  const hint = route ? bootCampRouteContent[route].hint : '拳擊與泰拳都看'

                  return (
                    <button
                      key={route ?? 'all'}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveBootCampRoute(route)}
                      className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${
                        active
                          ? 'border-neon/50 bg-neon/15'
                          : 'border-pearl/10 bg-black/25 hover:border-pearl/25'
                      }`}
                    >
                      <p className="text-sm font-heading font-semibold text-pearl">
                        {label}
                      </p>
                      <p className="mt-1 text-xs text-mist/70">
                        {hint} · {count} 場
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

        {displayCourses.length === 0 ? (
          <p className="text-center text-sm text-mist/60">
            這個條件目前沒有可購買場次，換一個場館或路徑看看。
          </p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs md:text-sm font-heading tracking-[0.18em] text-mist/55 uppercase">
                {displayCourses.length} 場目前可購買
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
                const dayLabel = getRelativeDayLabel(c.date, todayIso)
                const bootCampRouteLabel =
                  activeCategory === 'BOOT_CAMP'
                    ? getBootCampRouteLabel(c)
                    : null
                const bootCampRoute =
                  activeCategory === 'BOOT_CAMP' ? getBootCampRoute(c) : null
                const routeContent = bootCampRoute
                  ? bootCampRouteContent[bootCampRoute]
                  : null
                const sessionTitle =
                  activeCategory === 'FIGHT_NIGHT'
                    ? `${formatShortDate(c.date)} Fight Night Pass`
                    : `${formatShortDate(c.date)} ${routeContent?.label ?? 'Boot Camp'} 起點`
                const sessionAvailability = getPackageAvailability(c, 1)
                const bootCampSeries2 = getBootCampSeries(c, 2)
                const bootCampSeries4 = getBootCampSeries(c, 4)
                const bootCamp2Availability = getPackageAvailability(c, 2)
                const bootCamp4Availability = getPackageAvailability(c, 4)
                const displayAvailability =
                  activeCategory === 'BOOT_CAMP'
                    ? bootCamp4Availability
                    : sessionAvailability
                const remainingBadgeClass = getRemainingBadgeClass(
                  displayAvailability.remaining,
                  meta.badgeClass,
                )
                const bookingUrl = buildCourseBookingUrl(c, {
                  packageSize: 1,
                  seriesDates: [c.date],
                })
                const bookingUrl2 = buildCourseBookingUrl(c, {
                  packageSize: 2,
                  seriesDates: bootCampSeries2.map((session) => session.date),
                })
                const bookingUrl4 = buildCourseBookingUrl(c, {
                  packageSize: 4,
                  seriesDates: bootCampSeries4.map((session) => session.date),
                })
                const coachProfile = findCoachProfile(c.coach)

                if (isBootCampBookingMode) {
                  const selectedPackageSize =
                    selectedBooking?.courseId === c.id
                      ? selectedBooking.packageSize
                      : null
                  const selectedSeries =
                    selectedPackageSize === 2 ? bootCampSeries2 : bootCampSeries4
                  const selectedPackageAvailability =
                    selectedPackageSize === 2
                      ? bootCamp2Availability
                      : bootCamp4Availability
                  const selectedBookingUrl =
                    selectedPackageSize === 2 ? bookingUrl2 : bookingUrl4

                  return (
                    <motion.article
                      key={c.id}
                      aria-label={`${sessionTitle}，${formatShortDate(c.date)} 週${c.weekday} ${c.startTime}–${c.endTime}，${c.venueName}`}
                      data-schedule-card
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.04 }}
                      className="group flex shrink-0 basis-[88vw] snap-start flex-col gap-4 rounded-2xl border border-pearl/15 bg-black/40 p-5 transition-colors hover:border-pearl/30 hover:bg-black/45 sm:basis-[24rem] md:basis-[25rem] md:p-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-heading text-xs uppercase tracking-[0.22em] text-neon/75">
                            第一堂
                          </p>
                          <p className="mt-1 font-heading text-3xl font-black text-pearl tabular-nums">
                            {c.startTime}
                          </p>
                          <p className="text-sm text-mist/72 tabular-nums">
                            {formatShortDate(c.date)} 週{c.weekday} · {c.startTime}–{c.endTime}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-heading tracking-wide ${meta.badgeClass}`}>
                          {venueShortLookup[c.venueId] ?? c.venueName}
                        </span>
                      </div>

                      <div className="rounded-xl border border-pearl/10 bg-black/25 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {routeContent && (
                            <span className="rounded-full border border-neon/20 bg-neon/10 px-2.5 py-1 text-[11px] font-heading tracking-wide text-neon/90">
                              {routeContent.shortLabel}
                            </span>
                          )}
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-heading tracking-wide ${remainingBadgeClass}`}
                          >
                            {getRemainingLabel(
                              displayAvailability.remaining,
                              hasLiveData,
                            )}
                          </span>
                          <span className="rounded-full border border-pearl/10 bg-pearl/5 px-2.5 py-1 text-[11px] font-heading tracking-wide text-mist/70">
                            每堂 6 席
                          </span>
                        </div>

                        <h3 className="mt-3 font-heading text-xl font-black leading-tight text-pearl">
                          {c.name}
                        </h3>
                        <p className="mt-1 text-sm text-mist/58">
                          {venueLandmarks[c.venueId] ?? c.venueName}
                        </p>

                        <CoachCard
                          coachName={c.coach}
                          profile={coachProfile}
                          expanded={expandedCoachCourseId === c.id}
                          onToggle={() =>
                            setExpandedCoachCourseId((current) =>
                              current === c.id ? null : c.id,
                            )
                          }
                        />
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-xs font-heading uppercase tracking-[0.22em] text-neon/75">
                            選擇保留堂數
                          </p>
                          <p className="text-xs text-mist/55">
                            先選堂數再確認日期
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {([2, 4] as const).map((packageSize) => {
                            const packageMeta = bootCampPackageMeta[packageSize]
                            const availability =
                              packageSize === 2
                                ? bootCamp2Availability
                                : bootCamp4Availability
                            const active = selectedPackageSize === packageSize
                            const soldOut = availability.remaining <= 0

                            return (
                              <button
                                key={packageSize}
                                type="button"
                                disabled={soldOut}
                                onClick={() =>
                                  setSelectedBooking({
                                    courseId: c.id,
                                    packageSize,
                                  })
                                }
                                className={`rounded-xl border p-3 text-left transition-colors ${
                                  active
                                    ? 'border-neon/55 bg-neon/15'
                                    : 'border-pearl/10 bg-black/25 hover:border-pearl/25'
                                } ${
                                  soldOut ? 'cursor-not-allowed opacity-45' : ''
                                }`}
                              >
                                <p className="font-heading text-lg font-black text-pearl">
                                  {packageMeta.label}
                                </p>
                                <p className="mt-1 font-heading text-sm font-bold text-neon">
                                  {packageMeta.price}
                                </p>
                                <p className="mt-1 text-xs leading-snug text-mist/62">
                                  {soldOut
                                    ? '已售完'
                                    : getRemainingLabel(
                                        availability.remaining,
                                        hasLiveData,
                                      )}
                                </p>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {selectedPackageSize ? (
                        <div className="rounded-2xl border border-neon/20 bg-neon/10 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-heading uppercase tracking-[0.22em] text-neon/75">
                                確認保留日期
                              </p>
                              <p className="mt-1 font-heading text-lg font-black text-pearl">
                                {bootCampPackageMeta[selectedPackageSize].label} · 同館同時段
                              </p>
                            </div>
                            <p className="font-heading text-base font-black text-neon">
                              {bootCampPackageMeta[selectedPackageSize].price}
                            </p>
                          </div>

                          <div className="mt-3 space-y-1.5">
                            {selectedSeries.map((session, index) => (
                              <div
                                key={session.id}
                                className="flex items-center justify-between gap-3 rounded-lg bg-black/25 px-3 py-2 text-sm"
                              >
                                <span className="font-heading text-mist/55">
                                  第 {index + 1} 堂
                                </span>
                                <span className="font-heading text-pearl tabular-nums">
                                  {formatShortDate(session.date)} 週{session.weekday} {session.startTime}
                                </span>
                              </div>
                            ))}
                          </div>

                          {selectedPackageAvailability.remaining > 0 ? (
                            <Button
                              href={selectedBookingUrl ?? undefined}
                              variant="primary"
                              className="mt-4 w-full"
                              data-cta={`schedule-${c.id}-bootcamp-${selectedPackageSize}`}
                            >
                              購買這個位置 · {getRemainingLabel(
                                selectedPackageAvailability.remaining,
                                hasLiveData,
                              )}
                            </Button>
                          ) : (
                            <DisabledCta className="mt-4">
                              這組日期已售完
                            </DisabledCta>
                          )}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-pearl/10 bg-black/20 px-4 py-3 text-sm leading-relaxed text-mist/60">
                          選兩堂或四堂後，系統會直接列出你要保留的每一堂日期。
                        </p>
                      )}
                    </motion.article>
                  )
                }

                return (
                  <motion.article
                    key={c.id}
                    aria-label={`${sessionTitle}，${formatShortDate(c.date)} 週${c.weekday} ${c.startTime}–${c.endTime}，${c.venueName}`}
                    data-schedule-card
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="group flex min-h-[30rem] shrink-0 basis-[84vw] snap-start flex-col gap-3 rounded-2xl border border-pearl/15 bg-black/35 p-5 transition-colors hover:border-pearl/30 hover:bg-black/45 sm:basis-[22rem] md:basis-[21rem] md:p-6 lg:basis-[22rem] xl:basis-[23rem]"
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

                    <div>
                      <p className="text-2xl md:text-3xl font-heading font-black text-pearl tabular-nums">
                        {c.startTime}
                      </p>
                      <p className="text-sm md:text-base text-mist/70 font-heading tabular-nums">
                        {formatShortDate(c.date)} 週{c.weekday} · {c.startTime}–{c.endTime}
                      </p>
                      <p className="mt-1 text-xs md:text-sm text-mist/60">
                        {venueLandmarks[c.venueId] ?? c.venueName}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <p className="inline-flex w-fit rounded-full border border-pearl/10 bg-pearl/5 px-2.5 py-1 text-[11px] font-heading tracking-wide text-mist/75">
                        線上限量 {displayAvailability.capacity} 席
                      </p>
                      <p
                        className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-heading tracking-wide border ${remainingBadgeClass}`}
                      >
                        {getRemainingLabel(
                          displayAvailability.remaining,
                          hasLiveData,
                        )}
                      </p>
                      <p className="inline-flex w-fit rounded-full border border-pearl/10 bg-black/25 px-2.5 py-1 text-[11px] font-heading tracking-wide text-mist/55">
                        {hasLiveData ? '即時更新' : '名額同步中'}
                      </p>
                      {bootCampRouteLabel && (
                        <p className="inline-flex w-fit rounded-full border border-neon/20 bg-neon/10 px-2.5 py-1 text-[11px] font-heading tracking-wide text-neon/90">
                          {routeContent?.badge ?? bootCampRouteLabel}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-pearl/10 pt-3">
                      <p className="text-base md:text-lg text-pearl font-semibold leading-snug">
                        {c.name}
                      </p>
                      <p className="text-xs md:text-sm text-mist/55 font-heading tracking-wide">
                        {c.nameEn}
                      </p>
                      {activeCategory === 'BOOT_CAMP' ? (
                        <div className="mt-3 rounded-xl border border-pearl/10 bg-black/25 p-3">
                          <p className="text-[10px] md:text-xs font-heading tracking-[0.18em] text-mist/55">
                            本梯教練
                          </p>
                          <p className="mt-1 font-heading text-lg font-black text-pearl">
                            {c.coach}
                          </p>
                          <p className="mt-1 text-xs md:text-sm leading-relaxed text-mist/66">
                            {routeContent
                              ? `帶你進入「${routeContent.badge}」路徑`
                              : '帶你進入這一梯 Boot Camp'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs md:text-sm text-mist/65 mt-1.5">
                          教練 {c.coach}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-pearl/10 pt-3">
                      <p className="text-[10px] md:text-xs font-heading tracking-[0.2em] text-mist/55 mb-1">
                        你正在保留
                      </p>
                      <p className="text-sm md:text-base text-pearl font-heading font-semibold">
                        {sessionTitle}
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

                    {routeContent && (
                      <div className="rounded-xl border border-pearl/10 bg-black/25 p-3">
                        <p className="text-[10px] md:text-xs font-heading tracking-[0.18em] text-mist/55 mb-1.5">
                          FIGHTER 壓力應對
                        </p>
                        <p className="text-sm font-heading font-semibold text-pearl leading-snug">
                          {routeContent.fighterLesson}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {routeContent.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-pearl/10 bg-pearl/5 px-2 py-0.5 text-[11px] text-mist/75"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeCategory === 'BOOT_CAMP' && (
                      <div className="rounded-xl border border-neon/15 bg-neon/5 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-[10px] md:text-xs font-heading tracking-[0.18em] text-neon/80">
                            自動帶入四週
                          </p>
                          <p className="text-[11px] text-mist/55">
                            同館同時段
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          {bootCampSeries4.map((session, index) => (
                            <div
                              key={session.id}
                              className="rounded-lg bg-black/20 px-2.5 py-2 text-xs md:text-sm"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-heading text-mist/55">
                                  第 {index + 1} 堂
                                </span>
                                <span className="font-heading text-pearl tabular-nums">
                                  {formatShortDate(session.date)} 週{session.weekday}{' '}
                                  {session.startTime}
                                </span>
                              </div>
                              {routeContent?.weekPlan[index] && (
                                <p className="mt-1 text-[11px] leading-snug text-mist/65">
                                  {routeContent.weekPlan[index]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto">
                      {activeCategory === 'BOOT_CAMP' ? (
                        <div className="grid grid-cols-2 gap-2">
                          {bootCamp2Availability.remaining > 0 ? (
                            <Button
                              href={bookingUrl2 ?? undefined}
                              variant="secondary"
                              size="sm"
                              className="w-full border-neon/25 bg-neon/10 text-pearl"
                              data-cta={`schedule-${c.id}-bootcamp-2`}
                            >
                              兩堂 · {getRemainingLabel(
                                bootCamp2Availability.remaining,
                                hasLiveData,
                              )}
                            </Button>
                          ) : (
                            <DisabledCta>兩堂已售完</DisabledCta>
                          )}
                          {bootCamp4Availability.remaining > 0 ? (
                            <Button
                              href={bookingUrl4 ?? undefined}
                              variant="primary"
                              size="sm"
                              className="w-full"
                              data-cta={`schedule-${c.id}-bootcamp-4`}
                            >
                              四堂 · {getRemainingLabel(
                                bootCamp4Availability.remaining,
                                hasLiveData,
                              )}
                            </Button>
                          ) : (
                            <DisabledCta>四堂已售完</DisabledCta>
                          )}
                        </div>
                      ) : (
                        sessionAvailability.remaining > 0 ? (
                          <Button
                            href={bookingUrl ?? undefined}
                            variant="primary"
                            className="w-full"
                            data-cta={`schedule-${c.id}-fight-night`}
                          >
                            購買這一場 · {getRemainingLabel(
                              sessionAvailability.remaining,
                              hasLiveData,
                            )}
                          </Button>
                        ) : (
                          <DisabledCta>本場已售完</DisabledCta>
                        )
                      )}
                    </div>
                  </motion.article>
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
