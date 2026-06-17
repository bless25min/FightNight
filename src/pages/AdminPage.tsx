import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const adminTokenKey = 'fightnight_admin_token'

type AdminTab =
  | 'changes'
  | 'traffic'
  | 'journeys'
  | 'orders'
  | 'inventory'
  | 'events'
  | 'line'

type AdminOrder = {
  referenceId: string
  status: string
  courseName: string
  category: string
  venueName: string
  coach: string
  route?: string | null
  packageSize: number
  amountValue: number
  currency: string
  buyerName: string
  buyerPhone: string
  buyerEmail?: string | null
  lineUserId?: string | null
  lineDisplayName?: string | null
  linePictureUrl?: string | null
  lineEmail?: string | null
  lineEmailVerified?: boolean | null
  lineIsFriend?: boolean | null
  linePaymentNotifyStatus?: string | null
  linePaymentNotifyAttemptedAt?: string | null
  linePaymentNotifiedAt?: string | null
  linePaymentNotifyError?: string | null
  eventPassVariantId?: string | null
  eventPassVariantLabel?: string | null
  equipmentPackage?: string | null
  servicePreferences?: {
    handWrapAssist?: boolean
    quietMode?: boolean
  } | null
  sourcePath?: string | null
  metaPurchaseEventId?: string | null
  metaPurchaseSentAt?: string | null
  metaCapiStatus?: string | null
  metaCapiError?: string | null
  seriesDates: string[]
  createdAt: string
  updatedAt?: string | null
  paidAt?: string | null
}

type InventoryRecord = {
  sessionId: string
  capacity: number
  sold: number
  remaining: number
  updatedAt?: string | null
}

type TrackingEventRow = {
  id: number
  anonymousId: string
  sessionId: string
  eventName: string
  eventValue?: number | null
  currency: string
  routePath?: string | null
  canonicalRoutePath?: string | null
  landingPath?: string | null
  sourceChannel?: string | null
  experimentId?: string | null
  experimentVariant?: string | null
  firstExperimentVariant?: string | null
  splitVisitId?: string | null
  splitAssignmentMode?: string | null
  splitOriginalPath?: string | null
  splitAssignedPath?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  deviceType?: string | null
  durationMs?: number | null
  scrollDepth?: number | null
  maxScrollDepth?: number | null
  interactionCount?: number | null
  isBounce?: boolean
  sectionId?: string | null
  ctaId?: string | null
  targetText?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  sourceUrl?: string | null
  referrer?: string | null
  referrerHost?: string | null
  firstLandingPath?: string | null
  firstSourceChannel?: string | null
  utmContent?: string | null
  utmTerm?: string | null
  clickIdType?: string | null
  clickIdValue?: string | null
  browserName?: string | null
  osName?: string | null
  inAppBrowser?: string | null
  browserLanguage?: string | null
  timezone?: string | null
  visitorType?: string | null
  sessionIndex?: number | null
  colo?: string | null
  cfAsn?: number | null
  cfAsOrganization?: string | null
  cfRay?: string | null
  createdAt: string
}

type LineCustomer = {
  lineUserId: string
  displayName: string
  pictureUrl?: string | null
  email?: string | null
  emailVerified?: boolean | null
  isFriend: boolean
  accessCount: number
  firstSeenAt: string
  lastSeenAt: string
  totalOrders?: number
  paidOrders?: number
  pendingOrders?: number
  freeReservedOrders?: number
  paidRevenue?: number
  latestOrderReferenceId?: string | null
  latestOrderStatus?: string | null
  latestOrderCourseName?: string | null
  latestOrderAmountValue?: number | null
  latestOrderPaidAt?: string | null
  latestOrderCreatedAt?: string | null
  buyerName?: string | null
  buyerPhone?: string | null
  buyerEmail?: string | null
  latestOrderLineEmail?: string | null
  latestOrderLineEmailVerified?: boolean | null
  latestRecoveryTemplateId?: string | null
  latestRecoveryStatus?: string | null
  latestRecoverySentAt?: string | null
  latestRecoveryAttemptedAt?: string | null
  latestRecoveryError?: string | null
  suggestedRecoveryTemplateId?: Exclude<RecoveryTemplateId, 'auto'> | null
  recoverySegment?: string | null
}

type RecoveryTemplateId =
  | 'auto'
  | 'pending_checkout'
  | 'weekly_trial_invite'
  | 'reserved_to_first_purchase'
  | 'offer_viewed_unpaid'
  | 'course_reminder'
  | 'newcomer_entry'

type LineRecoveryPreviewCard = {
  imageUrl?: string | null
  imageOnly?: boolean
  imageAspectRatio?: string | null
  imageAspectMode?: string | null
  eyebrow: string
  title: string
  body: string
  paragraphs?: string[]
  meta: string
  button: string
}

type LineRecoveryPreview = {
  templateId: Exclude<RecoveryTemplateId, 'auto'>
  targetUrl?: string | null
  altText: string
  eyebrow: string
  title: string
  body: string
  meta: string
  button: string
  cards?: LineRecoveryPreviewCard[]
  targetKind: 'shopline_checkout' | 'site_recovery'
}

type LineMessageRecord = {
  messageId: string
  lineUserId?: string | null
  displayName?: string | null
  pictureUrl?: string | null
  buyerName?: string | null
  buyerPhone?: string | null
  buyerEmail?: string | null
  referenceId?: string | null
  courseName?: string | null
  source: 'auto' | 'admin_manual' | string
  messageType: string
  templateId?: string | null
  targetUrl?: string | null
  status: string
  batchId?: string | null
  segment?: string | null
  staffNote?: string | null
  templateVersion?: string | null
  title?: string | null
  altText?: string | null
  error?: string | null
  attemptedAt?: string | null
  sentAt?: string | null
  createdAt?: string | null
}

type LineRecoveryBatchPreviewRecipient = {
  lineUserId: string
  displayName?: string | null
  pictureUrl?: string | null
  templateId?: Exclude<RecoveryTemplateId, 'auto'> | null
  segment?: string | null
  targetUrl?: string | null
  canSend: boolean
  blockers: string[]
}

type LineRecoveryBatchPreviewResponse = {
  ok: boolean
  templateId: RecoveryTemplateId
  selectedCount: number
  sendableCount: number
  blockedCount: number
  previews: LineRecoveryPreview[]
  recipients: LineRecoveryBatchPreviewRecipient[]
}

type LineRecoveryBatchSendResponse = {
  ok: boolean
  batchId: string
  status: string
  selectedCount: number
  sendableCount: number
  blockedCount: number
  sentCount: number
  failedCount: number
}

type AdminSummary = {
  orders: {
    total: number
    paid: number
    pending: number
    freeReserved: number
    attention: number
    paidRevenue: number
  }
  events: {
    total: number
    anonymousVisitors: number
    sessions: number
    breakdown: Array<{
      eventName: string
      count: number
      lastAt?: string | null
    }>
  }
  line: {
    totalCustomers: number
    friends: number
  }
}

type ReconcileResponse = {
  checked: number
  changed: number
  results: Array<{
    referenceId: string
    previousStatus: string
    reconciledStatus?: string | null
    provider?: {
      diagnosis?: string
      sessionStatus?: string | null
      paymentMethod?: string | null
      tradeOrderId?: string | null
    } | null
  }>
}

type LineConfirmationResendResponse = {
  ok: boolean
  referenceId: string
  lineNotify?: {
    status?: string
    error?: string
  } | null
  order?: AdminOrder | null
}

type TrafficSource = {
  sourceChannel: string
  sessions: number
  visitors: number
  newSessions: number
  returningSessions: number
  pageViews: number
  ticketSessions: number
  leadSessions: number
  freeTrialSessions: number
  purchaseClickSessions: number
  actions: number
  checkoutIntents: number
  exits: number
  bounces: number
  avgDurationMs: number
  avgScrollDepth: number
}

type TrafficCampaign = {
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent?: string | null
  utmTerm?: string | null
  clickIdType?: string | null
  sessions: number
  paidSessions: number
  ticketSessions: number
  leadSessions: number
  freeTrialSessions: number
  purchaseClickSessions: number
  checkoutSessions: number
  actions: number
  checkoutIntents: number
  firstSeenAt?: string | null
  lastSeenAt?: string | null
}

type TrafficPage = {
  routePath: string
  sessions: number
  pageViews: number
  ticketSessions: number
  leadSessions: number
  freeTrialSessions: number
  actions: number
  checkoutIntents: number
  exits: number
  bounces: number
  avgDurationMs: number
  avgScrollDepth: number
}

type TrafficExit = {
  routePath: string
  exits: number
  bounces: number
  avgDurationMs: number
  avgScrollDepth: number
  lastAt?: string | null
}

type TrafficDropoff = {
  lastSection: string
  dropoffs: number
  bounces: number
  avgDurationMs: number
  avgScrollDepth: number
  lastAt?: string | null
}

type TrafficSection = {
  routePath?: string | null
  sectionId: string
  views: number
  sessions: number
  clicks: number
  avgDurationMs: number
  lastAt?: string | null
}

type TrafficSplitVariant = {
  experimentId?: string | null
  experimentVariant: string
  firstExperimentVariant?: string | null
  routePath: string
  sessions: number
  pageViews: number
  leadSessions: number
  freeTrialSessions: number
  purchaseClickSessions: number
  actions: number
  checkoutIntents: number
  exits: number
  bounces: number
  avgDurationMs: number
  avgScrollDepth: number
}

type TrafficSplitSection = {
  experimentVariant: string
  firstExperimentVariant?: string | null
  routePath: string
  sectionId: string
  views: number
  sessions: number
  clicks: number
  avgDurationMs: number
  lastAt?: string | null
}

type TrafficDevice = {
  deviceType: string
  sessions: number
  leadSessions: number
  checkoutIntents: number
  avgScrollDepth: number
}

type TrafficBrowser = {
  browserName: string
  osName: string
  inAppBrowser?: string | null
  sessions: number
  leadSessions: number
  checkoutIntents: number
  avgScrollDepth: number
}

type TrafficNetwork = {
  asOrganization: string
  asn: number
  colo?: string | null
  sessions: number
  leadSessions: number
  checkoutIntents: number
}

type TrafficGeo = {
  country: string
  region?: string | null
  city?: string | null
  sessions: number
  paidSessions: number
  leadSessions: number
  checkoutIntents: number
}

type TrafficOverview = {
  sessions: number
  visitors: number
  paidSessions: number
  clickIdSessions: number
  utmSessions: number
  ticketSessions: number
  leadSessions: number
  freeTrialSessions: number
  purchaseClickSessions: number
  checkoutSessions: number
  scroll50Sessions: number
  exitSessions: number
  bounceSessions: number
  paidOrders: number
  freeOrders: number
  revenue: number
}

type TrafficDaily = {
  day: string
  sessions: number
  paidSessions: number
  clickIdSessions: number
  utmSessions: number
  ticketSessions: number
  leadSessions: number
  freeTrialSessions: number
  purchaseClickSessions: number
  checkoutSessions: number
  paidOrders: number
  freeOrders: number
  revenue: number
}

type TrafficRecentEvent = {
  createdAt: string
  eventName: string
  routePath?: string | null
  canonicalRoutePath?: string | null
  experimentId?: string | null
  experimentVariant?: string | null
  firstExperimentVariant?: string | null
  splitVisitId?: string | null
  splitAssignmentMode?: string | null
  sectionId?: string | null
  ctaId?: string | null
  targetText?: string | null
  durationMs?: number | null
  scrollDepth?: number | null
  maxScrollDepth?: number | null
  sourceChannel?: string | null
  utmCampaign?: string | null
  utmContent?: string | null
  browserName?: string | null
  inAppBrowser?: string | null
  city?: string | null
  country?: string | null
}

type TrafficData = {
  overview?: TrafficOverview
  daily?: TrafficDaily[]
  sources: TrafficSource[]
  campaigns: TrafficCampaign[]
  pages: TrafficPage[]
  sections: TrafficSection[]
  splitVariants?: TrafficSplitVariant[]
  splitSections?: TrafficSplitSection[]
  dropoffs?: TrafficDropoff[]
  exits: TrafficExit[]
  devices: TrafficDevice[]
  browsers: TrafficBrowser[]
  networks: TrafficNetwork[]
  geography: TrafficGeo[]
  recentEvents?: TrafficRecentEvent[]
}

type ChangePeriodMetrics = {
  startAt: string
  endAt: string
  durationHours: number
  durationDays: number
  users: number
  sessions: number
  paidSessions: number
  clickIdSessions: number
  mobileSessions: number
  desktopSessions: number
  leads: number
  addToCart: number
  checkout: number
  freeTrials: number
  orders: number
  paidOrders: number
  freeOrders: number
  revenue: number
  leadRate: number
  addToCartRate: number
  checkoutRate: number
  purchaseRate: number
  checkoutToPaidRate: number
  revenuePerUser: number
  usersPerDay: number
}

type ChangeDelta = {
  users: number
  usersPct: number | null
  sessions: number
  sessionsPct: number | null
  paidSessions: number
  paidSessionsPct: number | null
  leads: number
  leadsPct: number | null
  leadRatePp: number
  addToCartRatePp: number
  checkoutRatePp: number
  purchaseRatePp: number
  checkoutToPaidRatePp: number
  paidOrders: number
  freeTrials: number
  revenue: number
  revenuePct: number | null
  revenuePerUser: number
  usersPerDay: number
}

type ChangeEntry = {
  id: string
  title: string
  category?: string | null
  scope?: string | null
  impactLevel?: string | null
  deployedAt: string
  deployedAtTw?: string | null
  deploymentUrl?: string | null
  changedSummary?: string | null
  hypothesis?: string | null
  primaryMetric?: string | null
  notes?: string | null
  source?: string | null
  before: ChangePeriodMetrics
  after: ChangePeriodMetrics
  delta: ChangeDelta
  warnings: string[]
  isLatest?: boolean
}

type ChangesData = {
  days: number
  generatedAt: string
  overview: {
    totalChanges: number
    latestChangeId?: string | null
    latestChangeTitle?: string | null
  }
  changes: ChangeEntry[]
}

type JourneyEvent = {
  eventName: string
  routePath?: string | null
  canonicalRoutePath?: string | null
  experimentId?: string | null
  experimentVariant?: string | null
  firstExperimentVariant?: string | null
  splitVisitId?: string | null
  sectionId?: string | null
  ctaId?: string | null
  targetText?: string | null
  scrollDepth?: number | null
  maxScrollDepth?: number | null
  durationMs?: number | null
  isBounce?: boolean
  sourceChannel?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  clickIdType?: string | null
  createdAt: string
}

type Journey = {
  sessionId: string
  anonymousId: string
  startedAt: string
  lastAt: string
  sourceChannel: string
  landingPath?: string | null
  firstLandingPath?: string | null
  experimentId?: string | null
  experimentVariant?: string | null
  firstExperimentVariant?: string | null
  splitVisitId?: string | null
  deviceType?: string | null
  browserName?: string | null
  osName?: string | null
  inAppBrowser?: string | null
  visitorType?: string | null
  sessionIndex?: number | null
  country?: string | null
  region?: string | null
  city?: string | null
  asOrganization?: string | null
  asn?: number | null
  colo?: string | null
  maxScrollDepth: number
  durationMs: number
  eventCount: number
  events: JourneyEvent[]
}

type AdminData = {
  summary?: AdminSummary
  traffic?: TrafficData
  orders: AdminOrder[]
  inventory: InventoryRecord[]
  events: TrackingEventRow[]
  customers: LineCustomer[]
  lineMessages: LineMessageRecord[]
  journeys: Journey[]
  changes?: ChangesData
}

type ApiError = {
  error?: string
}

const initialData: AdminData = {
  orders: [],
  inventory: [],
  events: [],
  customers: [],
  lineMessages: [],
  journeys: [],
}

const statusLabels: Record<string, string> = {
  free_reserved: '免費體驗已預約',
  pending: '待付款',
  payment_processing: '付款處理中',
  refund_processing: '退款處理中',
  refunded: '已退款',
  paid: '已付款',
  session_failed: '建立付款失敗',
  payment_amount_mismatch: '金額異常',
  paid_over_capacity: '超賣需處理',
  expired: '逾期',
  cancelled: '取消',
  failed: '失敗',
}

const recoveryTemplates: Array<{
  id: RecoveryTemplateId
  label: string
  detail: string
}> = [
  {
    id: 'auto',
    label: '依狀態自動選',
    detail: '後端依待付款、已預約未購買、進站次數與新客狀態選卡片',
  },
  {
    id: 'pending_checkout',
    label: '待付款提醒',
    detail: '提醒回到剛建立的付款連結或課程頁',
  },
  {
    id: 'weekly_trial_invite',
    label: '本週免費體驗',
    detail: '給 LINE 好友但尚未預約的人，先保留一場體驗',
  },
  {
    id: 'reserved_to_first_purchase',
    label: '已預約轉首購',
    detail: '給已保留免費體驗但尚未付款的人，看 618 首購',
  },
  {
    id: 'offer_viewed_unpaid',
    label: '看過優惠未付款',
    detail: '給看過 618 / Boot Camp 優惠但尚未付款的人',
  },
  {
    id: 'course_reminder',
    label: '課程提醒',
    detail: '給多次進站但還沒預約或付款的人',
  },
  {
    id: 'newcomer_entry',
    label: '新手體驗入口',
    detail: '給第一次進站或還沒有購買紀錄的新朋友',
  },
]

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'changes', label: '版本歷程' },
  { id: 'traffic', label: '流量優化' },
  { id: 'journeys', label: '用戶歷程' },
  { id: 'orders', label: '訂單客戶' },
  { id: 'inventory', label: '課程庫存' },
  { id: 'events', label: '匿名漏斗' },
  { id: 'line', label: 'LINE 足跡' },
]

const moneyFormatter = new Intl.NumberFormat('zh-TW', {
  style: 'currency',
  currency: 'TWD',
  maximumFractionDigits: 0,
})

function getStoredToken() {
  if (typeof window === 'undefined') return ''

  try {
    return window.localStorage.getItem(adminTokenKey) || ''
  } catch {
    return ''
  }
}

function formatMoney(value: number) {
  return moneyFormatter.format(value)
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value.includes('T') ? value : `${value}Z`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatDuration(ms?: number | null) {
  const totalSeconds = Math.round((ms || 0) / 1000)
  if (totalSeconds <= 0) return '-'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes <= 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

function formatPercent(value?: number | null) {
  if (!value) return '0%'
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}

function formatRate(numerator?: number | null, denominator?: number | null) {
  const total = Number(denominator || 0)
  if (total <= 0) return '0%'
  const value = (Number(numerator || 0) / total) * 100
  return `${Number(value.toFixed(value >= 10 ? 1 : 2))}%`
}

function bounceRate(bounces: number, exits: number) {
  if (!exits) return '0%'
  return `${Math.round((bounces / exits) * 100)}%`
}

function formatNumber(value?: number | null, digits = 0) {
  const number = Number(value || 0)
  return new Intl.NumberFormat('zh-TW', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits > 0 ? 1 : 0,
  }).format(number)
}

function formatSignedNumber(value?: number | null, suffix = '', digits = 0) {
  const number = Number(value || 0)
  const sign = number > 0 ? '+' : ''
  return `${sign}${formatNumber(number, digits)}${suffix}`
}

function formatSignedPercent(value?: number | null) {
  if (value === null || value === undefined) return '新增'
  return formatSignedNumber(value, '%', Math.abs(value) >= 10 ? 1 : 2)
}

function formatSignedPoint(value?: number | null) {
  return formatSignedNumber(value, 'pp', Math.abs(Number(value || 0)) >= 10 ? 1 : 2)
}

function deltaTone(value?: number | null) {
  const number = Number(value || 0)
  if (number > 0) return 'text-neon'
  if (number < 0) return 'text-blaze'
  return 'text-mist/65'
}

function impactBadgeClass(level?: string | null) {
  if (level === 'high') return 'border-blaze/25 bg-blaze/10 text-blaze'
  if (level === 'low') return 'border-neon/20 bg-neon/10 text-neon'
  return 'border-gold/25 bg-gold/10 text-gold'
}

function formatPeriodRange(period: ChangePeriodMetrics) {
  return `${formatDateTime(period.startAt)} - ${formatDateTime(period.endAt)}`
}

function splitVariantLabel(value?: string | null) {
  if (value === 'home') return '首頁'
  if (value === 'bootcamp') return 'BOOTCAMP'
  if (value === 'event') return '活動頁'
  if (value === 'unassigned') return '未分組'
  return value || '-'
}

function routeLabel(value?: string | null) {
  if (value === '/') return '首頁'
  if (value === '/boot-camp') return 'BOOTCAMP'
  if (value === '/fight-night-event') return '活動頁'
  if (value === '/fight-night-intro') return 'Intro'
  if (value === '/offers') return 'Offers'
  if (value === '/payment/success') return '付款成功'
  return value || '-'
}

function statusLabel(status: string) {
  return statusLabels[status] || status
}

function metaCapiLabel(status?: string | null) {
  if (!status) return 'CAPI 未觸發'
  if (status === 'sent') return 'CAPI 已送出'
  if (status === 'skipped') return 'CAPI 未設定'
  if (status === 'failed') return 'CAPI 失敗'
  if (status === 'exception') return 'CAPI 例外'
  return `CAPI ${status}`
}

function lineNotifyLabel(status?: string | null) {
  if (!status) return '確認卡未處理'
  if (status === 'sent') return '確認卡已送'
  if (status === 'sending') return '確認卡發送中'
  if (status === 'failed') return '確認卡失敗'
  if (status === 'skipped_already_sent') return '確認卡已送過'
  if (status === 'skipped_in_progress_or_sent') return '確認卡已送或發送中'
  if (status === 'skipped_missing_token') return '確認卡缺少 Token'
  if (status === 'skipped_no_line_user') return '確認卡未綁 LINE'
  if (status === 'skipped_not_free_reserved') return '非免費預約'
  if (status === 'skipped_not_paid') return '非已付款訂單'
  return `LINE ${status}`
}

function lineRecoveryLabel(status?: string | null) {
  if (!status) return '尚未喚回'
  if (status === 'sent') return '喚回已送'
  if (status === 'sending') return '喚回發送中'
  if (status === 'failed') return '喚回失敗'
  return `喚回 ${status}`
}

function lineRecoveryClass(status?: string | null) {
  if (status === 'sent') return 'border-neon/25 bg-neon/10 text-neon'
  if (status === 'failed') return 'border-blaze/35 bg-blaze/10 text-blaze'
  if (status === 'sending') return 'border-gold/35 bg-gold/10 text-gold'
  return 'border-pearl/12 bg-pearl/5 text-mist/65'
}

function lineMessageStatusLabel(status?: string | null) {
  if (!status) return '未記錄'
  if (status === 'sent') return '已送出'
  if (status === 'sending') return '發送中'
  if (status === 'failed') return '失敗'
  if (status.startsWith('skipped')) return '未送出'
  return status
}

function lineMessageStatusClass(status?: string | null) {
  if (status === 'sent') return 'border-neon/25 bg-neon/10 text-neon'
  if (status === 'failed') return 'border-blaze/35 bg-blaze/10 text-blaze'
  if (status === 'sending') return 'border-gold/35 bg-gold/10 text-gold'
  return 'border-pearl/12 bg-pearl/5 text-mist/65'
}

function lineMessageTypeLabel(type?: string | null) {
  if (type === 'free_trial_confirmation') return '免費體驗預約確認'
  if (type === 'paid_confirmation') return '已付款確認'
  if (type === 'manual_recovery') return '手動喚回'
  return type || 'LINE 訊息'
}

function recoveryTemplateLabel(templateId?: string | null) {
  if (templateId === 'auto') return '依狀態自動選'
  if (templateId === 'pending_checkout') return '待付款提醒'
  if (templateId === 'weekly_trial_invite') return '本週免費體驗'
  if (templateId === 'reserved_to_first_purchase') return '已預約轉首購'
  if (templateId === 'offer_viewed_unpaid') return '看過優惠未付款'
  if (templateId === 'course_reminder') return '課程提醒'
  if (templateId === 'newcomer_entry') return '新手體驗入口'
  if (templateId === 'free_trial_confirmation') return '免費體驗確認卡'
  if (templateId === 'paid_confirmation') return '已付款確認卡'
  return templateId || '-'
}

function recoverySegmentLabel(segment?: string | null) {
  if (segment === 'line_friend_unreserved') return 'LINE 好友未預約'
  if (segment === 'free_reserved_unpaid') return '已預約未購買'
  if (segment === 'checkout_started_unpaid') return '待付款'
  if (segment === 'multi_visit_unreserved') return '多次進站未預約'
  if (segment === 'offer_viewed_unpaid') return '看過優惠未付款'
  if (segment === 'paid') return '已付款'
  if (segment === 'unpaid_unknown') return '未付款'
  return segment || '-'
}

function equipmentPackageLabel(packageId?: string | null) {
  if (packageId === 'gloves-and-wraps') return '全新手綁帶＋拳擊手套'
  if (packageId === 'wraps') return '新手包＋全新手綁帶'
  if (packageId === 'self-or-rental') return '自備或現場租用裝備'
  return ''
}

function servicePreferenceLabels(
  preferences?: AdminOrder['servicePreferences'],
) {
  if (!preferences) return []

  return [
    preferences.handWrapAssist ? '課前準備' : '',
    preferences.quietMode ? '安靜模式' : '',
  ].filter(Boolean)
}

function lineCustomerSearchText(customer: LineCustomer) {
  return [
    customer.displayName,
    customer.lineUserId,
    customer.email,
    customer.buyerName,
    customer.buyerPhone,
    customer.buyerEmail,
    customer.latestOrderReferenceId,
    customer.latestOrderCourseName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function getLineCustomerSegment(customer: LineCustomer) {
  if (customer.recoverySegment) return customer.recoverySegment
  if ((customer.paidOrders || 0) > 0) return 'paid'
  if ((customer.pendingOrders || 0) > 0) return 'checkout_started_unpaid'
  if ((customer.freeReservedOrders || 0) > 0) return 'free_reserved_unpaid'
  if ((customer.totalOrders || 0) <= 0 && (customer.accessCount || 0) > 1) {
    return 'multi_visit_unreserved'
  }
  if ((customer.totalOrders || 0) <= 0) return 'line_friend_unreserved'
  return 'unpaid_unknown'
}

function suggestedRecoveryTemplate(customer: LineCustomer): RecoveryTemplateId {
  if (customer.suggestedRecoveryTemplateId) {
    return customer.suggestedRecoveryTemplateId
  }
  if ((customer.pendingOrders || 0) > 0) return 'pending_checkout'
  if ((customer.freeReservedOrders || 0) > 0) return 'reserved_to_first_purchase'
  if ((customer.accessCount || 0) > 1) return 'course_reminder'
  return 'newcomer_entry'
}

function isRecentWithinHours(value: string | null | undefined, hours: number) {
  if (!value) return false
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`
  const time = new Date(normalized).getTime()
  if (!Number.isFinite(time)) return false
  return Date.now() - time < hours * 60 * 60 * 1000
}

function getLineCustomerBlockers(
  customer: LineCustomer,
  templateId: RecoveryTemplateId,
) {
  const selectedTemplate =
    templateId === 'auto' ? suggestedRecoveryTemplate(customer) : templateId
  const blockers: string[] = []
  if (!customer.isFriend) blockers.push('非好友')
  if ((customer.paidOrders || 0) > 0) blockers.push('已付款')
  if (
    customer.latestRecoveryTemplateId === selectedTemplate &&
    isRecentWithinHours(
      customer.latestRecoverySentAt || customer.latestRecoveryAttemptedAt,
      24,
    )
  ) {
    blockers.push('24 小時內已發同模板')
  }
  return blockers
}

function statusClass(status: string) {
  if (status === 'free_reserved') return 'border-neon/30 bg-neon/10 text-neon'
  if (status === 'paid') return 'border-neon/30 bg-neon/10 text-neon'
  if (status === 'pending') return 'border-gold/35 bg-gold/10 text-gold'
  return 'border-blaze/35 bg-blaze/10 text-blaze'
}

function linePaymentLabel(customer: LineCustomer) {
  if ((customer.paidOrders || 0) > 0) return '已付款'
  if ((customer.pendingOrders || 0) > 0) return '待付款'
  return '未購買'
}

function linePaymentClass(customer: LineCustomer) {
  if ((customer.paidOrders || 0) > 0) return 'border-neon/25 bg-neon/10 text-neon'
  if ((customer.pendingOrders || 0) > 0) return 'border-gold/35 bg-gold/10 text-gold'
  return 'border-pearl/12 bg-pearl/5 text-mist/70'
}

function sameEmail(left?: string | null, right?: string | null) {
  const normalizedLeft = String(left || '').trim().toLowerCase()
  const normalizedRight = String(right || '').trim().toLowerCase()
  return normalizedLeft !== '' && normalizedLeft === normalizedRight
}

async function fetchAdmin<T>(path: string, token: string): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'x-admin-token': token,
    },
    cache: 'no-store',
  })
  const data = (await response.json().catch(() => ({}))) as T & ApiError

  if (!response.ok) {
    throw new Error(data.error || '後台資料讀取失敗')
  }

  return data
}

async function postAdmin<T>(
  path: string,
  token: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'x-admin-token': token,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const data = (await response.json().catch(() => ({}))) as T & ApiError

  if (!response.ok) {
    throw new Error(data.error || '後台操作失敗')
  }

  return data
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-lg border border-pearl/10 bg-black/28 p-4">
      <p className="font-heading text-xs tracking-[0.18em] text-mist/60">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-black text-pearl md:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-sm text-mist/65">{detail}</p>
    </div>
  )
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="border-y border-pearl/10 py-12 text-center text-sm text-mist/65">
      {children}
    </div>
  )
}

function OrderLineLinkControl({
  order,
  customers,
  onLinkLine,
}: {
  order: AdminOrder
  customers: LineCustomer[]
  onLinkLine: (referenceId: string, lineUserId: string) => Promise<void>
}) {
  const [selectedLineUserId, setSelectedLineUserId] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (customers.length === 0) {
    return <p className="mt-3 text-xs text-blaze/70">未綁 LINE 用戶</p>
  }

  const handleLink = async () => {
    if (!selectedLineUserId) return
    setIsSaving(true)
    try {
      await onLinkLine(order.referenceId, selectedLineUserId)
      setSelectedLineUserId('')
    } catch {
      // Parent surface shows the API error.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mt-3 grid gap-2">
      <p className="text-xs text-blaze/70">未綁 LINE 用戶</p>
      <div className="flex gap-2">
        <select
          value={selectedLineUserId}
          onChange={(event) => setSelectedLineUserId(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-pearl/10 bg-black/35 px-2 py-1.5 text-xs text-pearl"
        >
          <option value="">選擇 LINE 用戶</option>
          {customers.map((customer) => (
            <option key={customer.lineUserId} value={customer.lineUserId}>
              {customer.displayName} {linePaymentLabel(customer)}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selectedLineUserId || isSaving}
          onClick={() => void handleLink()}
          className="shrink-0 rounded-lg border border-neon/25 bg-neon/10 px-3 py-1.5 text-xs font-heading text-neon disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? '綁定中' : '綁定'}
        </button>
      </div>
    </div>
  )
}

function OrdersTable({
  orders,
  customers,
  onLinkLine,
  onResendLineConfirmation,
}: {
  orders: AdminOrder[]
  customers: LineCustomer[]
  onLinkLine: (referenceId: string, lineUserId: string) => Promise<void>
  onResendLineConfirmation: (referenceId: string) => Promise<void>
}) {
  const [resendingReferenceId, setResendingReferenceId] = useState<string | null>(
    null,
  )
  if (orders.length === 0) return <EmptyState>目前還沒有訂單資料。</EmptyState>

  const handleResendLineConfirmation = async (referenceId: string) => {
    setResendingReferenceId(referenceId)
    try {
      await onResendLineConfirmation(referenceId)
    } finally {
      setResendingReferenceId(null)
    }
  }

  return (
    <div className="overflow-x-auto border-y border-pearl/10">
      <table className="min-w-[980px] w-full text-left text-sm">
        <thead className="bg-pearl/[0.03] font-heading text-xs tracking-[0.16em] text-mist/60">
          <tr>
            <th className="px-4 py-3">狀態</th>
            <th className="px-4 py-3">客戶</th>
            <th className="px-4 py-3">課程</th>
            <th className="px-4 py-3">金額</th>
            <th className="px-4 py-3">來源</th>
            <th className="px-4 py-3">時間</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pearl/8">
          {orders.map((order) => (
            <tr key={order.referenceId} className="align-top">
              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-heading ${statusClass(order.status)}`}
                >
                  {statusLabel(order.status)}
                </span>
                <p className="mt-2 font-mono text-[11px] text-mist/45">
                  {order.referenceId}
                </p>
                <p className="mt-2 text-[11px] text-mist/45">
                  {metaCapiLabel(order.metaCapiStatus)}
                </p>
                <p
                  className={`mt-1 text-[11px] ${
                    order.linePaymentNotifyStatus === 'sent'
                      ? 'text-neon/70'
                      : order.linePaymentNotifyStatus === 'failed'
                        ? 'text-coral/70'
                        : 'text-mist/45'
                  }`}
                >
                  {lineNotifyLabel(order.linePaymentNotifyStatus)}
                </p>
                {order.linePaymentNotifyError && (
                  <p className="mt-1 max-w-[180px] truncate text-[11px] text-coral/70">
                    {order.linePaymentNotifyError}
                  </p>
                )}
                {order.metaCapiError && (
                  <p className="mt-1 max-w-[180px] truncate text-[11px] text-coral/70">
                    {order.metaCapiError}
                  </p>
                )}
                {(order.status === 'free_reserved' || order.status === 'paid') && (
                  <button
                    type="button"
                    disabled={!order.lineUserId || resendingReferenceId === order.referenceId}
                    onClick={() =>
                      void handleResendLineConfirmation(order.referenceId)
                    }
                    className="mt-2 rounded-lg border border-neon/25 bg-neon/10 px-2.5 py-1 text-[11px] font-heading text-neon disabled:cursor-not-allowed disabled:border-pearl/10 disabled:bg-pearl/5 disabled:text-mist/45"
                  >
                    {resendingReferenceId === order.referenceId
                      ? '重送中'
                      : '重送確認卡'}
                  </button>
                )}
              </td>
              <td className="px-4 py-4">
                <p className="font-medium text-pearl">{order.buyerName}</p>
                <p className="mt-1 text-mist/65">{order.buyerPhone}</p>
                {order.buyerEmail && (
                  <p className="mt-1 text-mist/45">{order.buyerEmail}</p>
                )}
                {order.lineEmail && !sameEmail(order.lineEmail, order.buyerEmail) && (
                  <p className="mt-1 break-all text-[11px] text-gold/75">
                    LINE email: {order.lineEmail}
                    {order.lineEmailVerified ? ' verified' : ' unverified'}
                  </p>
                )}
                {order.lineUserId ? (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-pearl/10 bg-black/25 p-2">
                    {order.linePictureUrl ? (
                      <img
                        src={order.linePictureUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 shrink-0 rounded-full bg-pearl/8" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-heading text-neon">
                        LINE {order.lineDisplayName || '已綁定'}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-mist/45">
                        {order.lineUserId}
                      </p>
                    </div>
                  </div>
                ) : (
                  <OrderLineLinkControl
                    order={order}
                    customers={customers}
                    onLinkLine={onLinkLine}
                  />
                )}
              </td>
              <td className="px-4 py-4">
                <p className="font-medium text-pearl">{order.courseName}</p>
                <p className="mt-1 text-mist/65">
                  {order.venueName} · {order.coach}
                </p>
                <p className="mt-1 text-mist/45">
                  {order.category === 'BOOT_CAMP'
                    ? `${order.packageSize} 堂 Boot Camp`
                    : '單堂 Fight Night'}
                  {order.route ? ` · ${order.route}` : ''}
                </p>
                {order.eventPassVariantLabel && (
                  <p className="mt-1 text-mist/55">
                    方案：{order.eventPassVariantLabel}
                  </p>
                )}
                {equipmentPackageLabel(order.equipmentPackage) && (
                  <p className="mt-1 text-mist/55">
                    裝備：{equipmentPackageLabel(order.equipmentPackage)}
                  </p>
                )}
                {servicePreferenceLabels(order.servicePreferences).length > 0 && (
                  <p className="mt-1 text-mist/55">
                    偏好：{servicePreferenceLabels(order.servicePreferences).join('、')}
                  </p>
                )}
                {order.seriesDates.length > 0 && (
                  <p className="mt-1 text-mist/45">
                    {order.seriesDates.join(' / ')}
                  </p>
                )}
              </td>
              <td className="px-4 py-4 font-heading text-neon">
                {formatMoney(order.amountValue)}
              </td>
              <td className="max-w-[220px] px-4 py-4 text-mist/60">
                <span className="line-clamp-3 break-all">
                  {order.sourcePath || '-'}
                </span>
              </td>
              <td className="px-4 py-4 text-mist/65">
                <p>建立 {formatDateTime(order.createdAt)}</p>
                <p className="mt-1">
                  {order.status === 'free_reserved' ? '預約' : '付款'}{' '}
                  {formatDateTime(
                    order.status === 'free_reserved' ? order.updatedAt : order.paidAt,
                  )}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InventoryTable({ inventory }: { inventory: InventoryRecord[] }) {
  if (inventory.length === 0) return <EmptyState>目前還沒有庫存異動。</EmptyState>

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {inventory.map((item) => {
        const ratio = item.capacity > 0 ? item.sold / item.capacity : 0
        return (
          <div
            key={item.sessionId}
            className="rounded-lg border border-pearl/10 bg-black/28 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-heading text-sm text-pearl">
                  {item.sessionId}
                </p>
                <p className="mt-1 text-xs text-mist/55">
                  更新 {formatDateTime(item.updatedAt)}
                </p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-heading ${
                  item.remaining <= 2
                    ? 'border-blaze/35 bg-blaze/10 text-blaze'
                    : 'border-neon/25 bg-neon/10 text-neon'
                }`}
              >
                剩 {item.remaining}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-pearl/8">
              <div
                className="h-full rounded-full bg-neon"
                style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-mist/70">
              已售 {item.sold} / 容量 {item.capacity}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function EventsTable({ events }: { events: TrackingEventRow[] }) {
  if (events.length === 0) return <EmptyState>目前還沒有匿名事件。</EmptyState>

  return (
    <div className="overflow-x-auto border-y border-pearl/10">
      <table className="min-w-[900px] w-full text-left text-sm">
        <thead className="bg-pearl/[0.03] font-heading text-xs tracking-[0.16em] text-mist/60">
          <tr>
            <th className="px-4 py-3">事件</th>
            <th className="px-4 py-3">頁面</th>
            <th className="px-4 py-3">匿名 ID</th>
            <th className="px-4 py-3">來源</th>
            <th className="px-4 py-3">時間</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pearl/8">
          {events.map((event) => (
            <tr key={event.id} className="align-top">
              <td className="px-4 py-4">
                <p className="font-heading text-pearl">{event.eventName}</p>
                {typeof event.eventValue === 'number' && (
                  <p className="mt-1 text-neon">
                    {formatMoney(event.eventValue)}
                  </p>
                )}
              </td>
              <td className="max-w-[240px] px-4 py-4 text-mist/65">
                <p className="font-heading text-pearl/85">
                  {routeLabel(event.canonicalRoutePath || event.routePath)}
                </p>
                {event.routePath && event.routePath !== event.canonicalRoutePath && (
                  <p className="mt-1 line-clamp-2 break-all font-mono text-[11px] text-mist/45">
                    {event.routePath}
                  </p>
                )}
              </td>
              <td className="px-4 py-4 font-mono text-xs text-mist/55">
                {event.anonymousId}
              </td>
              <td className="max-w-[240px] px-4 py-4 text-mist/55">
                <p className="font-heading text-pearl/85">
                  {event.sourceChannel || 'direct'}
                  {event.deviceType ? ` · ${event.deviceType}` : ''}
                </p>
                {event.experimentVariant && (
                  <p className="mt-1 text-xs text-neon/75">
                    {splitVariantLabel(event.experimentVariant)}
                  </p>
                )}
                {(event.browserName || event.osName || event.inAppBrowser) && (
                  <p className="mt-1 text-xs text-mist/55">
                    {[event.browserName, event.osName, event.inAppBrowser]
                      .filter(Boolean)
                      .join(' / ')}
                  </p>
                )}
                {(event.visitorType || event.sessionIndex) && (
                  <p className="mt-1 text-xs text-mist/45">
                    {[event.visitorType, event.sessionIndex ? `S${event.sessionIndex}` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {(event.city || event.country) && (
                  <p className="mt-1 text-xs text-mist/55">
                    {[event.city, event.region, event.country].filter(Boolean).join(' / ')}
                  </p>
                )}
                {(event.cfAsOrganization || event.colo) && (
                  <p className="mt-1 line-clamp-2 text-xs text-mist/45">
                    {[event.cfAsOrganization, event.cfAsn ? `AS${event.cfAsn}` : '', event.colo]
                      .filter(Boolean)
                      .join(' / ')}
                  </p>
                )}
                {(event.utmCampaign || event.utmSource) && (
                  <p className="mt-1 line-clamp-2 break-all text-xs text-mist/45">
                    {[event.utmSource, event.utmMedium, event.utmCampaign]
                      .filter(Boolean)
                      .join(' / ')}
                  </p>
                )}
                {event.sectionId && (
                  <p className="mt-1 text-xs text-neon/75">
                    #{event.sectionId}
                  </p>
                )}
                {event.ctaId && (
                  <p className="mt-1 line-clamp-2 break-all text-xs text-gold/75">
                    CTA {event.ctaId}
                  </p>
                )}
                {event.sourceUrl && (
                  <p className="mt-1 line-clamp-2 break-all text-[11px] text-mist/35">
                    {event.sourceUrl}
                  </p>
                )}
              </td>
              <td className="px-4 py-4 text-mist/65">
                {formatDateTime(event.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function LineCustomersTable({ customers }: { customers: LineCustomer[] }) {
  if (customers.length === 0) return <EmptyState>目前還沒有 LINE 足跡。</EmptyState>

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {customers.map((customer) => (
        <div
          key={customer.lineUserId}
          className="flex gap-3 rounded-lg border border-pearl/10 bg-black/28 p-4"
        >
          {customer.pictureUrl ? (
            <img
              src={customer.pictureUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 shrink-0 rounded-full bg-pearl/8" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-heading text-pearl">
                {customer.displayName}
              </p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-heading ${
                  customer.isFriend
                    ? 'border-neon/25 bg-neon/10 text-neon'
                    : 'border-gold/30 bg-gold/10 text-gold'
                }`}
              >
                {customer.isFriend ? '好友' : '未加好友'}
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-mist/45">
              {customer.lineUserId}
            </p>
            <p className="mt-2 text-sm text-mist/65">
              通過 {customer.accessCount} 次 · 最近{' '}
              {formatDateTime(customer.lastSeenAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function LineRecoveryCarouselPreview({
  previews,
}: {
  previews: LineRecoveryPreview[]
}) {
  if (previews.length === 0) return null

  return (
    <div className="grid gap-4">
      {previews.map((preview) => (
        <div
          key={preview.templateId}
          className="rounded-lg border border-pearl/10 bg-black/35 p-4"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="font-heading text-sm text-pearl">
              {recoveryTemplateLabel(preview.templateId)}
            </p>
            <span className="rounded-full border border-pearl/12 bg-pearl/5 px-2.5 py-1 text-xs text-mist/75">
              {preview.targetKind === 'shopline_checkout'
                ? 'Shopline checkout'
                : 'Fight Night / 618 頁面'}
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto rounded-lg bg-[#151515] px-2 py-4 pb-5">
            {(preview.cards?.length
              ? preview.cards
              : [
                  {
                    imageUrl: null,
                    imageOnly: false,
                    eyebrow: preview.eyebrow,
                    title: preview.title,
                    body: preview.body,
                    paragraphs: [preview.body],
                    meta: preview.meta,
                    button: preview.button,
                  },
                ]
            ).map((card, index) => (
              <article
                key={`${preview.templateId}-${index}`}
                className="flex min-h-[520px] w-[310px] shrink-0 flex-col overflow-hidden rounded-[24px] bg-[#F7FBFF] text-[#253349] shadow-2xl"
              >
                {card.imageOnly && card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt=""
                    className="h-full min-h-[520px] w-full object-cover"
                  />
                ) : (
                  <>
                    {card.imageUrl && (
                      <img
                        src={card.imageUrl}
                        alt=""
                        className="h-[185px] w-full object-cover"
                      />
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <p className="font-heading text-[11px] font-bold tracking-[0.18em] text-[#073DAE]">
                        {card.eyebrow}
                      </p>
                      <h3 className="mt-3 font-heading text-[24px] font-black leading-tight text-[#073DAE]">
                        {card.title}
                      </h3>
                      <div className="mt-5 grid gap-4">
                        {(card.paragraphs?.length
                          ? card.paragraphs
                          : [card.body]
                        ).map((paragraph, paragraphIndex) => (
                          <p
                            key={`${preview.templateId}-${index}-${paragraphIndex}`}
                            className="text-[15px] leading-[1.85] text-[#253349]"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                      <p className="mt-auto border-t border-[#DDE7F5] pt-4 text-[13px] leading-relaxed text-[#65718A]">
                        {card.meta}
                      </p>
                      <p className="mt-4 rounded-md bg-[#073DAE] px-4 py-3 text-center font-heading text-[15px] font-bold text-white">
                        {card.button}
                      </p>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
          {preview.targetUrl && (
            <p className="mt-2 break-all font-mono text-[11px] text-mist/45">
              {preview.targetUrl}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

const lineCustomerFilters: Array<{ id: string; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'sendable', label: '可發送' },
  { id: 'line_friend_unreserved', label: '未預約' },
  { id: 'free_reserved_unpaid', label: '已預約未購買' },
  { id: 'checkout_started_unpaid', label: '待付款' },
  { id: 'multi_visit_unreserved', label: '多次進站' },
  { id: 'recent_sent', label: '近期已發' },
  { id: 'paid', label: '已付款' },
  { id: 'blocked', label: '不可發' },
]

function LineCustomersTableV2({
  customers,
  onPreviewBatch,
  onSendBatch,
}: {
  customers: LineCustomer[]
  onPreviewBatch: (
    lineUserIds: string[],
    templateId: RecoveryTemplateId,
    segment?: string | null,
  ) => Promise<LineRecoveryBatchPreviewResponse>
  onSendBatch: (
    lineUserIds: string[],
    templateId: RecoveryTemplateId,
    segment: string | null,
    staffNote: string,
  ) => Promise<LineRecoveryBatchSendResponse>
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedTemplate, setSelectedTemplate] = useState<RecoveryTemplateId>('auto')
  const [segmentFilter, setSegmentFilter] = useState('sendable')
  const [query, setQuery] = useState('')
  const [staffNote, setStaffNote] = useState('')
  const [batchPreview, setBatchPreview] = useState<LineRecoveryBatchPreviewResponse | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    setBatchPreview(null)
    setIsConfirming(false)
  }, [selectedTemplate, segmentFilter, query])

  const customerById = useMemo(() => {
    return new Map(customers.map((customer) => [customer.lineUserId, customer]))
  }, [customers])

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return customers.filter((customer) => {
      const blockers = getLineCustomerBlockers(customer, selectedTemplate)
      const segment = getLineCustomerSegment(customer)
      const latestRecoveryTime =
        customer.latestRecoverySentAt || customer.latestRecoveryAttemptedAt

      if (normalizedQuery && !lineCustomerSearchText(customer).includes(normalizedQuery)) {
        return false
      }
      if (segmentFilter === 'all') return true
      if (segmentFilter === 'sendable') return blockers.length === 0
      if (segmentFilter === 'blocked') return blockers.length > 0
      if (segmentFilter === 'recent_sent') return Boolean(latestRecoveryTime)
      return segment === segmentFilter
    })
  }, [customers, query, segmentFilter, selectedTemplate])

  const selectedLineUserIds = useMemo(
    () =>
      Array.from(selectedIds).filter((lineUserId) => {
        const customer = customerById.get(lineUserId)
        return customer && getLineCustomerBlockers(customer, selectedTemplate).length === 0
      }),
    [customerById, selectedIds, selectedTemplate],
  )

  const visibleSelectableIds = useMemo(
    () =>
      filteredCustomers
        .filter((customer) => getLineCustomerBlockers(customer, selectedTemplate).length === 0)
        .map((customer) => customer.lineUserId),
    [filteredCustomers, selectedTemplate],
  )

  const allVisibleSelected =
    visibleSelectableIds.length > 0 &&
    visibleSelectableIds.every((lineUserId) => selectedIds.has(lineUserId))

  const visibleBlockedCount = filteredCustomers.filter(
    (customer) => getLineCustomerBlockers(customer, selectedTemplate).length > 0,
  ).length

  const toggleSelected = (lineUserId: string, checked: boolean) => {
    setBatchPreview(null)
    setIsConfirming(false)
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(lineUserId)
      else next.delete(lineUserId)
      return next
    })
  }

  const toggleVisible = (checked: boolean) => {
    setBatchPreview(null)
    setIsConfirming(false)
    setSelectedIds((current) => {
      const next = new Set(current)
      visibleSelectableIds.forEach((lineUserId) => {
        if (checked) next.add(lineUserId)
        else next.delete(lineUserId)
      })
      return next
    })
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setBatchPreview(null)
    setIsConfirming(false)
  }

  const handlePreviewBatch = async () => {
    if (selectedLineUserIds.length === 0 || isPreviewing) return
    setIsPreviewing(true)
    setIsConfirming(false)
    try {
      const response = await onPreviewBatch(
        selectedLineUserIds,
        selectedTemplate,
        segmentFilter === 'all' || segmentFilter === 'sendable' || segmentFilter === 'blocked'
          ? null
          : segmentFilter,
      )
      setBatchPreview(response)
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleSendBatch = async () => {
    if (!batchPreview || batchPreview.sendableCount <= 0 || isSending) return
    setIsSending(true)
    try {
      await onSendBatch(
        selectedLineUserIds,
        selectedTemplate,
        segmentFilter === 'all' || segmentFilter === 'sendable' || segmentFilter === 'blocked'
          ? null
          : segmentFilter,
        staffNote,
      )
      clearSelection()
      setStaffNote('')
    } finally {
      setIsSending(false)
    }
  }

  if (customers.length === 0) return <EmptyState>尚無 LINE 用戶紀錄</EmptyState>

  return (
    <div className="grid gap-4">
      <section className="rounded-lg border border-pearl/10 bg-black/24 p-4">
        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="font-heading text-[11px] tracking-[0.16em] text-mist/50">
                Search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="LINE 名稱 / 電話 / Email / 訂單編號"
                className="w-full rounded-lg border border-pearl/10 bg-black/35 px-3 py-2 text-sm text-pearl outline-none placeholder:text-mist/35 focus:border-neon/35"
              />
            </label>
            <label className="grid gap-1">
              <span className="font-heading text-[11px] tracking-[0.16em] text-mist/50">
                Template
              </span>
              <select
                value={selectedTemplate}
                onChange={(event) => setSelectedTemplate(event.target.value as RecoveryTemplateId)}
                className="w-full rounded-lg border border-pearl/10 bg-black/35 px-3 py-2 text-sm text-pearl outline-none focus:border-neon/35"
              >
                {recoveryTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-1">
            <span className="font-heading text-[11px] tracking-[0.16em] text-mist/50">
              Staff note
            </span>
            <input
              value={staffNote}
              onChange={(event) => setStaffNote(event.target.value)}
              placeholder="例如：6/3 晚上再行銷，未付款名單"
              className="w-full rounded-lg border border-pearl/10 bg-black/35 px-3 py-2 text-sm text-pearl outline-none placeholder:text-mist/35 focus:border-neon/35"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {lineCustomerFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setSegmentFilter(filter.id)}
              className={`rounded-lg border px-3 py-1.5 font-heading text-xs transition-colors ${
                segmentFilter === filter.id
                  ? 'border-neon/40 bg-neon/15 text-neon'
                  : 'border-pearl/10 bg-pearl/5 text-mist/70 hover:text-pearl'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-wrap gap-2 text-sm text-mist/65">
            <span>顯示 {filteredCustomers.length} 人</span>
            <span>可勾選 {visibleSelectableIds.length} 人</span>
            <span>不可發 {visibleBlockedCount} 人</span>
            <span>已選 {selectedLineUserIds.length} 人</span>
            {batchPreview && (
              <span className="text-neon">
                預覽可發 {batchPreview.sendableCount} / 擋下 {batchPreview.blockedCount}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearSelection}
              disabled={selectedLineUserIds.length === 0}
              className="rounded-lg border border-pearl/15 bg-pearl/5 px-3 py-2 font-heading text-sm text-pearl transition-colors hover:border-neon/35 disabled:cursor-not-allowed disabled:opacity-45"
            >
              清除選取
            </button>
            <button
              type="button"
              onClick={() => void handlePreviewBatch()}
              disabled={selectedLineUserIds.length === 0 || isPreviewing}
              className="rounded-lg border border-pearl/15 bg-pearl/5 px-3 py-2 font-heading text-sm text-pearl transition-colors hover:border-neon/35 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isPreviewing ? '預覽中...' : '批次預覽'}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              disabled={!batchPreview || batchPreview.sendableCount === 0}
              className="rounded-lg border border-neon/30 bg-neon/12 px-3 py-2 font-heading text-sm text-neon transition-colors hover:border-neon/50 disabled:cursor-not-allowed disabled:border-pearl/10 disabled:bg-pearl/5 disabled:text-mist/45"
            >
              人工發送
            </button>
          </div>
        </div>
      </section>

      {batchPreview && <LineRecoveryCarouselPreview previews={batchPreview.previews} />}

      <div className="overflow-x-auto border-y border-pearl/10">
        <table className="min-w-[1280px] w-full text-left text-sm">
          <thead className="bg-pearl/[0.03] font-heading text-xs tracking-[0.16em] text-mist/60">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(event) => toggleVisible(event.target.checked)}
                  disabled={visibleSelectableIds.length === 0}
                />
              </th>
              <th className="px-4 py-3">客戶</th>
              <th className="px-4 py-3">分群</th>
              <th className="px-4 py-3">行為</th>
              <th className="px-4 py-3">訂單 / 預約</th>
              <th className="px-4 py-3">最近 LINE</th>
              <th className="px-4 py-3">模板</th>
              <th className="px-4 py-3">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pearl/8">
            {filteredCustomers.map((customer) => {
              const blockers = getLineCustomerBlockers(customer, selectedTemplate)
              const selectable = blockers.length === 0
              const selected = selectedIds.has(customer.lineUserId) && selectable
              const segment = getLineCustomerSegment(customer)
              const suggestedTemplate = suggestedRecoveryTemplate(customer)
              const latestOrderTime =
                customer.latestOrderPaidAt || customer.latestOrderCreatedAt
              const latestRecoveryTime =
                customer.latestRecoverySentAt || customer.latestRecoveryAttemptedAt

              return (
                <tr key={customer.lineUserId} className="align-top">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!selectable}
                      onChange={(event) =>
                        toggleSelected(customer.lineUserId, event.target.checked)
                      }
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      {customer.pictureUrl ? (
                        <img
                          src={customer.pictureUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-full bg-pearl/8" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-heading text-pearl">
                          {customer.displayName || '未知 LINE 用戶'}
                        </p>
                        <p className="mt-1 break-all font-mono text-[11px] text-mist/45">
                          {customer.lineUserId}
                        </p>
                        {customer.email && (
                          <p className="mt-1 break-all text-[11px] text-gold/70">
                            LINE email: {customer.email}
                            {customer.emailVerified ? ' verified' : ' unverified'}
                          </p>
                        )}
                        {(customer.buyerName || customer.buyerPhone || customer.buyerEmail) && (
                          <p className="mt-1 break-all text-[11px] text-mist/45">
                            {[customer.buyerName, customer.buyerPhone, customer.buyerEmail]
                              .filter(Boolean)
                              .join(' / ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="grid gap-1">
                      <span
                        className={`w-fit rounded-full border px-2.5 py-1 text-xs font-heading ${
                          customer.isFriend
                            ? 'border-neon/25 bg-neon/10 text-neon'
                            : 'border-gold/30 bg-gold/10 text-gold'
                        }`}
                      >
                        {customer.isFriend ? '好友' : '未加好友'}
                      </span>
                      <span className="w-fit rounded-full border border-pearl/12 bg-pearl/5 px-2.5 py-1 text-xs text-mist/75">
                        {recoverySegmentLabel(segment)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-mist/65">
                    <p>進站 {customer.accessCount || 0} 次</p>
                    <p className="mt-1 text-xs text-mist/45">
                      最近 {formatDateTime(customer.lastSeenAt)}
                    </p>
                    <p className="mt-1 text-xs text-mist/45">
                      首次 {formatDateTime(customer.firstSeenAt)}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="grid gap-1 text-sm">
                      <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-heading ${linePaymentClass(customer)}`}>
                        {linePaymentLabel(customer)}
                      </span>
                      <p className="text-mist/65">
                        付款 {customer.paidOrders || 0} · 免費 {customer.freeReservedOrders || 0} · 待付款 {customer.pendingOrders || 0}
                      </p>
                      {customer.latestOrderReferenceId ? (
                        <>
                          <p className="line-clamp-1 text-pearl">
                            {customer.latestOrderCourseName || '未命名課程'}
                          </p>
                          <p className="font-mono text-[11px] text-mist/45">
                            {customer.latestOrderReferenceId}
                          </p>
                          <p className="text-xs text-mist/45">
                            {statusLabel(customer.latestOrderStatus || '')} · {formatDateTime(latestOrderTime)}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-mist/45">尚未建立訂單</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-heading ${lineRecoveryClass(customer.latestRecoveryStatus)}`}>
                      {lineRecoveryLabel(customer.latestRecoveryStatus)}
                    </span>
                    {latestRecoveryTime && (
                      <p className="mt-2 text-xs text-mist/45">
                        {formatDateTime(latestRecoveryTime)}
                      </p>
                    )}
                    {customer.latestRecoveryTemplateId && (
                      <p className="mt-1 text-[11px] text-mist/45">
                        {recoveryTemplateLabel(customer.latestRecoveryTemplateId)}
                      </p>
                    )}
                    {customer.latestRecoveryError && (
                      <p className="mt-1 line-clamp-2 text-xs text-blaze/75">
                        {customer.latestRecoveryError}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-mist/65">
                    <p className="font-heading text-pearl">
                      {selectedTemplate === 'auto'
                        ? recoveryTemplateLabel(suggestedTemplate)
                        : recoveryTemplateLabel(selectedTemplate)}
                    </p>
                    <p className="mt-1 text-xs text-mist/45">
                      建議 {recoveryTemplateLabel(suggestedTemplate)}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {selectable ? (
                      <span className="rounded-full border border-neon/25 bg-neon/10 px-2.5 py-1 text-xs font-heading text-neon">
                        可發送
                      </span>
                    ) : (
                      <div className="grid gap-1">
                        {blockers.map((blocker) => (
                          <span
                            key={blocker}
                            className="w-fit rounded-full border border-blaze/30 bg-blaze/10 px-2.5 py-1 text-xs text-blaze"
                          >
                            {blocker}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredCustomers.length === 0 && (
        <EmptyState>目前沒有符合條件的 LINE 用戶。</EmptyState>
      )}

      {isConfirming && batchPreview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-lg border border-pearl/12 bg-abyss p-5 shadow-2xl">
            <p className="font-heading text-xs tracking-[0.18em] text-blaze">
              Manual LINE Recovery
            </p>
            <h3 className="mt-2 font-heading text-2xl font-black text-pearl">
              確認人工發送
            </h3>
            <div className="mt-4 grid gap-2 text-sm text-mist/70">
              <p>模板：{recoveryTemplateLabel(selectedTemplate)}</p>
              <p>已選：{batchPreview.selectedCount} 人</p>
              <p>會發送：{batchPreview.sendableCount} 人</p>
              <p>被擋下：{batchPreview.blockedCount} 人</p>
              {staffNote && <p>備註：{staffNote}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                className="rounded-lg border border-pearl/15 bg-pearl/5 px-4 py-2 font-heading text-sm text-pearl"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void handleSendBatch()}
                disabled={isSending}
                className="rounded-lg border border-neon/30 bg-neon px-4 py-2 font-heading text-sm text-abyss disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSending ? '發送中...' : `送出 ${batchPreview.sendableCount} 則`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
function LineMessagesTable({ messages }: { messages: LineMessageRecord[] }) {
  if (messages.length === 0) {
    return <EmptyState>目前還沒有 LINE 發送紀錄。</EmptyState>
  }

  return (
    <div className="overflow-x-auto border-y border-pearl/10">
      <table className="min-w-[1040px] w-full text-left text-sm">
        <thead className="bg-pearl/[0.03] font-heading text-xs tracking-[0.16em] text-mist/60">
          <tr>
            <th className="px-4 py-3">訊息</th>
            <th className="px-4 py-3">客戶</th>
            <th className="px-4 py-3">來源</th>
            <th className="px-4 py-3">狀態</th>
            <th className="px-4 py-3">時間</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pearl/8">
          {messages.map((message) => (
            <tr key={message.messageId} className="align-top">
              <td className="px-4 py-4">
                <p className="font-heading text-pearl">
                  {lineMessageTypeLabel(message.messageType)}
                </p>
                <p className="mt-1 text-sm text-mist/65">
                  {message.title ||
                    message.altText ||
                    recoveryTemplateLabel(message.templateId)}
                </p>
                {message.templateId && (
                  <p className="mt-1 text-[11px] text-mist/45">
                    模板 {recoveryTemplateLabel(message.templateId)}
                  </p>
                )}
                {message.courseName && (
                  <p className="mt-1 line-clamp-1 text-xs text-mist/45">
                    {message.courseName}
                  </p>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-start gap-2">
                  {message.pictureUrl ? (
                    <img
                      src={message.pictureUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 shrink-0 rounded-full bg-pearl/8" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-pearl">
                      {message.displayName || message.buyerName || '未知客戶'}
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-mist/45">
                      {message.lineUserId || '-'}
                    </p>
                    {(message.buyerPhone || message.buyerEmail) && (
                      <p className="mt-1 break-all text-[11px] text-mist/45">
                        {[message.buyerPhone, message.buyerEmail]
                          .filter(Boolean)
                          .join(' / ')}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="rounded-full border border-pearl/12 bg-pearl/5 px-2.5 py-1 text-xs font-heading text-mist/75">
                  {message.source === 'auto' ? '自動確認' : '後台手動'}
                </span>
                {message.segment && (
                  <p className="mt-2 text-xs text-mist/55">
                    分群 {recoverySegmentLabel(message.segment)}
                  </p>
                )}
                {message.batchId && (
                  <p className="mt-1 break-all font-mono text-[11px] text-mist/45">
                    {message.batchId}
                  </p>
                )}
                {message.referenceId && (
                  <p className="mt-2 break-all font-mono text-[11px] text-mist/45">
                    {message.referenceId}
                  </p>
                )}
                {message.targetUrl && (
                  <a
                    href={message.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block max-w-[220px] truncate text-xs text-neon"
                  >
                    目標連結
                  </a>
                )}
                {message.staffNote && (
                  <p className="mt-2 line-clamp-2 text-xs text-mist/45">
                    備註：{message.staffNote}
                  </p>
                )}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-heading ${lineMessageStatusClass(
                    message.status,
                  )}`}
                >
                  {lineMessageStatusLabel(message.status)}
                </span>
                {message.error && (
                  <p className="mt-2 line-clamp-2 text-xs text-blaze/75">
                    {message.error}
                  </p>
                )}
              </td>
              <td className="px-4 py-4 text-mist/65">
                <p>{formatDateTime(message.sentAt || message.attemptedAt)}</p>
                <p className="mt-1 text-[11px] text-mist/45">
                  建立 {formatDateTime(message.createdAt)}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PeriodSummaryCard({
  title,
  period,
}: {
  title: string
  period: ChangePeriodMetrics
}) {
  return (
    <div className="rounded-lg border border-pearl/8 bg-black/24 p-3">
      <p className="font-heading text-xs uppercase tracking-[0.16em] text-mist/50">
        {title}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-mist/60">
        {formatPeriodRange(period)}
      </p>
      <p className="mt-1 text-xs text-mist/45">
        期間 {formatNumber(period.durationDays, 1)} 天
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-mist/45">Users</p>
          <p className="font-heading text-pearl">{formatNumber(period.users)}</p>
        </div>
        <div>
          <p className="text-mist/45">Sessions</p>
          <p className="font-heading text-pearl">{formatNumber(period.sessions)}</p>
        </div>
        <div>
          <p className="text-mist/45">Checkout</p>
          <p className="font-heading text-gold">{formatNumber(period.checkout)}</p>
        </div>
        <div>
          <p className="text-mist/45">Paid</p>
          <p className="font-heading text-neon">{formatNumber(period.paidOrders)}</p>
        </div>
      </div>
    </div>
  )
}

function ImpactMetricRow({
  label,
  before,
  after,
  delta,
}: {
  label: string
  before: string
  after: string
  delta: string
}) {
  return (
    <div className="border-t border-pearl/8 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-heading text-sm text-pearl">{label}</p>
        <p className={`font-heading text-sm ${deltaTone(Number(delta.replace(/[^\d.-]/g, '')))}`}>
          {delta}
        </p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-pearl/[0.04] p-3">
          <p className="text-xs text-mist/45">before</p>
          <p className="mt-1 font-heading text-pearl">{before}</p>
        </div>
        <div className="rounded-lg bg-pearl/[0.04] p-3">
          <p className="text-xs text-mist/45">after</p>
          <p className="mt-1 font-heading text-pearl">{after}</p>
        </div>
      </div>
    </div>
  )
}

function ChangesPanel({ changes }: { changes?: ChangesData }) {
  const entries = changes?.changes ?? []
  const [selectedId, setSelectedId] = useState('')

  if (!changes) return <EmptyState>版本影響資料讀取中。</EmptyState>
  if (entries.length === 0) {
    return <EmptyState>最近 30 天尚未建立版本歷程資料。</EmptyState>
  }

  const selected = entries.find((entry) => entry.id === selectedId) || entries[0]
  const metricRows = [
    {
      label: 'Users / day',
      before: `${formatNumber(selected.before.usersPerDay, 1)}/day`,
      after: `${formatNumber(selected.after.usersPerDay, 1)}/day`,
      delta: formatSignedNumber(selected.delta.usersPerDay, '/day', 1),
    },
    {
      label: 'Lead rate',
      before: `${formatNumber(selected.before.leadRate, 1)}%`,
      after: `${formatNumber(selected.after.leadRate, 1)}%`,
      delta: formatSignedPoint(selected.delta.leadRatePp),
    },
    {
      label: 'AddToCart rate',
      before: `${formatNumber(selected.before.addToCartRate, 1)}%`,
      after: `${formatNumber(selected.after.addToCartRate, 1)}%`,
      delta: formatSignedPoint(selected.delta.addToCartRatePp),
    },
    {
      label: 'Checkout rate',
      before: `${formatNumber(selected.before.checkoutRate, 1)}%`,
      after: `${formatNumber(selected.after.checkoutRate, 1)}%`,
      delta: formatSignedPoint(selected.delta.checkoutRatePp),
    },
    {
      label: 'Purchase rate',
      before: `${formatNumber(selected.before.purchaseRate, 1)}%`,
      after: `${formatNumber(selected.after.purchaseRate, 1)}%`,
      delta: formatSignedPoint(selected.delta.purchaseRatePp),
    },
    {
      label: 'Revenue / user',
      before: formatMoney(selected.before.revenuePerUser),
      after: formatMoney(selected.after.revenuePerUser),
      delta: formatMoney(selected.delta.revenuePerUser),
    },
  ]

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(220px,0.72fr)_minmax(360px,1.55fr)_minmax(320px,0.95fr)]">
      <aside className="rounded-lg border border-pearl/10 bg-black/24">
        <div className="border-b border-pearl/8 p-4">
          <p className="font-heading text-xs uppercase tracking-[0.18em] text-mist/55">
            最近 {changes.days} 天
          </p>
          <h2 className="mt-1 font-heading text-xl font-black text-pearl">
            版本歷程
          </h2>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setSelectedId(entry.id)}
              className={`block w-full border-b border-pearl/8 px-4 py-3 text-left transition-colors ${
                selected.id === entry.id
                  ? 'bg-neon/14 text-pearl'
                  : 'bg-transparent text-mist hover:bg-pearl/[0.04] hover:text-pearl'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-2 font-heading text-sm font-bold">
                  {entry.title}
                </p>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${impactBadgeClass(
                    entry.impactLevel,
                  )}`}
                >
                  {entry.impactLevel || 'medium'}
                </span>
              </div>
              <p className="mt-1 text-xs text-mist/55">
                {formatDateTime(entry.deployedAt)} / {entry.scope || '-'}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-lg border border-pearl/10 bg-black/24 p-5">
        <div className="flex flex-col gap-3 border-b border-pearl/8 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-neon/70">
              {selected.category || 'CHANGE'}
            </p>
            <h2 className="mt-2 font-heading text-2xl font-black text-pearl">
              {selected.title}
            </h2>
            <p className="mt-1 text-sm text-mist/60">
              {selected.scope || '-'} / {formatDateTime(selected.deployedAt)}
            </p>
          </div>
          <span
            className={`w-fit rounded-full border px-3 py-1 text-xs ${impactBadgeClass(
              selected.impactLevel,
            )}`}
          >
            {selected.impactLevel || 'medium'}
          </span>
        </div>

        <div className="mt-5 space-y-5 text-sm leading-relaxed">
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-mist/50">
              改了什麼
            </p>
            <p className="mt-2 text-mist/82">{selected.changedSummary || '-'}</p>
          </div>
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-mist/50">
              判斷假設
            </p>
            <p className="mt-2 text-mist/82">{selected.hypothesis || '-'}</p>
          </div>
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-mist/50">
              主要觀察指標
            </p>
            <p className="mt-2 text-neon">{selected.primaryMetric || '-'}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-pearl/8 pt-4 text-xs text-mist/50">
          <p>資料來源：{selected.source || 'release_versions'}</p>
          {selected.deploymentUrl && (
            <a
              href={selected.deploymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-neon hover:text-neon/80"
            >
              Deployment
            </a>
          )}
          {selected.notes && <p className="mt-2">{selected.notes}</p>}
        </div>
      </section>

      <aside className="rounded-lg border border-pearl/10 bg-black/24 p-5">
        <p className="font-heading text-sm tracking-[0.18em] text-pearl">
          前後影響
        </p>

        {selected.warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {selected.warnings.map((warning) => (
              <p
                key={warning}
                className="rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-xs leading-relaxed text-gold"
              >
                {warning}
              </p>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-2">
          <PeriodSummaryCard title="Before" period={selected.before} />
          <PeriodSummaryCard title="After" period={selected.after} />
        </div>

        <div className="mt-4">
          {metricRows.map((row) => (
            <ImpactMetricRow
              key={row.label}
              label={row.label}
              before={row.before}
              after={row.after}
              delta={row.delta}
            />
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-pearl/8 bg-pearl/[0.04] p-3 text-xs leading-relaxed text-mist/60">
          <p>
            Paid sessions 差 {formatSignedPercent(selected.delta.paidSessionsPct)}
            ，目前期間營收差 {formatMoney(selected.delta.revenue)}。
          </p>
          <p className="mt-1">
            若流量結構改變過大，請先看各來源、裝置與 CTA 漏斗，不要直接把差異歸因於單一改版。
          </p>
        </div>
      </aside>
    </div>
  )
}

function TrafficDashboard({ traffic }: { traffic?: TrafficData }) {
  if (!traffic) return <EmptyState>流量資料讀取中。</EmptyState>

  const overview = traffic.overview
  const daily = traffic.daily || []
  const dropoffs = traffic.dropoffs || []
  const recentEvents = traffic.recentEvents || []
  const splitVariants = traffic.splitVariants || []
  const splitSections = traffic.splitSections || []

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Sessions"
          value={`${overview?.sessions ?? 0}`}
          detail={`Paid ${overview?.paidSessions ?? 0} · Visitors ${overview?.visitors ?? 0}`}
        />
        <MetricCard
          label="LINE / 登入"
          value={`${overview?.leadSessions ?? 0}`}
          detail={`Rate ${formatRate(overview?.leadSessions, overview?.sessions)} · UTM ${overview?.utmSessions ?? 0}`}
        />
        <MetricCard
          label="Fight Night Pass"
          value={`${overview?.ticketSessions ?? 0}`}
          detail={`View rate ${formatRate(overview?.ticketSessions, overview?.sessions)} · Scroll 50% ${overview?.scroll50Sessions ?? 0}`}
        />
        <MetricCard
          label="購買意圖"
          value={`${overview?.purchaseClickSessions ?? 0}`}
          detail={`Checkout ${overview?.checkoutSessions ?? 0} · Paid ${overview?.paidOrders ?? 0}`}
        />
        <MetricCard
          label="免費預約"
          value={`${overview?.freeTrialSessions ?? 0}`}
          detail={`已保留 ${overview?.freeOrders ?? 0} · Lead to free ${formatRate(overview?.freeTrialSessions, overview?.leadSessions)}`}
        />
        <MetricCard
          label="付款營收"
          value={formatMoney(overview?.revenue ?? 0)}
          detail={`Paid orders ${overview?.paidOrders ?? 0} · Checkout rate ${formatRate(overview?.checkoutSessions, overview?.sessions)}`}
        />
        <MetricCard
          label="Dropoffs"
          value={`${overview?.exitSessions ?? 0}`}
          detail={`Bounce ${overview?.bounceSessions ?? 0} · ${bounceRate(overview?.bounceSessions ?? 0, overview?.exitSessions ?? 0)}`}
        />
        <MetricCard
          label="Attribution"
          value={`${overview?.paidSessions ?? 0}`}
          detail={`fbclid/click ${overview?.clickIdSessions ?? 0} · UTM ${overview?.utmSessions ?? 0}`}
        />
      </div>

      {daily.length > 0 && (
        <section className="rounded-lg border border-pearl/10 bg-black/24 p-4">
          <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
            每日漏斗
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[1040px] w-full text-left text-sm">
              <thead className="font-heading text-xs tracking-[0.16em] text-mist/55">
                <tr>
                  <th className="py-2 pr-4">日期</th>
                  <th className="py-2 pr-4">Sessions</th>
                  <th className="py-2 pr-4">Paid</th>
                  <th className="py-2 pr-4">課程區</th>
                  <th className="py-2 pr-4">LINE/登入</th>
                  <th className="py-2 pr-4">登入率</th>
                  <th className="py-2 pr-4">免費預約</th>
                  <th className="py-2 pr-4">購買點擊</th>
                  <th className="py-2 pr-4">結帳</th>
                  <th className="py-2 pr-4">付款</th>
                  <th className="py-2 pr-4">營收</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pearl/8">
                {daily.map((row) => (
                  <tr key={row.day}>
                    <td className="py-3 pr-4 font-heading text-pearl">{row.day}</td>
                    <td className="py-3 pr-4 text-mist/75">{row.sessions}</td>
                    <td className="py-3 pr-4 text-mist/75">{row.paidSessions}</td>
                    <td className="py-3 pr-4 text-mist/75">{row.ticketSessions}</td>
                    <td className="py-3 pr-4 text-neon">{row.leadSessions}</td>
                    <td className="py-3 pr-4 text-mist/75">
                      {formatRate(row.leadSessions, row.sessions)}
                    </td>
                    <td className="py-3 pr-4 text-mist/75">{row.freeTrialSessions}</td>
                    <td className="py-3 pr-4 text-mist/75">{row.purchaseClickSessions}</td>
                    <td className="py-3 pr-4 text-gold">{row.checkoutSessions}</td>
                    <td className="py-3 pr-4 text-neon">{row.paidOrders}</td>
                    <td className="py-3 pr-4 text-mist/75">{formatMoney(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-pearl/10 bg-black/24 p-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
              Landing Split Test
            </p>
            <p className="mt-1 text-sm text-mist/55">
              比較首頁、BOOTCAMP、活動頁第一次進站後的 LINE、免費預約、付款意圖與停留表現。
            </p>
          </div>
          <span className="text-xs text-mist/45">
            同一頁會合併 query / split_visit_id 後統計
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="font-heading text-xs tracking-[0.16em] text-mist/55">
              <tr>
                <th className="py-2 pr-4">版本</th>
                <th className="py-2 pr-4">首次分組</th>
                <th className="py-2 pr-4">頁面</th>
                <th className="py-2 pr-4">Sessions</th>
                <th className="py-2 pr-4">PV</th>
                <th className="py-2 pr-4">LINE</th>
                <th className="py-2 pr-4">免費預約</th>
                <th className="py-2 pr-4">購買點擊</th>
                <th className="py-2 pr-4">Checkout</th>
                <th className="py-2 pr-4">CTA</th>
                <th className="py-2 pr-4">停留</th>
                <th className="py-2 pr-4">瀏覽</th>
                <th className="py-2 pr-4">跳出</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pearl/8">
              {splitVariants.map((row, index) => (
                <tr
                  key={`${row.experimentVariant}-${row.firstExperimentVariant}-${row.routePath}-${index}`}
                >
                  <td className="py-3 pr-4 font-heading text-pearl">
                    {splitVariantLabel(row.experimentVariant)}
                  </td>
                  <td className="py-3 pr-4 text-mist/70">
                    {splitVariantLabel(row.firstExperimentVariant)}
                  </td>
                  <td className="py-3 pr-4 text-mist/75">{routeLabel(row.routePath)}</td>
                  <td className="py-3 pr-4 text-mist/75">{row.sessions}</td>
                  <td className="py-3 pr-4 text-mist/75">{row.pageViews}</td>
                  <td className="py-3 pr-4 text-neon">{row.leadSessions}</td>
                  <td className="py-3 pr-4 text-mist/75">{row.freeTrialSessions}</td>
                  <td className="py-3 pr-4 text-mist/75">{row.purchaseClickSessions}</td>
                  <td className="py-3 pr-4 text-gold">{row.checkoutIntents}</td>
                  <td className="py-3 pr-4 text-mist/75">{row.actions}</td>
                  <td className="py-3 pr-4 text-mist/75">
                    {formatDuration(row.avgDurationMs)}
                  </td>
                  <td className="py-3 pr-4 text-mist/75">
                    {formatPercent(row.avgScrollDepth)}
                  </td>
                  <td className="py-3 pr-4 text-mist/75">
                    {bounceRate(row.bounces, row.exits)}
                  </td>
                </tr>
              ))}
              {splitVariants.length === 0 && (
                <tr>
                  <td className="py-4 text-sm text-mist/55" colSpan={13}>
                    尚未收到分流版本事件。上線後有使用者進站，這裡會開始出現三個頁面的比較。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 overflow-x-auto border-t border-pearl/10 pt-4">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="font-heading text-xs tracking-[0.16em] text-mist/55">
              <tr>
                <th className="py-2 pr-4">版本</th>
                <th className="py-2 pr-4">頁面</th>
                <th className="py-2 pr-4">區塊</th>
                <th className="py-2 pr-4">Views</th>
                <th className="py-2 pr-4">Sessions</th>
                <th className="py-2 pr-4">Clicks</th>
                <th className="py-2 pr-4">停留</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pearl/8">
              {splitSections.slice(0, 60).map((row, index) => (
                <tr key={`${row.experimentVariant}-${row.routePath}-${row.sectionId}-${index}`}>
                  <td className="py-3 pr-4 font-heading text-pearl">
                    {splitVariantLabel(row.experimentVariant)}
                  </td>
                  <td className="py-3 pr-4 text-mist/70">{routeLabel(row.routePath)}</td>
                  <td className="max-w-[260px] py-3 pr-4">
                    <span className="line-clamp-2 break-all text-mist/75">
                      #{row.sectionId}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-mist/75">{row.views}</td>
                  <td className="py-3 pr-4 text-mist/75">{row.sessions}</td>
                  <td className="py-3 pr-4 text-neon">{row.clicks}</td>
                  <td className="py-3 pr-4 text-mist/75">
                    {formatDuration(row.avgDurationMs)}
                  </td>
                </tr>
              ))}
              {splitSections.length === 0 && (
                <tr>
                  <td className="py-4 text-sm text-mist/55" colSpan={7}>
                    尚未收到分流區塊瀏覽或停留資料。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {traffic.campaigns.length > 0 && (
        <section className="rounded-lg border border-pearl/10 bg-black/24 p-4">
          <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
            Campaign / Content
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[1180px] w-full text-left text-sm">
              <thead className="font-heading text-xs tracking-[0.16em] text-mist/55">
                <tr>
                  <th className="py-2 pr-4">Campaign</th>
                  <th className="py-2 pr-4">Content</th>
                  <th className="py-2 pr-4">Ad set</th>
                  <th className="py-2 pr-4">Sessions</th>
                  <th className="py-2 pr-4">Paid</th>
                  <th className="py-2 pr-4">課程區</th>
                  <th className="py-2 pr-4">LINE/登入</th>
                  <th className="py-2 pr-4">登入率</th>
                  <th className="py-2 pr-4">免費</th>
                  <th className="py-2 pr-4">購買點擊</th>
                  <th className="py-2 pr-4">結帳</th>
                  <th className="py-2 pr-4">First / Last</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pearl/8">
                {traffic.campaigns.map((campaign, index) => (
                  <tr
                    key={`${campaign.utmCampaign}-${campaign.utmContent}-${campaign.utmTerm}-${index}`}
                  >
                    <td className="max-w-[180px] py-3 pr-4">
                      <span className="line-clamp-2 break-all font-mono text-[11px] text-pearl">
                        {campaign.utmCampaign || '-'}
                      </span>
                    </td>
                    <td className="max-w-[180px] py-3 pr-4">
                      <span className="line-clamp-2 break-all font-mono text-[11px] text-mist/80">
                        {campaign.utmContent || '-'}
                      </span>
                    </td>
                    <td className="max-w-[160px] py-3 pr-4">
                      <span className="line-clamp-2 break-all font-mono text-[11px] text-mist/60">
                        {campaign.utmTerm || campaign.clickIdType || '-'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-mist/75">{campaign.sessions}</td>
                    <td className="py-3 pr-4 text-mist/75">{campaign.paidSessions}</td>
                    <td className="py-3 pr-4 text-mist/75">{campaign.ticketSessions}</td>
                    <td className="py-3 pr-4 text-neon">{campaign.leadSessions}</td>
                    <td className="py-3 pr-4 text-mist/75">
                      {formatRate(campaign.leadSessions, campaign.sessions)}
                    </td>
                    <td className="py-3 pr-4 text-mist/75">{campaign.freeTrialSessions}</td>
                    <td className="py-3 pr-4 text-mist/75">{campaign.purchaseClickSessions}</td>
                    <td className="py-3 pr-4 text-gold">{campaign.checkoutSessions}</td>
                    <td className="py-3 pr-4 text-xs text-mist/55">
                      {[campaign.firstSeenAt, campaign.lastSeenAt].filter(Boolean).join(' / ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-pearl/10 bg-black/24 p-4">
        <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
          來源與跳出
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[860px] w-full text-left text-sm">
            <thead className="font-heading text-xs tracking-[0.16em] text-mist/55">
              <tr>
                <th className="py-2 pr-4">來源</th>
                <th className="py-2 pr-4">Sessions</th>
                <th className="py-2 pr-4">課程區</th>
                <th className="py-2 pr-4">LINE/登入</th>
                <th className="py-2 pr-4">免費</th>
                <th className="py-2 pr-4">CTA</th>
                <th className="py-2 pr-4">結帳意圖</th>
                <th className="py-2 pr-4">平均停留</th>
                <th className="py-2 pr-4">平均滾動</th>
                <th className="py-2 pr-4">跳出率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pearl/8">
              {traffic.sources.map((source) => (
                <tr key={source.sourceChannel}>
                  <td className="py-3 pr-4 font-heading text-pearl">
                    {source.sourceChannel}
                  </td>
                  <td className="py-3 pr-4 text-mist/75">{source.sessions}</td>
                  <td className="py-3 pr-4 text-mist/75">{source.ticketSessions}</td>
                  <td className="py-3 pr-4 text-neon">{source.leadSessions}</td>
                  <td className="py-3 pr-4 text-mist/75">{source.freeTrialSessions}</td>
                  <td className="py-3 pr-4 text-mist/75">{source.actions}</td>
                  <td className="py-3 pr-4 text-neon">{source.checkoutIntents}</td>
                  <td className="py-3 pr-4 text-mist/75">
                    {formatDuration(source.avgDurationMs)}
                  </td>
                  <td className="py-3 pr-4 text-mist/75">
                    {formatPercent(source.avgScrollDepth)}
                  </td>
                  <td className="py-3 pr-4 text-mist/75">
                    {bounceRate(source.bounces, source.exits)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-pearl/10 bg-black/24 p-4">
        <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
          頁面表現
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[940px] w-full text-left text-sm">
            <thead className="font-heading text-xs tracking-[0.16em] text-mist/55">
              <tr>
                <th className="py-2 pr-4">頁面</th>
                <th className="py-2 pr-4">Sessions</th>
                <th className="py-2 pr-4">PV</th>
                <th className="py-2 pr-4">課程區</th>
                <th className="py-2 pr-4">LINE/登入</th>
                <th className="py-2 pr-4">免費</th>
                <th className="py-2 pr-4">CTA</th>
                <th className="py-2 pr-4">結帳意圖</th>
                <th className="py-2 pr-4">平均停留</th>
                <th className="py-2 pr-4">平均滾動</th>
                <th className="py-2 pr-4">跳出率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pearl/8">
              {traffic.pages.map((page) => (
                <tr key={page.routePath}>
                  <td className="max-w-[280px] py-3 pr-4">
                    <span className="line-clamp-2 break-all font-heading text-pearl">
                      {page.routePath}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-mist/75">{page.sessions}</td>
                  <td className="py-3 pr-4 text-mist/75">{page.pageViews}</td>
                  <td className="py-3 pr-4 text-mist/75">{page.ticketSessions}</td>
                  <td className="py-3 pr-4 text-neon">{page.leadSessions}</td>
                  <td className="py-3 pr-4 text-mist/75">{page.freeTrialSessions}</td>
                  <td className="py-3 pr-4 text-mist/75">{page.actions}</td>
                  <td className="py-3 pr-4 text-neon">{page.checkoutIntents}</td>
                  <td className="py-3 pr-4 text-mist/75">
                    {formatDuration(page.avgDurationMs)}
                  </td>
                  <td className="py-3 pr-4 text-mist/75">
                    {formatPercent(page.avgScrollDepth)}
                  </td>
                  <td className="py-3 pr-4 text-mist/75">
                    {bounceRate(page.bounces, page.exits)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-pearl/10 bg-black/24 p-4">
          <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
            區塊停留訊號
          </p>
          <div className="mt-3 grid gap-2">
            {traffic.sections.slice(0, 14).map((section) => (
              <div
                key={section.sectionId}
                className="flex items-center justify-between gap-3 rounded-lg border border-pearl/8 bg-black/24 px-3 py-2"
              >
                <span className="min-w-0 truncate font-heading text-pearl">
                  {routeLabel(section.routePath)} / #{section.sectionId}
                </span>
                <span className="shrink-0 text-sm text-mist/70">
                  看見 {section.views} · 點擊 {section.clicks} · {formatDuration(section.avgDurationMs)}
                </span>
              </div>
            ))}
            {traffic.sections.length === 0 && (
              <p className="text-sm text-mist/55">尚無區塊曝光資料。</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-pearl/10 bg-black/24 p-4">
          <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
            Drop-off Sections
          </p>
          <div className="mt-3 grid gap-2">
            {dropoffs.slice(0, 14).map((dropoff) => (
              <div
                key={dropoff.lastSection}
                className="flex items-center justify-between gap-3 rounded-lg border border-pearl/8 bg-black/24 px-3 py-2"
              >
                <span className="min-w-0 truncate font-heading text-pearl">
                  {dropoff.lastSection}
                </span>
                <span className="text-sm text-mist/70">
                  離開 {dropoff.dropoffs} · 滾動 {formatPercent(dropoff.avgScrollDepth)}
                </span>
              </div>
            ))}
            {dropoffs.length === 0 && (
              <p className="text-sm text-mist/55">尚無離開區塊資料。</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-pearl/10 bg-black/24 p-4">
          <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
            瀏覽器與系統
          </p>
          <div className="mt-3 grid gap-2">
            {traffic.browsers.slice(0, 12).map((browser) => (
              <div
                key={`${browser.browserName}-${browser.osName}-${browser.inAppBrowser || 'browser'}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-pearl/8 bg-black/24 px-3 py-2"
              >
                <span className="min-w-0 truncate text-mist/80">
                  {[browser.browserName, browser.osName, browser.inAppBrowser]
                    .filter(Boolean)
                    .join(' / ')}
                </span>
                <span className="shrink-0 text-sm text-neon">
                  {browser.sessions} · LINE {browser.leadSessions}
                </span>
              </div>
            ))}
            {traffic.browsers.length === 0 && (
              <p className="text-sm text-mist/55">尚無瀏覽器資料。</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-pearl/10 bg-black/24 p-4">
          <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
            網路與 Cloudflare 節點
          </p>
          <div className="mt-3 grid gap-2">
            {traffic.networks.slice(0, 12).map((network) => (
              <div
                key={`${network.asOrganization}-${network.asn}-${network.colo || ''}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-pearl/8 bg-black/24 px-3 py-2"
              >
                <span className="min-w-0 truncate text-mist/80">
                  {[network.asOrganization, network.asn ? `AS${network.asn}` : '', network.colo]
                    .filter(Boolean)
                    .join(' / ')}
                </span>
                <span className="shrink-0 text-sm text-neon">
                  {network.sessions} · LINE {network.leadSessions}
                </span>
              </div>
            ))}
            {traffic.networks.length === 0 && (
              <p className="text-sm text-mist/55">尚無網路資料。</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-pearl/10 bg-black/24 p-4">
        <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
          裝置與區域
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="font-heading text-xs tracking-[0.16em] text-mist/55">
              <tr>
                <th className="py-2 pr-4">類型</th>
                <th className="py-2 pr-4">Sessions</th>
                <th className="py-2 pr-4">LINE/登入</th>
                <th className="py-2 pr-4">結帳</th>
                <th className="py-2 pr-4">滾動</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pearl/8">
              {traffic.devices.map((device) => (
                <tr key={device.deviceType}>
                  <td className="py-3 pr-4 font-heading text-pearl">
                    {device.deviceType}
                  </td>
                  <td className="py-3 pr-4 text-mist/75">{device.sessions}</td>
                  <td className="py-3 pr-4 text-neon">{device.leadSessions}</td>
                  <td className="py-3 pr-4 text-gold">{device.checkoutIntents}</td>
                  <td className="py-3 pr-4 text-mist/75">
                    {formatPercent(device.avgScrollDepth)}
                  </td>
                </tr>
              ))}
              {traffic.geography.slice(0, 10).map((geo) => (
                <tr key={`${geo.country}-${geo.region}-${geo.city}`}>
                  <td className="py-3 pr-4 text-mist/80">
                    {[geo.city, geo.region, geo.country].filter(Boolean).join(' / ')}
                  </td>
                  <td className="py-3 pr-4 text-mist/75">{geo.sessions}</td>
                  <td className="py-3 pr-4 text-neon">{geo.leadSessions}</td>
                  <td className="py-3 pr-4 text-gold">{geo.checkoutIntents}</td>
                  <td className="py-3 pr-4 text-mist/45">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {recentEvents.length > 0 && (
        <section className="rounded-lg border border-pearl/10 bg-black/24 p-4">
          <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
            Recent Journey Events
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="font-heading text-xs tracking-[0.16em] text-mist/55">
                <tr>
                  <th className="py-2 pr-4">時間</th>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">位置</th>
                  <th className="py-2 pr-4">CTA</th>
                  <th className="py-2 pr-4">來源</th>
                  <th className="py-2 pr-4">裝置</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pearl/8">
                {recentEvents.map((event, index) => (
                  <tr key={`${event.createdAt}-${event.eventName}-${index}`}>
                    <td className="whitespace-nowrap py-3 pr-4 text-xs text-mist/55">
                      {event.createdAt}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-heading text-neon">{event.eventName}</p>
                      {event.experimentVariant && (
                        <p className="mt-1 text-xs text-mist/45">
                          {splitVariantLabel(event.experimentVariant)}
                        </p>
                      )}
                    </td>
                    <td className="max-w-[260px] py-3 pr-4 text-mist/75">
                      <span className="line-clamp-2 break-all">
                        {event.sectionId
                          ? `${routeLabel(event.canonicalRoutePath || event.routePath)} / #${event.sectionId}`
                          : routeLabel(event.canonicalRoutePath || event.routePath)}
                        {event.maxScrollDepth ? ` · ${event.maxScrollDepth}%` : ''}
                        {event.durationMs ? ` · ${formatDuration(event.durationMs)}` : ''}
                      </span>
                    </td>
                    <td className="max-w-[240px] py-3 pr-4 text-mist/65">
                      <span className="line-clamp-2">
                        {[event.ctaId, event.targetText].filter(Boolean).join(' · ') || '-'}
                      </span>
                    </td>
                    <td className="max-w-[260px] py-3 pr-4 text-mist/65">
                      <span className="line-clamp-2 break-all">
                        {[event.sourceChannel, event.utmCampaign, event.utmContent]
                          .filter(Boolean)
                          .join(' · ') || '-'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-mist/55">
                      {[event.browserName, event.inAppBrowser, event.city || event.country]
                        .filter(Boolean)
                        .join(' / ') || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function JourneysPanel({ journeys }: { journeys: Journey[] }) {
  if (journeys.length === 0) return <EmptyState>目前還沒有可檢視的用戶歷程。</EmptyState>

  return (
    <div className="grid gap-4">
      {journeys.map((journey) => (
        <article
          key={journey.sessionId}
          className="rounded-lg border border-pearl/10 bg-black/24 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="font-heading text-sm text-pearl">
                {journey.sourceChannel} · {journey.deviceType || 'unknown'} ·{' '}
                {[journey.browserName, journey.osName, journey.inAppBrowser]
                  .filter(Boolean)
                  .join(' / ') || 'browser unknown'}
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-mist/45">
                {journey.sessionId}
              </p>
              <p className="mt-2 text-sm text-mist/65">
                入口 {journey.landingPath || '-'} · {[journey.city, journey.region, journey.country]
                  .filter(Boolean)
                  .join(' / ') || '區域未知'}
              </p>
              <p className="mt-1 text-xs text-mist/45">
                {[journey.visitorType, journey.sessionIndex ? `第 ${journey.sessionIndex} 次 session` : '', journey.asOrganization, journey.colo]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs md:min-w-[18rem]">
              <div className="rounded-lg border border-pearl/8 bg-black/24 p-2">
                <p className="font-heading text-mist/45">停留</p>
                <p className="mt-1 text-pearl">{formatDuration(journey.durationMs)}</p>
              </div>
              <div className="rounded-lg border border-pearl/8 bg-black/24 p-2">
                <p className="font-heading text-mist/45">滾動</p>
                <p className="mt-1 text-pearl">{formatPercent(journey.maxScrollDepth)}</p>
              </div>
              <div className="rounded-lg border border-pearl/8 bg-black/24 p-2">
                <p className="font-heading text-mist/45">事件</p>
                <p className="mt-1 text-pearl">{journey.eventCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 border-t border-pearl/10 pt-4">
            {journey.events.map((event, index) => (
              <div
                key={`${journey.sessionId}-${index}-${event.createdAt}`}
                className="grid gap-2 rounded-lg border border-pearl/8 bg-black/20 px-3 py-2 text-sm md:grid-cols-[7rem_1fr_7rem]"
              >
                <span className="font-heading text-neon/85">
                  {event.eventName}
                </span>
                <span className="min-w-0 text-mist/72">
                  {event.sectionId
                    ? `${routeLabel(event.canonicalRoutePath || event.routePath)} / #${event.sectionId}`
                    : routeLabel(event.canonicalRoutePath || event.routePath)}
                  {event.ctaId ? ` · CTA ${event.ctaId}` : ''}
                  {event.targetText ? ` · ${event.targetText}` : ''}
                  {event.scrollDepth ? ` · ${event.scrollDepth}%` : ''}
                  {event.durationMs ? ` · ${formatDuration(event.durationMs)}` : ''}
                  {event.utmCampaign ? ` · ${event.utmCampaign}` : ''}
                  {event.clickIdType ? ` · ${event.clickIdType}` : ''}
                </span>
                <span className="text-right text-mist/45">
                  {formatDateTime(event.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

export function AdminPage() {
  const [token, setToken] = useState(getStoredToken)
  const [tokenInput, setTokenInput] = useState(getStoredToken)
  const [activeTab, setActiveTab] = useState<AdminTab>('changes')
  const [data, setData] = useState<AdminData>(initialData)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isReconciling, setIsReconciling] = useState(false)
  const [reconcileResult, setReconcileResult] = useState('')
  const [lineRecoveryResult, setLineRecoveryResult] = useState('')
  const hasLoadedSummaryRef = useRef(false)

  const summary = data.summary
  const checkoutRate = useMemo(() => {
    const paidFlowTotal =
      (summary?.orders.total ?? 0) - (summary?.orders.freeReserved ?? 0)
    if (!summary || paidFlowTotal <= 0) return '0%'
    return `${Math.round((summary.orders.paid / paidFlowTotal) * 100)}%`
  }, [summary])

  const loadAdminData = useCallback(async (
    tab: AdminTab,
    options: { refreshSummary?: boolean } = {},
  ) => {
    if (!token) return

    setIsLoading(true)
    setError('')

    try {
      const shouldLoadSummary =
        options.refreshSummary === true || !hasLoadedSummaryRef.current
      const summaryPromise = shouldLoadSummary
        ? fetchAdmin<{ summary: AdminSummary }>('/api/admin/summary?light=1', token)
        : Promise.resolve(null)
      const tabPromise = (async (): Promise<Partial<AdminData>> => {
        if (tab === 'changes') {
          const response = await fetchAdmin<{ changes: ChangesData }>(
            '/api/admin/changes?days=30',
            token,
          )
          return { changes: response.changes }
        }
        if (tab === 'traffic') {
          const response = await fetchAdmin<{ traffic: TrafficData }>(
            '/api/admin/traffic?days=7',
            token,
          )
          return { traffic: response.traffic }
        }
        if (tab === 'journeys') {
          const response = await fetchAdmin<{ journeys: Journey[] }>(
            '/api/admin/journeys?limit=30&days=7',
            token,
          )
          return { journeys: response.journeys }
        }
        if (tab === 'orders') {
          const [ordersResponse, lineResponse] = await Promise.all([
            fetchAdmin<{ orders: AdminOrder[] }>('/api/admin/orders?limit=80', token),
            fetchAdmin<{ customers: LineCustomer[] }>(
              '/api/admin/line-customers?limit=80&compact=1&minimal=1',
              token,
            ),
          ])
          return {
            orders: ordersResponse.orders,
            customers: lineResponse.customers,
          }
        }
        if (tab === 'inventory') {
          const response = await fetchAdmin<{ inventory: InventoryRecord[] }>(
            '/api/admin/inventory?limit=120',
            token,
          )
          return { inventory: response.inventory }
        }
        if (tab === 'events') {
          const response = await fetchAdmin<{ events: TrackingEventRow[] }>(
            '/api/admin/events?limit=120',
            token,
          )
          return { events: response.events }
        }

        const [lineResponse, messagesResponse] = await Promise.all([
          fetchAdmin<{ customers: LineCustomer[] }>(
            '/api/admin/line-customers?limit=200',
            token,
          ),
          fetchAdmin<{ messages: LineMessageRecord[] }>(
            '/api/admin/line-messages?limit=200',
            token,
          ),
        ])
        return {
          customers: lineResponse.customers,
          lineMessages: messagesResponse.messages,
        }
      })()
      const [summaryResponse, tabData] = await Promise.all([
        summaryPromise,
        tabPromise,
      ])

      setData((currentData) => ({
        ...currentData,
        ...tabData,
        ...(summaryResponse ? { summary: summaryResponse.summary } : {}),
      }))
      if (summaryResponse) hasLoadedSummaryRef.current = true
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '後台資料讀取失敗')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadAdminData(activeTab)
  }, [activeTab, loadAdminData])

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextToken = tokenInput.trim()
    if (!nextToken) return

    try {
      window.localStorage.setItem(adminTokenKey, nextToken)
    } catch {
      // Token can still live in React state if localStorage is unavailable.
    }
    setToken(nextToken)
  }

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(adminTokenKey)
    } catch {
      // Ignore storage failures.
    }
    setToken('')
    setTokenInput('')
    setData(initialData)
    setReconcileResult('')
    setLineRecoveryResult('')
    hasLoadedSummaryRef.current = false
  }

  const handleReconcilePending = useCallback(async () => {
    if (!token) return

    setIsReconciling(true)
    setError('')
    setReconcileResult('')
    setLineRecoveryResult('')

    try {
      const response = await postAdmin<ReconcileResponse>(
        '/api/shopline/reconcile-pending?limit=100&refundLookbackHours=720',
        token,
      )
      setReconcileResult(
        `已檢查 ${response.checked} 筆可補對帳訂單，更新 ${response.changed} 筆。`,
      )
      await loadAdminData(activeTab, { refreshSummary: true })
    } catch (reconcileError) {
      setError(
        reconcileError instanceof Error
          ? reconcileError.message
          : '補對帳失敗',
      )
    } finally {
      setIsReconciling(false)
    }
  }, [activeTab, loadAdminData, token])

  const handleLinkOrderLine = useCallback(
    async (referenceId: string, lineUserId: string) => {
      if (!token) return

      setError('')
      try {
        await postAdmin<{ order: AdminOrder }>(
          `/api/admin/orders/${encodeURIComponent(referenceId)}/link-line`,
          token,
          { lineUserId },
        )
        await loadAdminData(activeTab, { refreshSummary: true })
      } catch (linkError) {
        setError(
          linkError instanceof Error ? linkError.message : 'LINE 用戶綁定失敗',
        )
        throw linkError
      }
    },
    [activeTab, loadAdminData, token],
  )

  const handleResendLineConfirmation = useCallback(
    async (referenceId: string) => {
      if (!token) return

      setError('')
      setLineRecoveryResult('')
      try {
        const response = await postAdmin<LineConfirmationResendResponse>(
          `/api/admin/orders/${encodeURIComponent(referenceId)}/resend-line-confirmation`,
          token,
        )
        const status = lineNotifyLabel(response.lineNotify?.status)
        const error = response.lineNotify?.error
          ? `，錯誤：${response.lineNotify.error}`
          : ''
        setLineRecoveryResult(`LINE 確認卡重送結果：${status}${error}`)
        await loadAdminData(activeTab, { refreshSummary: true })
      } catch (resendError) {
        setError(
          resendError instanceof Error
            ? resendError.message
            : 'LINE 確認卡重送失敗',
        )
        throw resendError
      }
    },
    [activeTab, loadAdminData, token],
  )

  const handlePreviewLineRecoveryBatch = useCallback(
    async (
      lineUserIds: string[],
      templateId: RecoveryTemplateId,
      segment?: string | null,
    ) => {
      if (!token) throw new Error('Missing admin token')

      setError('')
      try {
        return await postAdmin<LineRecoveryBatchPreviewResponse>(
          '/api/admin/line-recovery/preview-batch',
          token,
          { lineUserIds, templateId, segment: segment || null },
        )
      } catch (previewError) {
        setError(
          previewError instanceof Error
            ? previewError.message
            : 'LINE 批次喚回預覽失敗',
        )
        throw previewError
      }
    },
    [token],
  )

  const handleSendLineRecoveryBatch = useCallback(
    async (
      lineUserIds: string[],
      templateId: RecoveryTemplateId,
      segment: string | null,
      staffNote: string,
    ) => {
      if (!token) throw new Error('Missing admin token')

      setError('')
      setLineRecoveryResult('')
      try {
        const response = await postAdmin<LineRecoveryBatchSendResponse>(
          '/api/admin/line-recovery/send-batch',
          token,
          {
            lineUserIds,
            templateId,
            segment,
            staffNote,
            confirmed: true,
          },
        )
        setLineRecoveryResult(
          `已完成 LINE 批次喚回：發送 ${response.sentCount} 則，失敗 ${response.failedCount} 則，擋下 ${response.blockedCount} 人。Batch ${response.batchId}`,
        )
        await loadAdminData(activeTab, { refreshSummary: true })
        return response
      } catch (sendError) {
        setError(
          sendError instanceof Error ? sendError.message : 'LINE 批次喚回發送失敗',
        )
        throw sendError
      }
    },
    [activeTab, loadAdminData, token],
  )

  if (!token) {
    return (
      <div className="min-h-screen bg-abyss px-4 py-10 text-pearl">
        <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
          <p className="font-heading text-xs uppercase tracking-[0.24em] text-neon/80">
            FightNight Admin
          </p>
          <h1 className="mt-3 font-heading text-3xl font-black text-pearl">
            客戶追蹤後台
          </h1>
          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm text-mist/70">ADMIN_TOKEN</span>
              <input
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                type="password"
                className="mt-2 w-full rounded-lg border border-pearl/12 bg-black/35 px-4 py-3 text-pearl outline-none transition-colors placeholder:text-mist/35 focus:border-neon/45"
                placeholder="貼上後台 Token"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-neon px-4 py-3 font-heading font-bold text-abyss transition-colors hover:bg-pearl"
            >
              進入後台
            </button>
          </form>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-abyss px-3 py-6 text-pearl sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-pearl/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.24em] text-neon/80">
              FightNight Admin
            </p>
            <h1 className="mt-2 font-heading text-3xl font-black text-pearl md:text-5xl">
              客戶追蹤後台
            </h1>
            <p className="mt-2 text-sm text-mist/65">
              訂單、庫存、匿名行為與 LINE 足跡集中在這裡看。
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleReconcilePending()}
              disabled={isReconciling}
              className="rounded-lg border border-neon/25 bg-neon/10 px-4 py-2 font-heading text-sm text-neon transition-colors hover:border-neon/45 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isReconciling ? '補對帳中...' : '補對帳'}
            </button>
            <button
              type="button"
              onClick={() => void loadAdminData(activeTab, { refreshSummary: true })}
              className="rounded-lg border border-pearl/15 bg-pearl/5 px-4 py-2 font-heading text-sm text-pearl transition-colors hover:border-neon/35"
            >
              重新整理
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-pearl/15 bg-black/30 px-4 py-2 font-heading text-sm text-mist transition-colors hover:text-pearl"
            >
              登出
            </button>
          </div>
        </header>

        {error && (
          <p className="mt-5 rounded-lg border border-blaze/35 bg-blaze/10 px-4 py-3 text-sm text-blaze">
            {error}
          </p>
        )}

        {reconcileResult && (
          <p className="mt-5 rounded-lg border border-neon/25 bg-neon/10 px-4 py-3 text-sm text-neon">
            {reconcileResult}
          </p>
        )}

        {lineRecoveryResult && (
          <p className="mt-5 rounded-lg border border-neon/25 bg-neon/10 px-4 py-3 text-sm text-neon">
            {lineRecoveryResult}
          </p>
        )}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="已付款營收"
            value={formatMoney(summary?.orders.paidRevenue ?? 0)}
            detail={`${summary?.orders.paid ?? 0} 筆付款成功`}
          />
          <MetricCard
            label="免費預約"
            value={`${summary?.orders.freeReserved ?? 0}`}
            detail="已保留體驗名額"
          />
          <MetricCard
            label="待付款"
            value={`${summary?.orders.pending ?? 0}`}
            detail="已建立 SHOPLINE 但尚未 paid"
          />
          <MetricCard
            label="需人工處理"
            value={`${summary?.orders.attention ?? 0}`}
            detail="金額異常、超賣或付款建立失敗"
          />
          <MetricCard
            label="付款率"
            value={checkoutRate}
            detail="不含免費預約"
          />
        </section>

        <section className="mt-6 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-pearl/10 bg-black/24 p-4 lg:col-span-2">
            <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
              近 7 日匿名事件
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(summary?.events.breakdown ?? []).slice(0, 8).map((event) => (
                <span
                  key={event.eventName}
                  className="rounded-full border border-pearl/10 bg-pearl/5 px-3 py-1 text-sm text-mist/75"
                >
                  {event.eventName} · {event.count}
                </span>
              ))}
              {(summary?.events.breakdown ?? []).length === 0 && (
                <span className="text-sm text-mist/55">尚無事件資料</span>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-pearl/10 bg-black/24 p-4">
            <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
              LINE 顧客
            </p>
            <p className="mt-3 font-heading text-2xl font-black text-pearl">
              {summary?.line.totalCustomers ?? 0}
            </p>
            <p className="mt-1 text-sm text-mist/65">
              {summary?.line.friends ?? 0} 位已是好友
            </p>
          </div>
        </section>

        <nav className="mt-7 flex gap-2 overflow-x-auto border-b border-pearl/10 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-lg border px-4 py-2 font-heading text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-neon/40 bg-neon/15 text-neon'
                  : 'border-pearl/10 bg-black/25 text-mist hover:text-pearl'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {isLoading && (
            <span className="self-center text-sm text-mist/55">讀取中...</span>
          )}
        </nav>

        <section className="mt-5 pb-12">
          {activeTab === 'changes' && <ChangesPanel changes={data.changes} />}
          {activeTab === 'traffic' && <TrafficDashboard traffic={data.traffic} />}
          {activeTab === 'journeys' && <JourneysPanel journeys={data.journeys} />}
          {activeTab === 'orders' && (
            <OrdersTable
              orders={data.orders}
              customers={data.customers}
              onLinkLine={handleLinkOrderLine}
              onResendLineConfirmation={handleResendLineConfirmation}
            />
          )}
          {activeTab === 'inventory' && (
            <InventoryTable inventory={data.inventory} />
          )}
          {activeTab === 'events' && <EventsTable events={data.events} />}
          {activeTab === 'line' && (
            <div className="grid gap-8">
              <section className="grid gap-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-heading text-xs tracking-[0.18em] text-mist/60">
                      Manual LINE Recovery
                    </p>
                    <h2 className="font-heading text-2xl font-black text-pearl">
                      後台手動喚回
                    </h2>
                  </div>
                </div>
                <LineCustomersTableV2
                  customers={data.customers}
                  onPreviewBatch={handlePreviewLineRecoveryBatch}
                  onSendBatch={handleSendLineRecoveryBatch}
                />
              </section>
              <section className="grid gap-3">
                <div>
                  <p className="font-heading text-xs tracking-[0.18em] text-mist/60">
                    LINE Message Log
                  </p>
                  <h2 className="font-heading text-2xl font-black text-pearl">
                    LINE 發送紀錄
                  </h2>
                </div>
                <LineMessagesTable messages={data.lineMessages} />
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
