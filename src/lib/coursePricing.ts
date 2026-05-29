import {
  ONLINE_SALES_SEAT_LIMIT,
  isRecommendedWeeklyCourse,
} from '../data/weeklySchedule'
import type { WeeklyCourse } from '../types'

export type CoursePricingTier = 'foreign-fighter' | 'domestic-teacher'

export type CourseValueFactor = {
  multiplier: number
  tag?: string
  discount?: boolean
}

export type CoursePriceModel = {
  amount: number
  label: string
  compareAtAmount?: number
  compareAtLabel?: string
  tags: string[]
}

export type CoursePriceOptions = {
  course: WeeklyCourse
  pricingTier: CoursePricingTier
  packageSize: 1 | 2 | 4
  remaining?: number
  coachId?: string | null
  todayIso?: string
}

const basePackagePrice: Record<1 | 2 | 4, number> = {
  1: 680,
  2: 1280,
  4: 2680,
}

export const FIRST_PURCHASE_OFFER_CODE = '618_MIDYEAR_FIRST_PURCHASE_HALF'
export const FIRST_PURCHASE_OFFER_LABEL = '618 首購半價'
export const FIRST_PURCHASE_OFFER_BADGE = '618 首購限定'
export const FIRST_PURCHASE_OFFER_END_AT_TW = '2026-06-18T23:59:59+08:00'
export const FIRST_PURCHASE_OFFER_DISCOUNT_RATE = 0.5

function uniqueTags(tags: Array<string | undefined>) {
  return Array.from(new Set(tags.filter((tag): tag is string => Boolean(tag))))
}

export function getTaipeiTodayIso(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )
  return `${values.year}-${values.month}-${values.day}`
}

function getCourseStartHour(course: WeeklyCourse) {
  return Number(String(course.startTime || '').slice(0, 2))
}

function getDaysUntilCourse(course: WeeklyCourse, todayIso = getTaipeiTodayIso()) {
  const today = new Date(`${todayIso}T00:00:00`)
  const courseDate = new Date(`${course.date}T00:00:00`)
  return Math.round(
    (courseDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  )
}

function isCourseTechnique(course: WeeklyCourse) {
  return course.name.includes('技巧')
}

function isCourseBasic(course: WeeklyCourse) {
  return course.name.includes('基礎')
}

function isCourseConditioning(course: WeeklyCourse) {
  return course.name.includes('體適能') || course.name.includes('戰鬥')
}

function isCourseMuayOrKick(course: WeeklyCourse) {
  return course.name.includes('泰拳') || course.name.includes('踢拳')
}

function isCourseBoxing(course: WeeklyCourse) {
  return course.name.includes('拳擊')
}

function getDifficultyFactor(course: WeeklyCourse): CourseValueFactor {
  if (isCourseTechnique(course)) return { multiplier: 1.25, tag: '需經驗' }
  if (isCourseBasic(course)) return { multiplier: 1.08, tag: '新手入門' }
  if (isCourseConditioning(course)) return { multiplier: 1, tag: '高流汗' }
  return { multiplier: 1 }
}

function getTimeFactor(course: WeeklyCourse): CourseValueFactor {
  const startHour = getCourseStartHour(course)
  const isFriday = course.weekday === '五'
  const isWeekend = course.weekday === '六' || course.weekday === '日'

  if (isFriday && startHour >= 18 && startHour <= 20) {
    return { multiplier: 1.15, tag: '週五場' }
  }
  if (startHour >= 18 && startHour <= 20) {
    return { multiplier: 1.1, tag: '下班場' }
  }
  if (startHour >= 21) return { multiplier: 0.95 }
  if (isWeekend) return { multiplier: 1.05, tag: '週末場' }
  return { multiplier: 0.9, tag: '日間席' }
}

function getCoachFactor(
  course: WeeklyCourse,
  pricingTier: CoursePricingTier,
  coachId?: string | null,
): CourseValueFactor {
  const isMuayOrKick = isCourseMuayOrKick(course)
  const isBoxing = isCourseBoxing(course)
  const isStriking = isMuayOrKick || isBoxing || isCourseConditioning(course)

  if (coachId === 'got' && isMuayOrKick) {
    return { multiplier: 1.18, tag: '泰國靶師' }
  }
  if (pricingTier === 'foreign-fighter' && isStriking) {
    return { multiplier: 1.2, tag: '國際場' }
  }
  if (coachId === 'mengyan' && (isBoxing || isCourseConditioning(course))) {
    return { multiplier: 1.12, tag: '拳擊冠軍' }
  }
  return { multiplier: 1 }
}

function getRecommendedFactor(course: WeeklyCourse): CourseValueFactor {
  return isRecommendedWeeklyCourse(course)
    ? { multiplier: 1.12, tag: '精選場' }
    : { multiplier: 1 }
}

function getAvailabilityFactor(
  course: WeeklyCourse,
  remaining: number,
  todayIso?: string,
): CourseValueFactor {
  if (remaining <= 0) return { multiplier: 1, tag: '已售完' }
  if (remaining <= 2) return { multiplier: 1.1, tag: '最後席' }

  const daysUntil = getDaysUntilCourse(course, todayIso)
  if (remaining >= 5 && daysUntil <= 2) {
    return { multiplier: 0.85, tag: '開放席', discount: true }
  }
  if (remaining >= 5 && daysUntil <= 4) {
    return { multiplier: 0.9, tag: '開放席', discount: true }
  }
  return { multiplier: 1 }
}

function roundMerchPrice(amount: number) {
  return Math.max(0, Math.round((amount + 20) / 100) * 100 - 20)
}

function getPackageFactorMultiplier(multiplier: number, packageSize: 1 | 2 | 4) {
  if (packageSize === 1) return multiplier

  const packageWeight = packageSize === 2 ? 0.72 : 0.58
  return 1 + (multiplier - 1) * packageWeight
}

export function formatCoursePrice(amount: number) {
  return `NT$${amount.toLocaleString('en-US')}`
}

export function isFirstPurchaseOfferActive(date = new Date()) {
  return date.getTime() <= Date.parse(FIRST_PURCHASE_OFFER_END_AT_TW)
}

export function isFirstPurchaseOfferCourseEligible(
  course: WeeklyCourse,
  packageSize: 1 | 2 | 4,
) {
  return course.category === 'FIGHT_NIGHT' && packageSize === 1
}

export function getFirstPurchaseOfferAmount(amount: number) {
  return Math.max(0, Math.round(amount * FIRST_PURCHASE_OFFER_DISCOUNT_RATE))
}

export function applyFirstPurchaseOfferToPrice(
  price: CoursePriceModel,
  course: WeeklyCourse,
  packageSize: 1 | 2 | 4,
  isEligible: boolean,
): CoursePriceModel {
  if (
    !isEligible ||
    !isFirstPurchaseOfferActive() ||
    !isFirstPurchaseOfferCourseEligible(course, packageSize)
  ) {
    return price
  }

  const amount = getFirstPurchaseOfferAmount(price.amount)

  return {
    amount,
    label: formatCoursePrice(amount),
    compareAtAmount: price.amount,
    compareAtLabel: price.label,
    tags: uniqueTags([...price.tags, FIRST_PURCHASE_OFFER_BADGE]),
  }
}

export function getCoursePriceModel({
  course,
  pricingTier,
  packageSize,
  remaining = ONLINE_SALES_SEAT_LIMIT,
  coachId,
  todayIso,
}: CoursePriceOptions): CoursePriceModel {
  const factors = [
    getDifficultyFactor(course),
    getTimeFactor(course),
    getCoachFactor(course, pricingTier, coachId),
    getRecommendedFactor(course),
    getAvailabilityFactor(course, remaining, todayIso),
  ]
  const rawAmount = factors.reduce(
    (amount, factor) =>
      amount * getPackageFactorMultiplier(factor.multiplier, packageSize),
    basePackagePrice[packageSize],
  )
  const amount = roundMerchPrice(rawAmount)
  const discountFactors = factors.filter((factor) => factor.discount)
  const compareAtAmount =
    discountFactors.length > 0
      ? roundMerchPrice(
          factors
            .filter((factor) => !factor.discount)
            .reduce(
              (price, factor) =>
                price *
                getPackageFactorMultiplier(factor.multiplier, packageSize),
              basePackagePrice[packageSize],
            ),
        )
      : undefined

  return {
    amount,
    label: formatCoursePrice(amount),
    compareAtAmount:
      compareAtAmount && compareAtAmount > amount ? compareAtAmount : undefined,
    compareAtLabel:
      compareAtAmount && compareAtAmount > amount
        ? formatCoursePrice(compareAtAmount)
        : undefined,
    tags: uniqueTags(factors.map((factor) => factor.tag)),
  }
}
