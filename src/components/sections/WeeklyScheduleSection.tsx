import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  bootCampRouteContent,
  venues,
} from '../../data/landingContent'
import {
  findCoachProfile,
  getCoachDisplayName,
  getCoachPricingTier,
  type CoachPricingTier,
  type CoachProfile,
} from '../../data/coachProfiles'
import {
  ONLINE_BOOKING_START_OFFSET_DAYS,
  ONLINE_SALES_SEAT_LIMIT,
  SCHEDULE_DISPLAY_LIMIT,
  getWeeklyCourseForCategory,
  isWeeklyCourseAvailableForCategory,
  weeklyCourses,
  weeklyScheduleSectionContent,
} from '../../data/weeklySchedule'
import { useSessionAvailability } from '../../hooks/useSessionAvailability'
import { useTracking } from '../../hooks/useTracking'
import {
  FIRST_PURCHASE_OFFER_BADGE,
  applyFirstPurchaseOfferToPrice,
  getCoursePriceModel,
  getTaipeiTodayIso,
  isFirstPurchaseOfferCourseEligible,
} from '../../lib/coursePricing'
import { getLineRequestContext } from '../../lib/lineContext'
import type { BootCampRoute, CourseCategory, WeeklyCourse } from '../../types'
import { Button } from '../ui/Button'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionWrapper } from '../ui/SectionWrapper'

const CATEGORY_ORDER: CourseCategory[] = ['FIGHT_NIGHT', 'BOOT_CAMP']
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const BOOT_CAMP_START_DATE_WEEKS = 6
const BOOT_CAMP_ROUTE_ORDER: Array<BootCampRoute | null> = [
  null,
  'BOXING',
  'MUAY_THAI',
]
const EMPTY_FEATURED_COURSE_NAMES: string[] = []
const INTERACTION_HINT_SEEN_STORAGE_KEY =
  'fightnight_seen_interaction_hints_v1'

type InteractionHintSeenState = {
  coaches: string[]
  courses: string[]
}

function getInitialInteractionHintSeen(): InteractionHintSeenState {
  if (typeof window === 'undefined') return { coaches: [], courses: [] }

  try {
    const raw = window.localStorage.getItem(INTERACTION_HINT_SEEN_STORAGE_KEY)
    if (!raw) return { coaches: [], courses: [] }
    const parsed = JSON.parse(raw) as Partial<InteractionHintSeenState>
    return {
      coaches: Array.isArray(parsed.coaches) ? parsed.coaches : [],
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
    }
  } catch {
    return { coaches: [], courses: [] }
  }
}

function writeInteractionHintSeen(next: InteractionHintSeenState) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      INTERACTION_HINT_SEEN_STORAGE_KEY,
      JSON.stringify(next),
    )
  } catch {
    // Hint memory is non-critical; if storage is blocked, the page still works.
  }
}

function getCoachHintKey(coachName: string, profile: CoachProfile | null) {
  return profile?.id ?? getCoachDisplayName(coachName)
}

function getCourseHintKey(course: WeeklyCourse) {
  return course.name
}

const bootCampPackageMeta: Record<
  2 | 4,
  { label: string; description: string }
> = {
  2: {
    label: '兩堂',
    description: '連續兩週保留同一時段，先確認自己能不能固定出現',
  },
  4: {
    label: '四堂',
    description: '連續四週保留同一時段，適合把運動排進生活',
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
  return getTaipeiTodayIso()
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

function getUpcomingWeeklyOccurrences(
  course: WeeklyCourse,
  fromIso: string,
  weeks: number,
) {
  const first = getNextWeeklyOccurrence(course, fromIso)

  return Array.from({ length: weeks }, (_, index) => {
    const date = index === 0 ? first.date : addDays(first.date, index * 7)

    return {
      ...course,
      id: getSessionInventoryId(course, date),
      date,
      weekday: getWeekdayLabel(date),
    }
  })
}

function venueShortName(fullName: string) {
  const idx = fullName.indexOf('—')
  return idx >= 0 ? fullName.slice(idx + 1).trim() : fullName
}

function sortByVenueThenName(a: WeeklyCourse, b: WeeklyCourse) {
  if (a.venueId !== b.venueId) return a.venueId < b.venueId ? -1 : 1
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
}

function prioritizeFeaturedCourses(
  courses: WeeklyCourse[],
  featuredNames: string[],
) {
  if (featuredNames.length === 0) return courses

  const selected = new Map<string, WeeklyCourse>()
  for (const name of featuredNames) {
    const match = courses.find(
      (course) => course.name === name && !selected.has(course.id),
    )
    if (match) selected.set(match.id, match)
  }

  const selectedIds = new Set(selected.keys())
  return [
    ...selected.values(),
    ...courses.filter((course) => !selectedIds.has(course.id)),
  ]
}

function getBootCampRoute(course: WeeklyCourse): BootCampRoute | null {
  if (course.name.includes('泰拳') || course.name.includes('踢拳')) return 'MUAY_THAI'
  if (course.name.includes('拳擊')) return 'BOXING'
  return null
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

function getRemainingLabel(remaining: number) {
  if (remaining <= 0) return '已售完'
  return `剩餘 ${remaining} 席`
}

function getRemainingBadgeClass(remaining: number, defaultClass: string) {
  if (remaining <= 0) return 'border-pearl/15 bg-pearl/5 text-mist/45'
  if (remaining <= 2) return 'border-blaze/50 bg-blaze/15 text-blaze'
  return defaultClass
}

function shouldShowRemainingBadge(remaining: number) {
  return remaining <= 2
}

type CourseMerchandisingCopy = {
  title: string
  pitch: string
  desire: string
  coachHook: string
}

function getCoachHook(
  coachName: string,
  coachProfile: CoachProfile | null,
) {
  const displayName = coachProfile?.shortName ?? getCoachDisplayName(coachName)

  if (coachProfile?.id === 'andre') {
    return 'Andre 的世界冠軍與泰拳實戰背景，會把踢拳回合帶得更有壓迫感。'
  }
  if (coachProfile?.id === 'bruno') {
    return 'Bruno 有職業泰拳與 MMA 賽事經驗，適合想感受實戰節奏的人。'
  }
  if (coachProfile?.id === 'got') {
    return 'Got 具泰拳教師資格與職業選手靶師背景，會把踢拳節奏帶得很直接。'
  }
  if (coachProfile?.id === 'mario') {
    return 'Mario 的職業 MMA 28 勝背景，會把訓練帶成一場完整的身體挑戰。'
  }
  if (coachProfile?.id === 'rafael') {
    return 'Rafael 具柔術黑帶與 MMA、拳擊背景，會把動作控制與壓力節奏帶進課裡。'
  }
  if (coachProfile?.id === 'sim') {
    return 'Sim 的技擊與柔道背景，會把重心、穩定和動作控制帶得更扎實。'
  }
  if (coachProfile?.id === 'mengyan') {
    return '孟諺有拳擊四連霸與教練背景，適合把出拳、節奏和沙包回合練得更清楚。'
  }

  return `${displayName} 會用口令和回合帶你進入狀態，不需要自己硬撐。`
}

function getCourseMerchandisingCopy(
  course: WeeklyCourse,
  activeCategory: CourseCategory,
  coachProfile: CoachProfile | null,
): CourseMerchandisingCopy {
  const isBootCamp = activeCategory === 'BOOT_CAMP'
  const coachHook = getCoachHook(course.coach, coachProfile)

  if (isBootCamp) {
    if (course.name.includes('拳擊技巧')) {
      return {
        title: '把拳套聲，磨成更清楚的拳路',
        pitch:
          '你已熟悉基本出拳，這堂會把技術攻防組合與校準，打得更有意義。',
        desire:
          '把原本會用力的身體，磨成更能控制節奏、方向和壓力的身體。',
        coachHook,
      }
    }
    if (course.name.includes('泰拳技巧') || course.name.includes('踢拳技巧')) {
      return {
        title: '把踢擊、膝頂，磨成更清楚的節奏',
        pitch:
          '你已熟悉泰拳或踢拳，把技術攻防組合與校準，讓身體形成記憶。',
        desire:
          '把原本只會燃燒的身體，推進到能控制力道、距離和節奏的狀態。',
        coachHook,
      }
    }
    if (course.name.includes('基礎拳擊')) {
      return {
        title: '把第一拳，變成每週回來的儀式',
        pitch:
          '從站姿、出拳到沙包悶響，每週把身體帶回那個被點燃的地方。',
        desire: '讓第一次被點燃的感覺，不只停在一個晚上，而是變成每週會出現的自己。',
        coachHook,
      }
    }
    if (course.name.includes('拳擊體適能')) {
      return {
        title: '每週一次，把壓力砸進黑色沙包',
        pitch:
          '拳套握緊、口令落下、沙包回聲響起，讓下班後的悶每週都有一個真正能倒出去的地方。',
        desire: '你保留的是一個固定出口，讓壓力每週都能被身體完整處理掉一次。',
        coachHook,
      }
    }
    if (course.name.includes('基礎泰拳') || course.name.includes('基礎踢拳')) {
      return {
        title: '踢拳點燃的瞬間，形成身體記憶',
        pitch:
          '從第一組踢拳開始，讓重心、吐氣和全身發熱慢慢成為熟悉節奏。',
        desire: '把踢拳帶起來的身體記憶，變成生活裡固定會被喚醒的暗號。',
        coachHook,
      }
    }
    if (course.name.includes('泰拳體適能') || course.name.includes('踢拳體適能')) {
      return {
        title: '每週回到那個踢拳沸騰的小圈子',
        pitch:
          '拳、踢、沙包、倒數一起堆上去，把日常的雜訊關掉，重新進入那個有人一起流汗的場。',
        desire: '你買的是每週回到同一個小圈子的門票，讓身體重新記得熱起來的感覺。',
        coachHook,
      }
    }
    if (course.name.includes('戰鬥體適能')) {
      return {
        title: '固定把自己交給全場，換一身完成感',
        pitch:
          '教練口令、體能回合和最後倒數會把你推過去；你不是自己硬撐，是被一整個場帶著完成。',
        desire: '把 Fight Night 的集體推力留下來，變成每週固定能回到身上的完成感。',
        coachHook,
      }
    }
  }

  if (course.name.includes('基礎拳擊')) {
    return {
      title: '第一次出拳，是身體蛻變的開始',
      pitch:
        '從第一次出拳開始，把緊張交給教練，把力量交給沙包，找回屬於你的專注。',
      desire: '你會記得的不是動作做得多標準，而是第一次真的跟全場一起走到最後。',
      coachHook,
    }
  }

  if (course.name.includes('拳擊體適能')) {
    return {
      title: '奮力出拳與沙包的完美編排',
      pitch:
        '把精神與壓力握進拳套，釋放到深不見底、帶著鮮豔標誌的黑色沙包裡。',
      desire: '你會記得拳套撞上沙包那一下，像把整天的精神和壓力一次交出去。',
      coachHook,
    }
  }

  if (course.name.includes('基礎泰拳')) {
    return {
      title: '第一組踢拳，喚醒身體裡的力量',
      pitch:
        '拳、踢、膝，把身體一段段逐步喚醒；在教練口令裡，你會慢慢被帶到那個比想像更高的地方。',
      desire: '你會發現自己不是來學幾個動作，而是被踢拳帶進一個更炙熱的身體狀態。',
      coachHook,
    }
  }

  if (course.name.includes('基礎踢拳')) {
    return {
      title: '第一組踢拳，進入全場沸騰節奏',
      pitch:
        '先讓你跟上，再讓你被帶走；踢拳聲、吐氣聲、倒數聲疊在一起，普通的一天會開始變形。',
      desire: '你會在踢拳和倒數之間，感覺自己從旁觀者變成那個場的一部分。',
      coachHook,
    }
  }

  if (course.name.includes('泰拳體適能')) {
    return {
      title: '拳、踢、膝組合，不斷堆疊的風暴',
      pitch:
        '拳套、踢擊、膝頂一路堆疊，教練的吶喊和旁邊的人把你推進高點，直到最後一分鐘全場一起釋放。',
      desire: '你買的是那種全身被推到高點，最後和一群人一起爆開的情緒體驗。',
      coachHook,
    }
  }

  if (course.name.includes('踢拳體適能')) {
    return {
      title: '踢拳聲與倒數聲，把夜晚推到發亮',
      pitch:
        '從能跟上的踢拳開始，一路被節奏加速；你會感覺日常慢慢退後，只剩眼前的沙包、口令和呼吸。',
      desire: '你會被踢拳聲、倒數聲和全場的呼吸拉進去，像短暫進入另一個城市角落。',
      coachHook,
    }
  }

  if (course.name.includes('戰鬥體適能')) {
    return {
      title: '燃燒吧，與身旁的人共同撐過挑戰',
      pitch:
        '格鬥、沙包與倒數被編成一段城市裡的吶喊；最累的時候，旁邊的人和教練會把你一起推過去。',
      desire: '你會在快要放棄的地方，被全場一起推過去，留下疲憊之後的狂喜和安靜。',
      coachHook,
    }
  }

  return {
    title: course.name,
    pitch: '跟著教練口令進入回合，把注意力、呼吸和力氣一起交給現場。',
    desire: '你買的是一段會把日常暫時關掉的身體經驗。',
    coachHook,
  }
}

function getCourseProductTitle(
  course: WeeklyCourse,
  activeCategory: CourseCategory,
  coachProfile: CoachProfile | null,
) {
  if (course.productTitle) return course.productTitle
  return getCourseMerchandisingCopy(course, activeCategory, coachProfile).title
}

function getCourseCardPitch(
  course: WeeklyCourse,
  activeCategory: CourseCategory,
  coachProfile: CoachProfile | null,
) {
  return getCourseMerchandisingCopy(course, activeCategory, coachProfile).pitch
}

type CourseDecisionSignal = {
  label: string
  value: string
}

function getCourseBundleItems(
  course: WeeklyCourse,
) {
  return (course.bundleItems ?? []).slice(0, 3)
}

function getCourseStimulusLabel(course: WeeklyCourse) {
  if (course.name.includes('拳擊體適能')) return '肩背、核心、心肺'
  if (course.name.includes('基礎拳擊')) return '肩背、核心、手臂'
  if (course.name.includes('戰鬥體適能')) return '全身、核心、心肺'
  if (course.name.includes('泰拳體適能') || course.name.includes('踢拳體適能')) {
    return '核心、臀腿、心肺'
  }
  if (course.name.includes('泰拳') || course.name.includes('踢拳')) {
    return '核心、髖、腿'
  }
  return '全身、核心、心肺'
}

function getCourseFeelingLabel(course: WeeklyCourse) {
  if (course.name.includes('拳擊體適能')) return '暢快打擊、排解壓力'
  if (course.name.includes('基礎拳擊')) return '把拳送進沙包'
  if (course.name.includes('戰鬥體適能')) return '倒數衝刺、全身燃燒'
  if (course.name.includes('泰拳體適能')) return '拳、踢、膝堆疊爆汗'
  if (course.name.includes('踢拳體適能')) return '踢拳連發、心率拉高'
  if (course.name.includes('基礎泰拳')) return '拳膝連動、全身醒來'
  if (course.name.includes('基礎踢拳')) return '踢拳連動、節奏加速'
  return '高心率、全身釋放'
}

function getCourseTechniqueLabel(course: WeeklyCourse) {
  if (course.name.includes('技巧')) return '中階'
  if (course.name.includes('基礎')) return '簡單'
  if (course.name.includes('體適能') || course.name.includes('戰鬥')) {
    return '入門'
  }
  return '入門'
}

function getCourseStyleLabel(
  course: WeeklyCourse,
  coachName: string,
  coachProfile: CoachProfile | null,
) {
  const isMuayOrKick =
    course.name.includes('泰拳') || course.name.includes('踢拳')
  const isBoxing = course.name.includes('拳擊')
  const isBjj = course.name.includes('巴西柔術')
  const isMma = course.name.includes('綜合格鬥')
  const isFightFit = course.name.includes('戰鬥體適能')

  if (isMuayOrKick) {
    if (coachProfile?.id === 'andre') return '巴西泰拳冠軍訓練'
    if (coachProfile?.id === 'bruno') return '巴西職業泰拳選手'
    if (coachProfile?.id === 'got') return '泰國職業選手靶師'
    if (coachProfile?.id === 'mario' || coachProfile?.id === 'rafael') {
      return '巴西 MMA 踢拳訓練'
    }
    if (coachProfile?.id === 'sim') return '柔道技擊重心訓練'
    if (coachProfile?.id === 'mengyan') return '拳擊隊打擊節奏'

    return getCoachPricingTier(coachName, coachProfile) === 'foreign-fighter'
      ? '國際踢拳打擊訓練'
      : '踢拳體適能訓練'
  }

  if (isBoxing) {
    if (coachProfile?.id === 'mengyan') return '拳擊隊 / 全運會選手'
    if (coachProfile?.id === 'got') return '泰國靶師打擊訓練'
    if (coachProfile?.id === 'sim') return '技擊重心拳擊訓練'
    if (
      coachProfile?.id === 'andre' ||
      coachProfile?.id === 'bruno' ||
      coachProfile?.id === 'mario' ||
      coachProfile?.id === 'rafael'
    ) {
      return '巴西 MMA 拳擊訓練'
    }

    return '拳擊打擊訓練'
  }

  if (isBjj) {
    if (coachProfile?.id === 'rafael') return '巴柔黑帶4段系統'
    if (coachProfile?.id === 'mario' || coachProfile?.id === 'bruno') {
      return '巴西柔術黑帶系統'
    }
    if (coachProfile?.id === 'sim') return '柔道 / 巴柔技擊訓練'

    return '巴西柔術入門系統'
  }

  if (isMma) {
    if (coachProfile?.id === 'mario' || coachProfile?.id === 'bruno') {
      return '職業MMA選手訓練'
    }
    if (coachProfile?.id === 'andre' || coachProfile?.id === 'rafael') {
      return '巴西 MMA 實戰訓練'
    }
    if (coachProfile?.id === 'sim') return '柔道 / MMA 技擊訓練'

    return 'MMA 入門訓練'
  }

  if (isFightFit) {
    if (coachProfile?.id === 'mengyan') return '拳擊隊戰鬥體適能'
    if (coachProfile?.id === 'got') return '泰拳靶師體能訓練'
    if (coachProfile?.id === 'sim') return '柔道技擊體能訓練'
    if (getCoachPricingTier(coachName, coachProfile) === 'foreign-fighter') {
      return 'MMA 體能打擊訓練'
    }

    return '戰鬥體適能訓練'
  }

  if (coachProfile?.id === 'andre') {
    return '巴西 MMA 打擊訓練'
  }
  if (coachProfile?.id === 'bruno') {
    return '巴西職業 MMA 選手'
  }
  if (coachProfile?.id === 'got') return '泰國職業選手靶師'
  if (coachProfile?.id === 'mario') return '巴西職業 MMA 選手'
  if (coachProfile?.id === 'rafael') return '巴西 MMA 訓練背景'
  if (coachProfile?.id === 'sim') return '柔道隊技擊訓練'
  if (coachProfile?.id === 'mengyan') return '拳擊隊 / 全運會選手'

  return getCoachPricingTier(coachName, coachProfile) === 'foreign-fighter'
    ? '國際格鬥訓練'
    : '團課技擊訓練'
}

function getCourseDecisionSignals(
  course: WeeklyCourse,
  coachProfile: CoachProfile | null,
): CourseDecisionSignal[] {
  return [
    { label: '刺激', value: getCourseStimulusLabel(course) },
    { label: '感受', value: getCourseFeelingLabel(course) },
    { label: '技術', value: getCourseTechniqueLabel(course) },
    {
      label: '風格',
      value: getCourseStyleLabel(course, course.coach, coachProfile),
    },
  ]
}

function getCoachProofTag(
  coachName: string,
  coachProfile: CoachProfile | null,
) {
  if (coachProfile?.id === 'andre') return '世界冠軍教練'
  if (coachProfile?.id === 'bruno') return '職業泰拳 14 勝'
  if (coachProfile?.id === 'got') return '泰拳教師'
  if (coachProfile?.id === 'mario') return '職業 MMA 28 勝'
  if (coachProfile?.id === 'rafael') return '柔術黑帶 4 段'
  if (coachProfile?.id === 'sim') return '技擊教練資格'
  if (coachProfile?.id === 'mengyan') return '拳擊四連霸'

  return getCoachPricingTier(coachName, coachProfile) === 'foreign-fighter'
    ? '國際實戰背景'
    : null
}

function getCoachPreviewTags(
  coachName: string,
  coachProfile: CoachProfile | null,
) {
  if (!coachProfile) return []

  const tagsByCoach: Record<string, string[]> = {
    andre: ['泰拳 / MMA', '泰拳世界冠軍'],
    bruno: ['泰拳 / MMA', '職業泰拳選手'],
    got: ['泰拳 / 踢拳', '職業選手靶師'],
    mario: ['巴西柔術 / MMA', '職業MMA選手'],
    rafael: ['巴柔黑帶4段', '職業MMA選手'],
    sim: ['柔道 / 綜合格鬥', '柔道代表隊教練'],
    mengyan: ['拳擊 / 戰鬥體適能', '大專盃拳擊四連霸'],
  }

  const fallbackTags = [
    coachProfile.specialties[0] ?? coachProfile.role,
    getCoachProofTag(coachName, coachProfile),
  ]

  return Array.from(
    new Set(tagsByCoach[coachProfile.id] ?? fallbackTags),
  )
    .filter((tag): tag is string => Boolean(tag))
    .slice(0, 2)
}

function getCourseLevelTag(course: WeeklyCourse) {
  if (course.name.includes('技巧')) return '需經驗'
  if (course.name.includes('基礎')) return '新手入門'
  if (course.name.includes('體適能') || course.name.includes('戰鬥')) {
    return '高消耗'
  }
  return '新手可上'
}

function getCourseFormatTag(course: WeeklyCourse) {
  if (course.name.includes('拳擊')) return '沙包訓練'
  if (course.name.includes('泰拳') || course.name.includes('踢拳')) {
    return '踢拳訓練'
  }
  return '全身訓練'
}

function getCourseFeatureTags(
  course: WeeklyCourse,
  remaining: number,
  pricingTier: CoachPricingTier,
  coachProfile: CoachProfile | null,
) {
  const tags: string[] = []
  const priceModel = getCoursePriceModel({
    course,
    pricingTier,
    remaining,
    packageSize: 1,
    coachId: coachProfile?.id,
  })

  tags.push(...priceModel.tags, getCourseLevelTag(course), '不對打')
  if (tags.length < 4) tags.push(getCourseFormatTag(course))

  return Array.from(new Set(tags)).slice(0, 4)
}

function getCourseFeatureTagClass(tag: string) {
  if (
    tag === '開放席' ||
    tag === '最後席' ||
    tag === '精選場' ||
    tag === '國際場' ||
    tag === '泰國靶師' ||
    tag === '拳擊冠軍' ||
    tag === FIRST_PURCHASE_OFFER_BADGE
  ) {
    return 'border-blaze/45 bg-blaze/15 text-blaze'
  }
  if (
    tag === '新手入門' ||
    tag === '新手可上' ||
    tag === '不對打' ||
    tag === '日間席'
  ) {
    return 'border-neon/45 bg-neon/12 text-neon'
  }
  if (
    tag === '高消耗' ||
    tag === '高流汗' ||
    tag === '下班場' ||
    tag === '週五場' ||
    tag === '週末場' ||
    tag === '需經驗' ||
    tag === '沙包訓練' ||
    tag === '踢拳訓練' ||
    tag === '全身訓練'
  ) {
    return 'border-blaze/35 bg-blaze/12 text-blaze'
  }
  if (
    tag.includes('拳') ||
    tag.includes('沙包') ||
    tag.includes('倒數') ||
    tag.includes('儀式') ||
    tag.includes('狂喜') ||
    tag.includes('沸騰') ||
    tag.includes('風暴') ||
    tag.includes('夜晚') ||
    tag.includes('入口') ||
    tag.includes('爆汗') ||
    tag.includes('釋放') ||
    tag.includes('放電') ||
    tag.includes('完成') ||
    tag.includes('續航') ||
    tag.includes('養成')
  ) {
    return 'border-blaze/35 bg-blaze/12 text-blaze'
  }
  if (tag === '已售完') {
    return 'border-pearl/15 bg-pearl/5 text-mist/45'
  }
  if (
    tag.includes('冠軍') ||
    tag.includes('勝') ||
    tag.includes('資格') ||
    tag.includes('教師') ||
    tag.includes('黑帶') ||
    tag.includes('四連霸') ||
    tag.includes('實戰')
  ) {
    return 'border-pearl/22 bg-pearl/10 text-pearl/86'
  }
  return 'border-pearl/18 bg-pearl/8 text-pearl/82'
}

function CoachCard({
  coachName,
  profile,
  courseName,
  hintSeen = false,
  onOpen,
}: {
  coachName: string
  profile: CoachProfile | null
  courseName: string
  hintSeen?: boolean
  onOpen: () => void
}) {
  const displayName = profile?.shortName ?? getCoachDisplayName(coachName)
  const initials = displayName.slice(0, 1).toUpperCase()
  const previewTags = getCoachPreviewTags(coachName, profile)

  return (
    <div className="mt-4 border-t border-pearl/10 pt-3">
      <div className="flex items-center gap-3">
        {profile ? (
          <button
            type="button"
            onClick={onOpen}
            data-interaction-hint
            data-interacted={hintSeen ? 'true' : undefined}
            className="coach-avatar-trigger shrink-0 rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/70"
            aria-label={`查看 ${displayName} 教練介紹`}
          >
            <img
              src={profile.photo}
              alt={profile.displayName}
              className="h-11 w-11 rounded-full border border-neon/30 object-cover"
              loading="lazy"
            />
          </button>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pearl/10 bg-pearl/8 font-heading text-base font-black text-mist">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-heading font-semibold leading-snug text-pearl">
            {courseName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="font-heading text-xs font-semibold text-neon/85">
              {displayName} 教練
            </span>
            {previewTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-pearl/10 bg-pearl/5 px-2 py-0.5 text-[10px] leading-snug text-mist/72"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CourseSpecStrip({
  signals,
}: {
  signals: CourseDecisionSignal[]
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-pearl/10 pt-3">
      {signals.map((signal) => (
        <div key={`${signal.label}-${signal.value}`} className="min-w-0">
          <p className="text-[10px] font-heading tracking-[0.16em] text-mist/42">
            {signal.label}
          </p>
          <p className="mt-0.5 text-[11px] font-heading font-semibold leading-snug text-pearl/88">
            {signal.value}
          </p>
        </div>
      ))}
    </div>
  )
}

type CoachProfileDetailTone = 'pearl' | 'neon' | 'blaze'

function CoachProfileDetailList({
  title,
  items,
  tone = 'pearl',
}: {
  title: string
  items?: string[]
  tone?: CoachProfileDetailTone
}) {
  if (!items?.length) return null

  const toneClasses: Record<
    CoachProfileDetailTone,
    { box: string; title: string; dot: string }
  > = {
    pearl: {
      box: 'border-pearl/10 bg-black/22',
      title: 'text-mist/55',
      dot: 'bg-mist/65',
    },
    neon: {
      box: 'border-neon/18 bg-neon/8',
      title: 'text-neon/85',
      dot: 'bg-neon',
    },
    blaze: {
      box: 'border-blaze/20 bg-blaze/10',
      title: 'text-blaze/85',
      dot: 'bg-blaze',
    },
  }
  const classes = toneClasses[tone]

  return (
    <div className={`rounded-2xl border p-4 ${classes.box}`}>
      <p
        className={`text-xs font-heading uppercase tracking-[0.2em] ${classes.title}`}
      >
        {title}
      </p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex gap-2 text-sm leading-relaxed text-mist/78"
          >
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${classes.dot}`}
            />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function isTechniqueTrainingCourse(course?: WeeklyCourse | null) {
  return Boolean(course?.name.includes('技巧'))
}

function getTechniqueTrainingNotice(course: WeeklyCourse) {
  const discipline = course.name.includes('拳擊')
    ? '拳擊'
    : '拳擊、泰拳或踢拳'

  return `這堂是技巧訓練，不是第一次體驗課。請確認你具備 6 個月以上的${discipline}訓練經驗，能跟上基本站姿、防護、出拳／踢擊與教練口令；如果是第一次接觸，建議先從基礎或體適能課開始。`
}

function TechniqueCourseNotice({
  course,
  compact = false,
  className = '',
}: {
  course?: WeeklyCourse | null
  compact?: boolean
  className?: string
}) {
  if (!course || !isTechniqueTrainingCourse(course)) return null

  return (
    <div
      className={`rounded-2xl border border-blaze/35 bg-blaze/10 ${
        compact ? 'p-3' : 'p-4'
      } ${className}`}
    >
      <p className="font-heading text-xs uppercase tracking-[0.2em] text-blaze">
        技巧課參加提醒
      </p>
      <p className="mt-2 text-sm leading-relaxed text-mist/84">
        {getTechniqueTrainingNotice(course)}
      </p>
    </div>
  )
}

function CoachProfileModal({
  coachName,
  profile,
  course,
  onClose,
}: {
  coachName: string
  profile: CoachProfile
  course?: WeeklyCourse | null
  onClose: () => void
}) {
  const displayName = profile.shortName ?? getCoachDisplayName(coachName)

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/78 p-0 backdrop-blur-sm md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${displayName} 教練介紹`}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[100dvh] w-full max-w-2xl overflow-y-auto rounded-none border-y border-pearl/15 bg-abyss shadow-2xl shadow-black/50 md:max-h-[92vh] md:rounded-3xl md:border"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-black">
          <img
            src={profile.photo}
            alt={profile.displayName}
            className="h-full w-full object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/20 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            data-interaction-hint
            className="interaction-hint absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-pearl/15 bg-black/45 font-heading text-lg font-black text-pearl backdrop-blur transition-colors hover:bg-black/65"
            aria-label="關閉教練介紹"
          >
            ×
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="font-heading text-3xl font-black leading-none text-pearl">
              {displayName}
            </h3>
            <p className="mt-2 text-sm font-heading text-mist/78">
              {profile.role}
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5 md:p-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {profile.specialties.map((tag) => (
              <span
                key={tag}
                className="shrink-0 rounded-full border border-neon/20 bg-neon/10 px-3 py-1 text-xs font-heading tracking-wide text-neon/90"
              >
                {tag}
              </span>
            ))}
          </div>

          <TechniqueCourseNotice course={course} />

          <div className="grid gap-3">
            {(profile.bio?.length ? profile.bio : [profile.intro]).map(
              (paragraph) => (
                <p
                  key={paragraph}
                  className="text-base leading-relaxed text-mist/88"
                >
                  {paragraph}
                </p>
              ),
            )}
          </div>

          <div className="rounded-2xl border border-pearl/10 bg-black/25 p-4">
            <p className="text-xs font-heading uppercase tracking-[0.2em] text-mist/55">
              為什麼值得跟他上這堂
            </p>
            <div className="mt-3 grid gap-2">
              {profile.trustPoints.map((point) => (
                <div
                  key={point}
                  className="flex gap-2 text-sm leading-relaxed text-mist/78"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <CoachProfileDetailList
            title="資格證明"
            items={profile.certifications}
            tone="neon"
          />

          <CoachProfileDetailList
            title="教學 / 經歷"
            items={profile.experience}
          />

          <CoachProfileDetailList
            title="比賽成就"
            items={profile.achievements}
            tone="blaze"
          />

          {profile.record && !profile.achievements?.length && (
            <div className="rounded-2xl border border-blaze/20 bg-blaze/10 p-4">
              <p className="text-xs font-heading uppercase tracking-[0.2em] text-blaze/85">
                經歷
              </p>
              <p className="mt-2 text-sm leading-relaxed text-mist/78">
                {profile.record}
              </p>
            </div>
          )}

          <div className="grid gap-3 text-sm text-mist/66">
            {profile.nationality && (
              <p>
                <span className="font-heading text-mist/45">國籍：</span>
                {profile.nationality}
              </p>
            )}
            <p>
              <span className="font-heading text-mist/45">館別：</span>
              {profile.venues.join(' / ')}
            </p>
            {profile.languages && (
              <p>
                <span className="font-heading text-mist/45">語言：</span>
                {profile.languages.join(' / ')}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

type CourseDetailSession = {
  id: string
  date: string
  weekday: string
  startTime: string
}

type CourseDetailPackageOption = {
  packageSize: 1 | 2 | 4
  label: string
  description: string
  priceLabel: string
  compareAtLabel?: string
  value: number
  originalValue?: number
  offerApplied?: boolean
  remaining: number
  series: CourseDetailSession[]
  primary: boolean
}

type SelectedCourseDetail = {
  course: WeeklyCourse
  activeCategory: CourseCategory
  productTitle: string
  featureTags: string[]
  routeLabel: string | null
  routeBadge: string | null
  routeSkills: string[]
  routeLesson: string | null
  coachProfile: CoachProfile | null
  coachProofTag: string | null
  coachDisplayName: string
  pricingTier: CoachPricingTier
  dateLabel: string
  timeLabel: string
  venueLabel: string
  sessionTitle: string
  remaining: number
  decisionSignals: CourseDecisionSignal[]
  packageOptions: CourseDetailPackageOption[]
  isPurchaseLocked: boolean
  lockedPurchaseCtaLabel?: string
  lockedPurchaseNote?: string
}

function getCourseDisciplineLabel(course: WeeklyCourse) {
  if (course.name.includes('泰拳')) return '泰拳'
  if (course.name.includes('踢拳')) return '踢拳'
  if (course.name.includes('拳擊')) return '拳擊'
  if (course.name.includes('綜合格鬥')) return '綜合格鬥'
  return '格鬥體能'
}

function getCourseDetailExperienceLead(
  course: WeeklyCourse,
  activeCategory: CourseCategory,
) {
  const isBootCamp = activeCategory === 'BOOT_CAMP'

  if (isBootCamp) {
    if (course.name.includes('拳擊')) {
      return '固定回到同一個時段，把拳套落在沙包上的觸感留下來，讓站姿、出拳、呼吸和沙包悶響慢慢變成熟悉的身體記憶。'
    }
    if (course.name.includes('泰拳') || course.name.includes('踢拳')) {
      return '建立習慣，每週回到同一個節奏裡。拳、踢、重心和吐氣會一點一點變熟，讓身體記得那個被點燃的狀態。'
    }
    return '替自己保留一段會固定發生的身體記憶。你只要出現，教練口令、回合和旁邊的人會把你帶回場裡。'
  }

  if (course.name.includes('基礎拳擊')) {
    return '你不用一進場就證明自己。先把緊張交給教練，把注意力放回呼吸、拳套和眼前的黑色沙包。'
  }

  if (course.name.includes('拳擊體適能')) {
    return '把拳套戴好，先不用想自己能不能撐完。教練會把出拳、沙包和體能回合編成一段可以跟上的壓力釋放。'
  }

  if (course.name.includes('基礎泰拳')) {
    return '不用先把拳、踢、膝學會才敢進來。你會先跟上節奏，再讓重心、吐氣和沙包聲把身體一段段喚醒。'
  }

  if (course.name.includes('基礎踢拳')) {
    return '第一組踢拳先讓身體進入節奏。你會從跟動作，慢慢變成跟呼吸、跟口令、跟全場一起往前。'
  }

  if (course.name.includes('泰拳體適能')) {
    return '拳、踢、膝、沙包和倒數會一段段堆起來。你只要跟著現場往前，讓身體把壓力一層層放掉。'
  }

  if (course.name.includes('踢拳體適能')) {
    return '這堂會先讓你跟上，然後慢慢把你帶走。踢拳落下、腳步移動、口令加速，日常感會被一層一層剝掉。'
  }

  if (course.name.includes('戰鬥體適能')) {
    return '你不用獨自靠意志力撐完。體能、拳擊、倒數和全場氣氛會把你一起推進那段最累、也最清醒的高點。'
  }

  return '這堂不是只把動作做完，而是把注意力、呼吸和力氣交給現場，讓身體暫時離開普通的一天。'
}

function getCourseExperienceMoments(
  course: WeeklyCourse,
  activeCategory: CourseCategory,
) {
  if (activeCategory === 'BOOT_CAMP') {
    return [
      {
        title: '先把時間留住',
        body: '把接下來的課先排好，到了那天不需要再和自己討價還價，只要走進場裡。',
      },
      {
        title: '讓身體認得節奏',
        body: '第一堂還在找呼吸，下一堂開始記得站姿、出拳和沙包聲。',
      },
      {
        title: '每週回到同一個場',
        body: '教練口令、回合和旁邊的人會把你帶回那個狀態，讓熱血慢慢變成習慣。',
      },
      {
        title: '完成感留下來',
        body: '留下來的不只是課程次數，而是一段固定會發生的身體記憶。',
      },
    ]
  }

  if (course.name.includes('泰拳') || course.name.includes('踢拳')) {
    return [
      {
        title: '先進入節奏',
        body: '教練會把第一組動作拆到能跟上，讓緊張先有地方放。',
      },
      {
        title: '重心開始醒來',
        body: '轉髖、吐氣、踢擊落下，身體會從試探變成投入。',
      },
      {
        title: '全場把你推高',
        body: '口令加速、倒數靠近，旁邊的人會把你帶過最想停下來的那一下。',
      },
      {
        title: '熱留在身上',
        body: '最後一輪結束後，喘息慢慢沉下來，你會知道自己真的完成了一段。',
      },
    ]
  }

  return [
    {
      title: '口令先接住你',
      body: '站姿、手位和第一下出拳會被拆成能跟上的節奏，身體先進入狀態。',
    },
    {
      title: '沙包聲把雜訊蓋掉',
      body: '拳套落下的悶響會把注意力從腦袋拉回身體，力氣開始有地方釋放。',
    },
    {
      title: '回合把全場拉在一起',
      body: '越累的時候，教練的倒數和身旁的人會讓你少想一點，再多做一下。',
    },
    {
      title: '最後 60 秒留下來',
      body: '結束後有幾秒安靜，身體還在發熱，壓力像被留在場裡。',
    },
  ]
}

function getCourseDetailCopy(
  course: WeeklyCourse,
  activeCategory: CourseCategory,
  coachProfile: CoachProfile | null,
) {
  const isBootCamp = activeCategory === 'BOOT_CAMP'
  const isBasic = course.name.includes('基礎')
  const isTechnique = course.name.includes('技巧')
  const isConditioning =
    course.name.includes('體適能') || course.name.includes('戰鬥')
  const discipline = getCourseDisciplineLabel(course)
  const merchandising = getCourseMerchandisingCopy(
    course,
    activeCategory,
    coachProfile,
  )
  const benefit = merchandising.desire
  const safetyLine =
    '不對打、不被打，教練會用口令、沙包和動作回合帶著你做。'

  const intro = getCourseDetailExperienceLead(course, activeCategory)
  const experienceMoments = getCourseExperienceMoments(course, activeCategory)

  const bestFor = isTechnique
    ? [
        `已經上過 ${discipline}，想把動作做得更清楚`,
        '想把出力變成更穩的站姿、回防、距離和節奏',
        '想固定幾週，把原本會做的動作磨成更可靠的身體反應',
      ]
    : [
        `第一次想試 ${discipline}，希望教練一步一步帶`,
        isBasic
          ? '怕一開始跟不上，想先從基本動作開始'
          : '平常運動不夠過癮，想要更有節奏、更會流汗',
        isBootCamp
          ? '想先把接下來幾週的運動時間排好'
          : '想先買一堂，讓今晚或這週真的有一個出口',
      ]

  const prep = [
    '穿著方便流汗的衣服與運動鞋',
    '建議提前 10 分鐘到場',
    '報到時告知姓名與課程時間',
  ]

  const venueServices = [
    {
      title: '智能置物櫃',
      body: '感應式手環開關，免自備鎖頭。',
    },
    {
      title: 'UFC GYM 大毛巾',
      body: '現場提供專屬運動毛巾，流汗後可以直接使用。',
    },
    {
      title: 'SPA 沐浴備品',
      body: '淋浴間備有星級酒店御用 SPA 沐浴用品，課後可以整理好再離開。',
    },
  ]

  const reassurance = isTechnique
    ? [
        `這堂適合已有 6 個月以上 ${discipline} 經驗的人`,
        safetyLine,
        '教練會修細節，但不會從零開始教基本動作',
      ]
    : [
        '不需要先有拳擊或泰拳基礎',
        safetyLine,
        isConditioning ? '強度會累，但不是技術考試' : '從能跟上的動作開始',
      ]

  const buyingQuestions = [
    {
      question: '我沒有經驗可以嗎？',
      answer: isTechnique
        ? '不建議。技巧課需要至少 6 個月以上拳擊或泰拳經驗；如果是第一次接觸，建議先從基礎或體適能課開始。'
        : isBasic
          ? '可以。這堂會從基本動作開始，教練會拆小步驟帶。'
          : '可以。跟著口令與回合做，現場會依程度調整強度。',
    },
    {
      question: '會不會對打？',
      answer: '不對打、不被打，主要是沙包、動作和體能回合。',
    },
    {
      question: '需要先買裝備嗎？',
      answer:
        '不用先買拳套。穿適合流汗的運動服與運動鞋，帶水與替換衣物；拳套可依現場方案租用或自備。',
    },
  ]

  return {
    intro,
    benefit,
    safetyLine,
    coachHook: merchandising.coachHook,
    experienceMoments,
    bestFor,
    prep,
    venueServices,
    reassurance,
    buyingQuestions,
  }
}

function CourseDetailModal({
  detail,
  onClose,
  onPurchase,
  onOpenCoach,
}: {
  detail: SelectedCourseDetail
  onClose: () => void
  onPurchase: (option: CourseDetailPackageOption) => void
  onOpenCoach: () => void
}) {
  const copy = getCourseDetailCopy(
    detail.course,
    detail.activeCategory,
    detail.coachProfile,
  )
  const hasCoachProfile = Boolean(detail.coachProfile)
  const availableOptions = detail.packageOptions.filter(
    (option) => option.remaining > 0,
  )
  const primaryOption =
    availableOptions.find((option) => option.primary) ??
    availableOptions[0] ??
    detail.packageOptions[0] ??
    null
  const isBootCampDetail = detail.activeCategory === 'BOOT_CAMP'
  const reserveLabel =
    isBootCampDetail ? '保留這組日期' : '保留這堂'
  const getPurchaseButtonLabel = (option: CourseDetailPackageOption) => {
    if (detail.isPurchaseLocked) return detail.lockedPurchaseCtaLabel ?? '查看可訂場次'
    if (option.offerApplied) return `使用首購半價保留這堂 · ${option.priceLabel}`
    return `${reserveLabel} · ${option.priceLabel}`
  }
  const reservationLine = shouldShowRemainingBadge(detail.remaining)
    ? `${getRemainingLabel(detail.remaining)} · ${detail.dateLabel} ${detail.timeLabel}`
    : `${detail.dateLabel} ${detail.timeLabel}`
  const showPackageOptions =
    detail.activeCategory === 'BOOT_CAMP' || detail.packageOptions.length > 1

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/78 p-0 backdrop-blur-sm md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${detail.productTitle} 下單前確認`}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[100dvh] w-full max-w-5xl overflow-y-auto rounded-none border-y border-pearl/15 bg-abyss shadow-2xl shadow-black/50 md:max-h-[92vh] md:rounded-3xl md:border"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-pearl/10 bg-abyss/95 px-4 py-3 backdrop-blur md:px-6">
          <div>
            <p className="text-[10px] font-heading uppercase tracking-[0.24em] text-neon/80">
              下單前確認
            </p>
            <p className="mt-0.5 text-xs text-mist/55">
              {detail.dateLabel} · {detail.timeLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-interaction-hint
            className="interaction-hint flex h-10 w-10 items-center justify-center rounded-full border border-pearl/15 bg-black/35 font-heading text-lg font-black text-pearl transition-colors hover:bg-black/55"
            aria-label="關閉課程介紹"
          >
            ×
          </button>
        </div>

        <div className="grid gap-5 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5">
            <TechniqueCourseNotice course={detail.course} />

            <div className="rounded-2xl border border-blaze/24 bg-blaze/10 p-5 md:p-6">
              <p className="text-xs font-heading uppercase tracking-[0.2em] text-neon">
                課程介紹
              </p>
              <p className="mt-3 text-base leading-relaxed text-mist/86 md:text-lg">
                {copy.intro}
              </p>
              <ol className="mt-5 space-y-3">
                {copy.experienceMoments.map((moment, index) => (
                  <li
                    key={moment.title}
                    className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-xl border border-pearl/10 bg-black/24 p-3"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-neon/25 bg-neon/10 font-heading text-xs font-black text-neon">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>
                      <span className="block font-heading text-sm font-black text-pearl">
                        {moment.title}
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-mist/78">
                        {moment.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-neon/18 bg-neon/8 p-4 md:p-5">
              <p className="text-xs font-heading uppercase tracking-[0.2em] text-neon">
                購買前先確認
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {copy.buyingQuestions.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-xl border border-pearl/10 bg-black/22 p-3"
                  >
                    <p className="font-heading text-sm font-black text-pearl">
                      {item.question}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-mist/78">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-pearl/10 bg-black/25 p-4 md:p-5">
              <p className="text-xs font-heading uppercase tracking-[0.2em] text-mist/55">
                場館服務與備品
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {copy.venueServices.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-pearl/10 bg-pearl/[0.035] p-3"
                  >
                    <p className="font-heading text-sm font-black text-pearl">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-mist/74">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-pearl/10 bg-black/25 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-heading text-xl font-black text-pearl">
                    {detail.coachDisplayName}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-mist/68">
                    {copy.coachHook}
                  </p>
                </div>
                {hasCoachProfile && (
                  <button
                    type="button"
                    onClick={onOpenCoach}
                    data-interaction-hint
                    className="interaction-hint rounded-full border border-neon/30 bg-neon/10 px-4 py-2 text-sm font-heading font-bold text-neon transition-colors hover:border-neon/50 hover:bg-neon/15"
                  >
                    看教練介紹
                  </button>
                )}
              </div>
            </div>

            {(detail.routeLesson || detail.routeSkills.length > 0) && (
              <div className="rounded-2xl border border-neon/16 bg-neon/6 p-4">
                <p className="text-xs font-heading uppercase tracking-[0.2em] text-neon">
                  {detail.routeLabel ?? '課程重點'}
                </p>
                {detail.routeLesson && (
                  <p className="mt-2 font-heading text-lg font-black leading-snug text-pearl">
                    {detail.routeLesson}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.routeSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-pearl/10 bg-pearl/5 px-2.5 py-1 text-xs text-mist/76"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-pearl/10 bg-black/25 p-4">
              <p className="text-xs font-heading uppercase tracking-[0.2em] text-mist/55">
                第一次來，先知道這些
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {copy.prep.map((item) => (
                  <p key={item} className="text-sm leading-relaxed text-mist/78">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-blaze/30 bg-blaze/10 p-4 md:p-5 lg:sticky lg:top-20">
            {!isBootCampDetail && (
              <>
                <p className="text-xs font-heading uppercase tracking-[0.2em] text-blaze">
                  {reserveLabel}
                </p>
                <p className="mt-2 font-heading text-2xl font-black text-pearl">
                  {primaryOption?.priceLabel ?? '已售完'}
                </p>
                {primaryOption?.compareAtLabel && (
                  <p className="mt-0.5 text-xs text-mist/55">
                    一般{' '}
                    <span className="line-through">
                      {primaryOption.compareAtLabel}
                    </span>
                  </p>
                )}
                <p className="mt-1 text-sm text-mist/68">{reservationLine}</p>

                {primaryOption && primaryOption.remaining > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onPurchase(primaryOption)}
                      data-interaction-hint
                      className="interaction-hint mt-4 w-full rounded-xl bg-blaze px-4 py-3 text-sm font-heading font-black text-abyss transition-colors hover:bg-pearl"
                    >
                      {getPurchaseButtonLabel(primaryOption)}
                    </button>
                    {detail.isPurchaseLocked && detail.lockedPurchaseNote && (
                      <p className="mt-3 text-center text-xs leading-relaxed text-mist/55">
                        {detail.lockedPurchaseNote}
                      </p>
                    )}
                  </>
                ) : (
                  <DisabledCta className="mt-4">這堂已售完</DisabledCta>
                )}
              </>
            )}

            {showPackageOptions && (
              <div
                className={
                  isBootCampDetail ? '' : 'mt-5 border-t border-pearl/10 pt-4'
                }
              >
                <p className="text-xs font-heading uppercase tracking-[0.18em] text-mist/55">
                  選擇堂數
                </p>
                <div className="mt-3 grid gap-2">
                  {detail.packageOptions.map((option) => {
                    const soldOut = option.remaining <= 0
                    return (
                      <button
                        key={option.packageSize}
                        type="button"
                        disabled={soldOut}
                        onClick={() => onPurchase(option)}
                        data-interaction-hint={soldOut ? undefined : true}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          soldOut ? '' : 'interaction-hint'
                        } ${
                          option.primary
                            ? 'border-blaze/45 bg-blaze/15'
                            : 'border-neon/25 bg-neon/10'
                        } ${
                          soldOut
                            ? 'cursor-not-allowed opacity-45'
                            : 'hover:border-pearl/35'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-heading text-base font-black text-pearl">
                              {option.label}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-mist/62">
                              {option.description}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-heading text-sm font-black text-neon">
                              {option.priceLabel}
                            </p>
                            {option.compareAtLabel && (
                              <p className="mt-0.5 text-[11px] text-mist/45">
                                一般{' '}
                                <span className="line-through">
                                  {option.compareAtLabel}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        {(soldOut || shouldShowRemainingBadge(option.remaining)) && (
                          <p className="mt-2 text-xs text-mist/58">
                            {soldOut
                              ? '已售完'
                              : getRemainingLabel(option.remaining)}
                          </p>
                        )}
                        {option.series.length > 1 && (
                          <div className="mt-3 grid gap-1.5">
                            {option.series.map((session, index) => (
                              <div
                                key={session.id}
                                className="flex items-center justify-between rounded-lg bg-black/22 px-2.5 py-1.5 text-xs"
                              >
                                <span className="font-heading text-mist/52">
                                  第 {index + 1} 堂
                                </span>
                                <span className="font-heading text-pearl/82 tabular-nums">
                                  {formatShortDate(session.date)} 週
                                  {session.weekday} {session.startTime}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {option.offerApplied && (
                          <p className="mt-2 text-xs font-heading text-blaze">
                            618 年中慶首購半價已套用
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {availableOptions.length === 0 && (
              <p className="mt-4 rounded-xl border border-pearl/10 bg-black/25 px-4 py-3 text-sm text-mist/58">
                這堂目前已售完，可以回到課表選其他日期或場館。
              </p>
            )}
          </aside>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

type CheckoutBuyer = {
  name: string
  phone: string
  email: string
}

function normalizeTaiwanMobilePhone(value: string) {
  const raw = value.trim()
  if (!raw || !/^[\d+\s().-]+$/.test(raw)) return null

  const plusMatches = raw.match(/\+/g)
  if ((plusMatches?.length ?? 0) > 1 || (raw.includes('+') && !raw.startsWith('+'))) {
    return null
  }

  const digits = raw.replace(/\D/g, '')
  let nationalNumber = ''
  if (digits.startsWith('886')) {
    nationalNumber = digits.slice(3)
  } else if (digits.startsWith('0')) {
    nationalNumber = digits.slice(1)
  } else {
    return null
  }

  if (!/^9\d{8}$/.test(nationalNumber)) return null
  return `+886${nationalNumber}`
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : ''
}

function buildFacebookClickCookie() {
  if (typeof window === 'undefined') return ''
  const fbclid = new URLSearchParams(window.location.search).get('fbclid')
  if (!fbclid) return ''
  return `fb.1.${Date.now()}.${fbclid}`
}

function getCheckoutTrackingContext() {
  if (typeof window === 'undefined') return {}

  return {
    fbp: readCookie('_fbp'),
    fbc: readCookie('_fbc') || buildFacebookClickCookie(),
    sourceUrl: window.location.href,
    referrer: document.referrer,
  }
}

type PendingCheckout = {
  course: WeeklyCourse
  packageSize: 1 | 2 | 4
  remaining: number
  value: number
  originalValue?: number
  offerApplied?: boolean
  pricingTier: CoachPricingTier
  sessionIds: string[]
  seriesDates: string[]
  route: BootCampRoute | null
}

function CheckoutContactModal({
  pending,
  error,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  pending: PendingCheckout
  error: string | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (buyer: CheckoutBuyer) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const packageLabel =
    pending.course.category === 'BOOT_CAMP'
      ? `${pending.packageSize} 堂 Boot Camp`
      : 'Fight Night Pass'
  const routeLabel = pending.route
    ? bootCampRouteContent[pending.route].shortLabel
    : null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    })
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/78 p-0 backdrop-blur-sm md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="SHOPLINE 付款資訊"
      onClick={isSubmitting ? undefined : onClose}
    >
      <motion.form
        className="w-full max-w-lg rounded-none border-y border-pearl/15 bg-abyss p-5 shadow-2xl shadow-black/50 md:rounded-3xl md:border md:p-6"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.24em] text-neon/80">
              SHOPLINE CHECKOUT
            </p>
            <h3 className="mt-2 font-heading text-2xl font-black leading-tight text-pearl">
              確認付款資訊
            </h3>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            data-interaction-hint
            className="interaction-hint flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pearl/15 bg-black/35 font-heading text-lg font-black text-pearl transition-colors hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="關閉付款資訊"
          >
            ×
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-neon/15 bg-neon/8 p-4">
          <p className="font-heading text-sm font-black text-pearl">
            {packageLabel}
            {routeLabel ? ` · ${routeLabel}` : ''}
          </p>
          <p className="mt-1 text-sm text-mist/70">
            {pending.course.venueName} · {formatShortDate(pending.course.date)} 週
            {pending.course.weekday} {pending.course.startTime}
          </p>
          <p className="mt-2 font-heading text-lg font-black text-neon">
            {pending.offerApplied ? '618 首購半價 ' : ''}
            NT${pending.value.toLocaleString('en-US')}
          </p>
          {pending.offerApplied && pending.originalValue && (
            <p className="mt-0.5 text-xs text-mist/55">
              一般{' '}
              <span className="line-through">
                NT${pending.originalValue.toLocaleString('en-US')}
              </span>
            </p>
          )}
        </div>

        <TechniqueCourseNotice course={pending.course} compact className="mt-3" />

        <div className="mt-5 grid gap-3">
          <label className="grid gap-1.5 text-sm font-heading text-mist/72">
            姓名
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              className="rounded-xl border border-pearl/12 bg-black/35 px-4 py-3 text-base text-pearl outline-none transition-colors placeholder:text-mist/35 focus:border-neon/45"
              placeholder="王小明"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-heading text-mist/72">
            手機
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              inputMode="tel"
              autoComplete="tel"
              maxLength={24}
              className="rounded-xl border border-pearl/12 bg-black/35 px-4 py-3 text-base text-pearl outline-none transition-colors placeholder:text-mist/35 focus:border-neon/45"
              placeholder="0912345678"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-heading text-mist/72">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              className="rounded-xl border border-pearl/12 bg-black/35 px-4 py-3 text-base text-pearl outline-none transition-colors placeholder:text-mist/35 focus:border-neon/45"
              placeholder="name@example.com"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-blaze/30 bg-blaze/10 px-4 py-3 text-sm leading-relaxed text-blaze">
            {error}
          </p>
        )}

        <Button
          className="mt-5 w-full"
          size="lg"
          type="submit"
          disabled={isSubmitting}
          data-cta="shopline-checkout-submit"
        >
          {isSubmitting ? '建立付款中...' : '前往 SHOPLINE 付款'}
        </Button>
      </motion.form>
    </motion.div>,
    document.body,
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
  displayLimit?: number
  featuredCourseNames?: string[]
  isPurchaseLocked?: boolean
  lockedPurchaseCtaLabel?: string
  lockedPurchaseNote?: string
  onLockedPurchase?: () => void
  firstPurchaseOfferEligible?: boolean
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
  displayLimit = SCHEDULE_DISPLAY_LIMIT,
  featuredCourseNames = EMPTY_FEATURED_COURSE_NAMES,
  isPurchaseLocked = false,
  lockedPurchaseCtaLabel = '查看首購半價與可訂場次',
  lockedPurchaseNote,
  onLockedPurchase,
  firstPurchaseOfferEligible = false,
}: Props = {}) {
  const { track, trackCoursePurchaseClick } = useTracking()
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
  const [hasTouchedVenueFilter, setHasTouchedVenueFilter] = useState(false)
  const [activeDateIso, setActiveDateIso] = useState<string | null>(null)
  const [selectedCoach, setSelectedCoach] = useState<{
    coachName: string
    profile: CoachProfile
    course?: WeeklyCourse
  } | null>(null)
  const [selectedCourseDetail, setSelectedCourseDetail] =
    useState<SelectedCourseDetail | null>(null)
  const [pendingCheckout, setPendingCheckout] =
    useState<PendingCheckout | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false)
  const [interactionHintSeen, setInteractionHintSeen] =
    useState<InteractionHintSeenState>(getInitialInteractionHintSeen)
  const isBootCampBookingMode =
    bookingMode === 'bootcamp' && activeCategory === 'BOOT_CAMP'

  const interactionHintSeenSets = useMemo(
    () => ({
      coaches: new Set(interactionHintSeen.coaches),
      courses: new Set(interactionHintSeen.courses),
    }),
    [interactionHintSeen],
  )

  const markInteractionHintSeen = useCallback(
    (type: keyof InteractionHintSeenState, key: string) => {
      setInteractionHintSeen((current) => {
        if (current[type].includes(key)) return current
        const next = {
          ...current,
          [type]: [...current[type], key],
        }
        writeInteractionHintSeen(next)
        return next
      })
    },
    [],
  )

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
      if (!isWeeklyCourseAvailableForCategory(course, activeCategory)) {
        continue
      }

      const categorizedCourse = getWeeklyCourseForCategory(course, activeCategory)
      const upcomingOccurrences = isBootCampBookingMode
        ? getUpcomingWeeklyOccurrences(
            categorizedCourse,
            bookableFromIso,
            BOOT_CAMP_START_DATE_WEEKS,
          )
        : [getNextWeeklyOccurrence(categorizedCourse, bookableFromIso)]

      for (const nextCourse of upcomingOccurrences) {
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
    }

    return Array.from(courseBySlot.values())
      .filter(
        (c) =>
          c.category === activeCategory &&
          c.date >= bookableFromIso &&
          isWeeklyCourseAvailableForCategory(c, activeCategory),
      )
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1
        if (a.startTime !== b.startTime)
          return a.startTime < b.startTime ? -1 : 1
        return sortByVenueThenName(a, b)
      })
  }, [activeCategory, bookableFromIso, isBootCampBookingMode])

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

    return prioritizeFeaturedCourses(dateFilteredCourses, featuredCourseNames).slice(
      0,
      displayLimit,
    )
  }, [
    activeDateIso,
    displayLimit,
    featuredCourseNames,
    isBootCampBookingMode,
    venueFilteredCourses,
  ])

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

  const buildCourseTrackingParams = useCallback(
    (
      course: WeeklyCourse,
      packageSize: 1 | 2 | 4,
      remaining: number,
      value: number,
      pricingTier: CoachPricingTier,
    ) => ({
      course_id: course.id,
      course_name: course.name,
      category: course.category,
      venue_id: course.venueId,
      venue_name: course.venueName,
      date: course.date,
      start_time: course.startTime,
      coach: course.coach,
      coach_pricing_tier: pricingTier,
      package_size: packageSize,
      value,
      currency: 'TWD' as const,
      remaining,
      route: getBootCampRoute(course) ?? 'none',
      booking_mode: bookingMode,
      has_live_data: hasLiveData,
    }),
    [bookingMode, hasLiveData],
  )

  const trackCoursePurchase = useCallback(
    (
      course: WeeklyCourse,
      packageSize: 1 | 2 | 4,
      remaining: number,
      value: number,
      pricingTier: CoachPricingTier,
      originalValue?: number,
      offerApplied?: boolean,
    ) => {
      trackCoursePurchaseClick({
        ...buildCourseTrackingParams(
          course,
          packageSize,
          remaining,
          value,
          pricingTier,
        ),
        original_value: originalValue,
        discount_code: offerApplied ? '618_MIDYEAR_FIRST_PURCHASE_HALF' : undefined,
        discount_label: offerApplied ? '618 首購半價' : undefined,
      })
    },
    [buildCourseTrackingParams, trackCoursePurchaseClick],
  )

  const openShoplineCheckout = useCallback(
    (
      course: WeeklyCourse,
      packageSize: 1 | 2 | 4,
      remaining: number,
      value: number,
      pricingTier: CoachPricingTier,
      originalValue?: number,
      offerApplied?: boolean,
    ) => {
      if (isPurchaseLocked) {
        onLockedPurchase?.()
        return
      }

      const series =
        packageSize === 1
          ? [
              {
                id: getSessionInventoryId(course),
                date: course.date,
              },
            ]
          : getBootCampSeries(course, packageSize)

      setCheckoutError(null)
      setPendingCheckout({
        course,
        packageSize,
        remaining,
        value,
        originalValue,
        offerApplied,
        pricingTier,
        sessionIds: series.map((session) => session.id),
        seriesDates: series.map((session) => session.date),
        route: getBootCampRoute(course),
      })
      trackCoursePurchase(
        course,
        packageSize,
        remaining,
        value,
        pricingTier,
        originalValue,
        offerApplied,
      )
    },
    [isPurchaseLocked, onLockedPurchase, trackCoursePurchase],
  )

  const submitShoplineCheckout = useCallback(
    async (buyer: CheckoutBuyer) => {
      if (!pendingCheckout) return

      const normalizedPhone = normalizeTaiwanMobilePhone(buyer.phone)
      if (!normalizedPhone) {
        setCheckoutError('請輸入有效的台灣手機號碼。')
        return
      }

      setIsCheckoutSubmitting(true)
      setCheckoutError(null)

      try {
        const response = await fetch('/api/shopline/checkout-session', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            buyer: {
              ...buyer,
              phone: normalizedPhone,
            },
            lineContext: getLineRequestContext(),
            course: pendingCheckout.course,
            packageSize: pendingCheckout.packageSize,
            quotedAmountValue: pendingCheckout.value,
            quotedOriginalAmountValue: pendingCheckout.originalValue,
            requestedOfferCode: pendingCheckout.offerApplied
              ? '618_MIDYEAR_FIRST_PURCHASE_HALF'
              : undefined,
            route: pendingCheckout.route,
            sessionIds: pendingCheckout.sessionIds,
            seriesDates: pendingCheckout.seriesDates,
            client: {
              screenWidth: String(window.screen.width),
              screenHeight: String(window.screen.height),
              timeZoneOffset: String(new Date().getTimezoneOffset()),
              transactionWebSite: window.location.origin,
              userAgent: window.navigator.userAgent,
              language: window.navigator.language,
              colorDepth: String(window.screen.colorDepth),
            },
            tracking: getCheckoutTrackingContext(),
            sourcePath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
          }),
        })

        const data = (await response.json().catch(() => null)) as
          | { referenceId?: string; sessionUrl?: string; error?: string }
          | null

        if (!response.ok || !data?.sessionUrl) {
          throw new Error(data?.error || 'SHOPLINE 付款建立失敗，請稍後再試。')
        }

        track({
          event: 'shopline_checkout_submit',
          params: {
            ...buildCourseTrackingParams(
              pendingCheckout.course,
              pendingCheckout.packageSize,
              pendingCheckout.remaining,
              pendingCheckout.value,
              pendingCheckout.pricingTier,
            ),
            original_value: pendingCheckout.originalValue,
            discount_code: pendingCheckout.offerApplied
              ? '618_MIDYEAR_FIRST_PURCHASE_HALF'
              : undefined,
            discount_label: pendingCheckout.offerApplied
              ? '618 首購半價'
              : undefined,
            reference_id: data.referenceId,
          },
          metaStandardEvent: 'InitiateCheckout',
          lineEventName: 'CheckoutSubmit',
        })

        window.location.href = data.sessionUrl
      } catch (error) {
        setCheckoutError(
          error instanceof Error
            ? error.message
            : 'SHOPLINE 付款建立失敗，請稍後再試。',
        )
        setIsCheckoutSubmitting(false)
      }
    },
    [buildCourseTrackingParams, pendingCheckout, track],
  )

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
    setHasTouchedVenueFilter(false)
  }, [activeCategory, activeBootCampRoute, isBootCampBookingMode])

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
    setSelectedCoach(null)
    setSelectedCourseDetail(null)
  }, [activeCategory, activeBootCampRoute, activeVenueId, activeDateIso])

  useEffect(() => {
    if (!selectedCoach && !selectedCourseDetail) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (selectedCourseDetail) setSelectedCourseDetail(null)
      else setSelectedCoach(null)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedCoach, selectedCourseDetail])

  useEffect(() => {
    if (!activeBootCampRoute) return
    const stillAvailable = routeOptions.some(
      (option) => option.route === activeBootCampRoute,
    )
    if (!stillAvailable) setActiveBootCampRoute(null)
  }, [activeBootCampRoute, routeOptions, setActiveBootCampRoute])

  const meta = categoryMeta[activeCategory]
  const venueSelectionPending =
    showVenueFilter && upcomingCourses.length > 0 && !hasTouchedVenueFilter
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
                data-interaction-hint
                className={`interaction-hint px-5 py-2.5 rounded-full text-sm md:text-base font-heading font-semibold tracking-[0.15em] transition-colors border ${
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
          <div
            className={`relative mb-5 overflow-hidden rounded-2xl border bg-black/25 p-4 transition-all duration-300 md:mb-6 md:p-5 ${
              hasTouchedVenueFilter
                ? 'border-pearl/10'
                : 'venue-step-focus border-neon/35 shadow-[0_0_0_1px_rgba(191,90,242,0.12),0_22px_70px_rgba(191,90,242,0.10)]'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs md:text-sm font-heading tracking-[0.22em] text-neon/80 uppercase">
                1 選上課地點
              </p>
              <p className="text-xs text-mist/55">
                只看你方便到場的館別
              </p>
            </div>

            <div
              data-swipe-hint={isBootCampBookingMode ? true : undefined}
              className={`mt-3 gap-2 ${
                isBootCampBookingMode
                  ? 'swipe-hint -mx-1 flex snap-x overflow-x-auto px-1 pb-1'
                  : 'grid grid-cols-1 md:grid-cols-4'
              }`}
            >
              <button
                type="button"
                aria-pressed={hasTouchedVenueFilter && activeVenueId === null}
                onClick={() => {
                  setHasTouchedVenueFilter(true)
                  setActiveVenueId(null)
                }}
                className={`relative min-h-[5.75rem] overflow-hidden rounded-xl border px-3.5 py-3 text-left transition-all duration-300 ${
                  isBootCampBookingMode ? 'min-w-[8.5rem] snap-start' : ''
                } ${
                  hasTouchedVenueFilter && activeVenueId === null
                    ? 'venue-option-selected border-neon/60 bg-neon/15 shadow-[0_0_30px_rgba(191,90,242,0.16)]'
                    : hasTouchedVenueFilter
                    ? 'border-pearl/10 bg-black/25 hover:border-pearl/25 hover:bg-pearl/5'
                    : 'venue-option-pending border-pearl/14 bg-black/32 hover:border-neon/35 hover:bg-neon/8'
                }`}
              >
                <p className="text-sm font-heading font-semibold text-pearl">
                  全部場館
                </p>
                <p className="venue-location-chip mt-2 inline-flex w-fit items-center rounded-full border border-pearl/10 bg-pearl/[0.04] px-2.5 py-1 text-xs text-mist/75">
                  {upcomingCourses.length} 場可購買
                </p>
              </button>

              {venueOptions.map(({ venue, count }) => {
                const active =
                  hasTouchedVenueFilter && activeVenueId === venue.id

                return (
                <button
                  key={venue.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setHasTouchedVenueFilter(true)
                    setActiveVenueId(venue.id)
                  }}
                  className={`relative min-h-[5.75rem] overflow-hidden rounded-xl border px-3.5 py-3 text-left transition-all duration-300 ${
                    isBootCampBookingMode ? 'min-w-[9.5rem] snap-start' : ''
                  } ${
                    active
                      ? 'venue-option-selected border-neon/60 bg-neon/15 shadow-[0_0_30px_rgba(191,90,242,0.16)]'
                      : hasTouchedVenueFilter
                      ? 'border-pearl/10 bg-black/25 hover:border-pearl/25 hover:bg-pearl/5'
                      : 'venue-option-pending border-pearl/14 bg-black/32 hover:border-neon/35 hover:bg-neon/8'
                  }`}
                >
                  <p className="text-sm font-heading font-semibold text-pearl">
                    {venueShortLookup[venue.id] ?? venue.name}
                  </p>
                  <p
                    className={`venue-location-chip mt-2 inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs ${
                      active
                        ? 'border-neon/30 bg-neon/10 text-neon'
                        : 'border-pearl/10 bg-pearl/[0.04] text-mist/75'
                    }`}
                  >
                    {venueLandmarks[venue.id] ?? venue.transit} · {count} 場可購買
                  </p>
                </button>
                )
              })}
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
                未來 6 週可選
              </p>
            </div>

            <div
              data-swipe-hint
              className="swipe-hint -mx-1 mt-3 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
            >
              {dateOptions.map((option) => {
                const active = option.date === activeDateIso
                const relativeLabel = getRelativeDayLabel(option.date, todayIso)

                return (
                  <button
                    key={option.date}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveDateIso(option.date)}
                    data-interaction-hint
                    className={`interaction-hint min-w-[5.75rem] snap-start rounded-xl border px-3 py-3 text-left transition-colors ${
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
                      data-interaction-hint
                      className={`interaction-hint rounded-xl border px-3.5 py-3 text-left transition-colors ${
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
          <div
            className={`transition-all duration-300 ${
              venueSelectionPending ? 'venue-results-pending' : ''
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs md:text-sm font-heading tracking-[0.18em] text-mist/55 uppercase">
                {displayCourses.length} 場目前可購買
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="上一堂課"
                  onClick={() => scrollSchedule(-1)}
                  data-interaction-hint
                  className="interaction-hint h-10 px-3 rounded-full border border-pearl/15 bg-black/35 text-sm font-heading text-mist hover:text-pearl hover:border-pearl/30 transition-colors"
                >
                  ← 上一堂
                </button>
                <button
                  type="button"
                  aria-label="下一堂課"
                  onClick={() => scrollSchedule(1)}
                  data-interaction-hint
                  className="interaction-hint h-10 px-3 rounded-full border border-pearl/15 bg-black/35 text-sm font-heading text-mist hover:text-pearl hover:border-pearl/30 transition-colors"
                >
                  下一堂 →
                </button>
              </div>
            </div>

            <div
              ref={scrollerRef}
              data-swipe-hint={hasTouchedVenueFilter ? true : undefined}
              className={`${hasTouchedVenueFilter ? 'swipe-hint' : ''} -mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-3 pb-4 sm:mx-0 sm:px-0 md:gap-5`}
            >
              {displayCourses.map((c, i) => {
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
                const merchandisingRemaining =
                  activeCategory === 'BOOT_CAMP'
                    ? Math.max(
                        bootCamp2Availability.remaining,
                        bootCamp4Availability.remaining,
                      )
                    : displayAvailability.remaining
                const coachProfile = findCoachProfile(c.coach)
                const coachHintKey = getCoachHintKey(c.coach, coachProfile)
                const courseHintKey = getCourseHintKey(c)
                const hasSeenCoachHint =
                  interactionHintSeenSets.coaches.has(coachHintKey)
                const hasSeenCourseHint =
                  interactionHintSeenSets.courses.has(courseHintKey)
                const courseProductTitle = getCourseProductTitle(
                  c,
                  activeCategory,
                  coachProfile,
                )
                const courseCardPitch = getCourseCardPitch(
                  c,
                  activeCategory,
                  coachProfile,
                )
                const coachPricingTier = getCoachPricingTier(c.coach, coachProfile)
                const courseFeatureTags = getCourseFeatureTags(
                  c,
                  merchandisingRemaining,
                  coachPricingTier,
                  coachProfile,
                )
                const courseBundleItems = getCourseBundleItems(c)
                const courseDecisionSignals = getCourseDecisionSignals(
                  c,
                  coachProfile,
                )
                const fightNightBasePrice = getCoursePriceModel({
                  course: c,
                  pricingTier: coachPricingTier,
                  packageSize: 1,
                  remaining: sessionAvailability.remaining,
                  coachId: coachProfile?.id,
                })
                const fightNightPrice = applyFirstPurchaseOfferToPrice(
                  fightNightBasePrice,
                  c,
                  1,
                  firstPurchaseOfferEligible,
                )
                const bootCamp2Price = getCoursePriceModel({
                  course: c,
                  pricingTier: coachPricingTier,
                  packageSize: 2,
                  remaining: bootCamp2Availability.remaining,
                  coachId: coachProfile?.id,
                })
                const bootCamp4Price = getCoursePriceModel({
                  course: c,
                  pricingTier: coachPricingTier,
                  packageSize: 4,
                  remaining: bootCamp4Availability.remaining,
                  coachId: coachProfile?.id,
                })
                const primaryCardPriceLabel =
                  activeCategory === 'FIGHT_NIGHT'
                    ? fightNightPrice.label
                    : `${bootCamp2Price.label} 起`
                const primaryCardCompareAtLabel =
                  activeCategory === 'FIGHT_NIGHT'
                    ? fightNightPrice.compareAtLabel
                    : bootCamp2Price.compareAtLabel
                const fightNightOfferApplied =
                  firstPurchaseOfferEligible &&
                  isFirstPurchaseOfferCourseEligible(c, 1) &&
                  fightNightPrice.amount < fightNightBasePrice.amount
                const displayCourseFeatureTags = fightNightOfferApplied
                  ? Array.from(new Set([FIRST_PURCHASE_OFFER_BADGE, ...courseFeatureTags]))
                  : courseFeatureTags
                const fightNightSession = [
                  {
                    id: getSessionInventoryId(c),
                    date: c.date,
                    weekday: c.weekday,
                    startTime: c.startTime,
                  },
                ]
                const courseDetailPackageOptions: CourseDetailPackageOption[] =
                  activeCategory === 'BOOT_CAMP'
                    ? ([2, 4] as const).map((packageSize) => {
                        const availability =
                          packageSize === 2
                            ? bootCamp2Availability
                            : bootCamp4Availability
                        const price =
                          packageSize === 2 ? bootCamp2Price : bootCamp4Price
                        return {
                          packageSize,
                          label: `${bootCampPackageMeta[packageSize].label} Boot Camp`,
                          description: bootCampPackageMeta[packageSize].description,
                          priceLabel: price.label,
                          compareAtLabel: price.compareAtLabel,
                          value: price.amount,
                          remaining: availability.remaining,
                          series:
                            packageSize === 2 ? bootCampSeries2 : bootCampSeries4,
                          primary: packageSize === 4,
                        }
                      })
                    : [
                        {
                          packageSize: 1,
                          label: 'Fight Night Pass',
                          description: '單堂體驗，先把這個晚上留給自己',
                          priceLabel: fightNightPrice.label,
                          compareAtLabel: fightNightPrice.compareAtLabel,
                          value: fightNightPrice.amount,
                          originalValue: fightNightOfferApplied
                            ? fightNightBasePrice.amount
                            : undefined,
                          offerApplied: fightNightOfferApplied,
                          remaining: sessionAvailability.remaining,
                          series: fightNightSession,
                          primary: true,
                        },
                      ]
                const coachProofTag = getCoachProofTag(c.coach, coachProfile)
                const courseDetail: SelectedCourseDetail = {
                  course: c,
                  activeCategory,
                  productTitle: courseProductTitle,
                  featureTags: displayCourseFeatureTags,
                  routeLabel: routeContent?.label ?? bootCampRouteLabel,
                  routeBadge: routeContent?.shortLabel ?? bootCampRouteLabel,
                  routeSkills: routeContent?.skills.slice(0, 4) ?? [],
                  routeLesson: routeContent?.fighterLesson ?? null,
                  coachProfile,
                  coachProofTag,
                  coachDisplayName:
                    coachProfile?.shortName ?? getCoachDisplayName(c.coach),
                  pricingTier: coachPricingTier,
                  dateLabel: `${formatShortDate(c.date)} 週${c.weekday}`,
                  timeLabel: `${c.startTime}–${c.endTime}`,
                  venueLabel: venueLandmarks[c.venueId] ?? c.venueName,
                  sessionTitle,
                  remaining: merchandisingRemaining,
                  decisionSignals: courseDecisionSignals,
                  packageOptions: courseDetailPackageOptions,
                  isPurchaseLocked,
                  lockedPurchaseCtaLabel,
                  lockedPurchaseNote,
                }
                const openCourseDetail = () => {
                  const primaryOption =
                    courseDetailPackageOptions.find((option) => option.primary) ??
                    courseDetailPackageOptions[0]!
                  markInteractionHintSeen('courses', courseHintKey)
                  setSelectedCourseDetail(courseDetail)
                  track({
                    event: 'course_detail_open',
                    params: buildCourseTrackingParams(
                      c,
                      primaryOption.packageSize,
                      courseDetail.remaining,
                      primaryOption.value,
                      coachPricingTier,
                    ),
                    metaStandardEvent: 'ViewContent',
                    lineEventName: 'CourseDetailOpen',
                  })
                }
                if (isBootCampBookingMode) {
                  return (
                    <motion.div
                      key={`${hasTouchedVenueFilter ? activeVenueId ?? 'all' : 'venue'}-${c.id}`}
                      data-schedule-card
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.04 }}
                      className="flex shrink-0 basis-[82vw] snap-start flex-col gap-2 sm:basis-[21.5rem] md:basis-[22rem]"
                    >
                      <article
                        aria-label={`${sessionTitle}，${formatShortDate(c.date)} 週${c.weekday} ${c.startTime}–${c.endTime}，${c.venueName}`}
                        className="group relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-pearl/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(0,0,0,0.34))] p-0 shadow-[0_18px_52px_rgba(0,0,0,0.24)] transition-colors hover:border-neon/35"
                      >
                      <div className="px-4 pb-3 pt-4 md:px-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <span className={`venue-location-chip inline-flex rounded-md border px-2 py-1 text-xs font-heading tracking-wide ${meta.badgeClass}`}>
                              {venueShortLookup[c.venueId] ?? c.venueName}
                            </span>
                            <p className="venue-location-chip mt-2 text-xs leading-snug text-mist/62">
                              {venueLandmarks[c.venueId] ?? c.venueName}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-heading text-xs tracking-[0.14em] text-neon/75">
                              第一堂 · {formatShortDate(c.date)} 週{c.weekday}
                            </p>
                            <p className="mt-1 font-heading text-2xl font-black leading-none text-pearl tabular-nums md:text-3xl">
                              {c.startTime}–{c.endTime}
                            </p>
                          </div>
                        </div>

                        <CoachCard
                          coachName={c.coach}
                          profile={coachProfile}
                          courseName={c.name}
                          hintSeen={hasSeenCoachHint}
                          onOpen={() => {
                            if (!coachProfile) return
                            markInteractionHintSeen('coaches', coachHintKey)
                            setSelectedCoach({
                              coachName: c.coach,
                              profile: coachProfile,
                              course: c,
                            })
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={openCourseDetail}
                        data-interaction-hint
                        data-interacted={hasSeenCourseHint ? 'true' : undefined}
                        className="interaction-hint course-detail-trigger block w-full px-4 pr-12 pt-3 text-left md:px-5 md:pr-14"
                        aria-label={`查看 ${courseProductTitle} 課程介紹`}
                      >
                        <h3 className="font-heading text-xl font-black leading-tight text-pearl">
                          {courseProductTitle}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-mist/74">
                          {courseCardPitch}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {displayCourseFeatureTags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-heading tracking-wide ${getCourseFeatureTagClass(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {routeContent && (
                            <span className="rounded-full border border-neon/20 bg-neon/10 px-2.5 py-1 text-[11px] font-heading tracking-wide text-neon/90">
                              {routeContent.shortLabel}
                            </span>
                          )}
                          {shouldShowRemainingBadge(
                            displayAvailability.remaining,
                          ) && (
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-heading tracking-wide ${remainingBadgeClass}`}
                            >
                              {getRemainingLabel(displayAvailability.remaining)}
                            </span>
                          )}
                        </div>
                        <CourseSpecStrip signals={courseDecisionSignals} />
                        {courseBundleItems.length > 0 && (
                          <div className="mt-3 flex min-w-0 items-center gap-2 rounded-xl border border-pearl/10 bg-pearl/[0.04] px-3 py-2">
                            <span className="shrink-0 text-[10px] font-heading tracking-[0.16em] text-mist/45">
                              方案包含
                            </span>
                            <div className="flex min-w-0 flex-wrap gap-1.5">
                              {courseBundleItems.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-full bg-black/30 px-2 py-0.5 text-[11px] leading-snug text-pearl/84"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </button>

                      <div className="mt-auto px-4 pb-4 pt-3 md:px-5">
                        <div className="mb-2 flex items-center justify-between gap-2 border-t border-pearl/10 pt-3">
                          <p className="text-[10px] font-heading tracking-[0.18em] text-neon/75">
                            固定時段方案
                          </p>
                          <div className="text-right">
                            <p className="font-heading text-sm font-black text-pearl">
                              {primaryCardPriceLabel}
                            </p>
                            {primaryCardCompareAtLabel && (
                              <p className="mt-0.5 text-[11px] text-mist/45">
                                一般{' '}
                                <span className="line-through">
                                  {primaryCardCompareAtLabel}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {([2, 4] as const).map((packageSize) => {
                            const availability =
                              packageSize === 2
                                ? bootCamp2Availability
                                : bootCamp4Availability
                            const packagePrice =
                              packageSize === 2 ? bootCamp2Price : bootCamp4Price
                            const soldOut = availability.remaining <= 0

                            return soldOut ? (
                              <DisabledCta key={packageSize}>
                                {`${bootCampPackageMeta[packageSize].label}已售完`}
                              </DisabledCta>
                            ) : (
                              <Button
                                key={packageSize}
                                variant={packageSize === 4 ? 'primary' : 'secondary'}
                                size="sm"
                                className={
                                  packageSize === 4
                                    ? 'w-full'
                                    : 'w-full border-neon/25 bg-neon/10 text-pearl'
                                }
                                onClick={() =>
                                  openShoplineCheckout(
                                    c,
                                    packageSize,
                                    availability.remaining,
                                    packagePrice.amount,
                                    coachPricingTier,
                                  )
                                }
                                data-cta={`schedule-${c.id}-bootcamp-${packageSize}`}
                              >
                                {bootCampPackageMeta[packageSize].label} ·{' '}
                                {packagePrice.label}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                      </article>
                    </motion.div>
                  )
                }

                return (
                  <motion.div
                    key={`${hasTouchedVenueFilter ? activeVenueId ?? 'all' : 'venue'}-${c.id}`}
                    data-schedule-card
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="flex shrink-0 basis-[82vw] snap-start flex-col gap-2 sm:basis-[21.5rem] md:basis-[22rem]"
                  >
                    <article
                      aria-label={`${sessionTitle}，${formatShortDate(c.date)} 週${c.weekday} ${c.startTime}–${c.endTime}，${c.venueName}`}
                      className="group relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-pearl/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(0,0,0,0.34))] p-0 shadow-[0_18px_52px_rgba(0,0,0,0.24)] transition-colors hover:border-blaze/35"
                    >
                    <div className="px-4 pb-3 pt-4 md:px-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span
                            className={`venue-location-chip inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-heading font-medium tracking-wide md:text-xs ${meta.badgeClass}`}
                          >
                            {venueShortLookup[c.venueId] ?? c.venueName}
                          </span>
                          <p className="venue-location-chip mt-2 text-xs leading-snug text-mist/62 md:text-sm">
                            {venueLandmarks[c.venueId] ?? c.venueName}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-heading text-xs tracking-[0.14em] text-blaze/75">
                            {formatShortDate(c.date)} 週{c.weekday}
                          </p>
                          <p className="mt-1 font-heading text-2xl font-black leading-none text-pearl tabular-nums md:text-3xl">
                            {c.startTime}–{c.endTime}
                          </p>
                        </div>
                      </div>
                      <CoachCard
                        coachName={c.coach}
                        profile={coachProfile}
                        courseName={c.name}
                        hintSeen={hasSeenCoachHint}
                        onOpen={() => {
                          if (!coachProfile) return
                          markInteractionHintSeen('coaches', coachHintKey)
                          setSelectedCoach({
                            coachName: c.coach,
                            profile: coachProfile,
                            course: c,
                          })
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={openCourseDetail}
                      data-interaction-hint
                      data-interacted={hasSeenCourseHint ? 'true' : undefined}
                      className="interaction-hint course-detail-trigger block w-full px-4 pr-12 pt-3 text-left md:px-5 md:pr-14"
                      aria-label={`查看 ${courseProductTitle} 課程介紹`}
                    >
                      <p className="font-heading text-xl font-black leading-tight text-pearl">
                        {courseProductTitle}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-mist/74">
                        {courseCardPitch}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {shouldShowRemainingBadge(
                          displayAvailability.remaining,
                        ) && (
                          <p
                            className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-heading tracking-wide border ${remainingBadgeClass}`}
                          >
                            {getRemainingLabel(displayAvailability.remaining)}
                          </p>
                        )}
                        {displayCourseFeatureTags.slice(0, 3).map((tag) => (
                          <p
                            key={tag}
                            className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-heading tracking-wide ${getCourseFeatureTagClass(tag)}`}
                          >
                            {tag}
                          </p>
                        ))}
                        {bootCampRouteLabel && (
                          <p className="inline-flex w-fit rounded-full border border-neon/20 bg-neon/10 px-2.5 py-1 text-[11px] font-heading tracking-wide text-neon/90">
                            {routeContent?.badge ?? bootCampRouteLabel}
                          </p>
                        )}
                      </div>
                      <CourseSpecStrip signals={courseDecisionSignals} />
                      {courseBundleItems.length > 0 && (
                        <div className="mt-3 flex min-w-0 items-center gap-2 rounded-xl border border-pearl/10 bg-pearl/[0.04] px-3 py-2">
                          <span className="shrink-0 text-[10px] font-heading tracking-[0.16em] text-mist/45">
                            方案包含
                          </span>
                          <div className="flex min-w-0 flex-wrap gap-1.5">
                            {courseBundleItems.map((item) => (
                              <span
                                key={item}
                                className="rounded-full bg-black/30 px-2 py-0.5 text-[11px] leading-snug text-pearl/84"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>

                    <div className="mt-auto space-y-2 px-4 pb-4 pt-3 md:px-5">
                      {activeCategory === 'BOOT_CAMP' ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {bootCamp2Availability.remaining > 0 ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-full border-neon/25 bg-neon/10 text-pearl"
                                onClick={() =>
                                  openShoplineCheckout(
                                    c,
                                    2,
                                    bootCamp2Availability.remaining,
                                    bootCamp2Price.amount,
                                    coachPricingTier,
                                  )
                                }
                                data-cta={`schedule-${c.id}-bootcamp-2`}
                              >
                                保留兩堂 · {bootCamp2Price.label}
                              </Button>
                            ) : (
                              <DisabledCta>兩堂已售完</DisabledCta>
                            )}
                            {bootCamp4Availability.remaining > 0 ? (
                              <Button
                                variant="primary"
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                  openShoplineCheckout(
                                    c,
                                    4,
                                    bootCamp4Availability.remaining,
                                    bootCamp4Price.amount,
                                    coachPricingTier,
                                  )
                                }
                                data-cta={`schedule-${c.id}-bootcamp-4`}
                              >
                                保留四堂 · {bootCamp4Price.label}
                              </Button>
                            ) : (
                              <DisabledCta>四堂已售完</DisabledCta>
                            )}
                          </div>
                        </div>
                      ) : (
                        sessionAvailability.remaining > 0 ? (
                          <>
                            {primaryCardCompareAtLabel && (
                              <p className="text-right text-[11px] text-mist/45">
                                一般{' '}
                                <span className="line-through">
                                  {primaryCardCompareAtLabel}
                                </span>
                              </p>
                            )}
                            <Button
                              variant="primary"
                              className="w-full"
                              onClick={() =>
                                openShoplineCheckout(
                                  c,
                                  1,
                                  sessionAvailability.remaining,
                                  fightNightPrice.amount,
                                  coachPricingTier,
                                  fightNightOfferApplied
                                    ? fightNightBasePrice.amount
                                    : undefined,
                                  fightNightOfferApplied,
                                )
                              }
                              data-cta={`schedule-${c.id}-fight-night`}
                            >
                              {isPurchaseLocked
                                ? lockedPurchaseCtaLabel
                                : fightNightOfferApplied
                                  ? `使用首購半價保留這一場 · ${fightNightPrice.label}`
                                  : `保留這一場 · ${fightNightPrice.label}`}
                            </Button>
                            {isPurchaseLocked && lockedPurchaseNote && (
                              <p className="mt-2 text-center text-xs leading-relaxed text-mist/55">
                                {lockedPurchaseNote}
                              </p>
                            )}
                          </>
                        ) : (
                          <DisabledCta>本場已售完</DisabledCta>
                        )
                      )}
                    </div>
                    </article>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {activeCategory === 'BOOT_CAMP' && displayCourses.length > 0 && (
        <div className="mx-auto mt-8 max-w-5xl border-y border-neon/20 bg-neon/8 px-4 py-5 md:mt-10 md:flex md:items-center md:justify-between md:gap-6 md:px-6 md:py-6">
          <div className="max-w-xl">
            <p className="font-heading text-xs uppercase tracking-[0.26em] text-neon/80">
              只想先體驗一次？
            </p>
            <p className="mt-2 font-heading text-2xl font-black leading-tight text-pearl md:text-3xl">
              先選一堂 Fight Night 感受現場
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:w-64">
            <Button
              variant="secondary"
              size="lg"
              href="/#ticket"
              className="w-full border-neon/35 bg-neon/8 text-neon hover:border-neon/55 hover:bg-neon/14 hover:text-pearl"
              onClick={() =>
                track({
                  event: 'bootcamp_single_class_redirect_click',
                  params: {
                    surface: 'bootcamp_schedule_block',
                    active_route: activeBootCampRoute ?? 'all',
                    active_venue_id: activeVenueId ?? 'all',
                    active_date: activeDateIso ?? 'all',
                  },
                  metaStandardEvent: 'ViewContent',
                  lineEventName: 'SingleClassRedirect',
                })
              }
              data-cta="bootcamp-single-class-redirect"
            >
              回到 Fight Night 選課
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-xs md:text-sm text-mist/50 max-w-2xl mx-auto mt-8 md:mt-12">
        {weeklyScheduleSectionContent.footnote}
      </p>

      {selectedCourseDetail && (
        <CourseDetailModal
          detail={selectedCourseDetail}
          onClose={() => setSelectedCourseDetail(null)}
          onPurchase={(option) => {
            setSelectedCourseDetail(null)
            openShoplineCheckout(
              selectedCourseDetail.course,
              option.packageSize,
              option.remaining,
              option.value,
              selectedCourseDetail.pricingTier,
              option.originalValue,
              option.offerApplied,
            )
          }}
          onOpenCoach={() => {
            if (!selectedCourseDetail.coachProfile) return
            setSelectedCourseDetail(null)
            setSelectedCoach({
              coachName: selectedCourseDetail.course.coach,
              profile: selectedCourseDetail.coachProfile,
              course: selectedCourseDetail.course,
            })
          }}
        />
      )}

      {selectedCoach && (
        <CoachProfileModal
          coachName={selectedCoach.coachName}
          profile={selectedCoach.profile}
          course={selectedCoach.course}
          onClose={() => setSelectedCoach(null)}
        />
      )}

      {pendingCheckout && (
        <CheckoutContactModal
          pending={pendingCheckout}
          error={checkoutError}
          isSubmitting={isCheckoutSubmitting}
          onClose={() => {
            if (isCheckoutSubmitting) return
            setPendingCheckout(null)
            setCheckoutError(null)
          }}
          onSubmit={(buyer) => void submitShoplineCheckout(buyer)}
        />
      )}
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
