import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const adminTokenKey = 'fightnight_admin_token'

type AdminTab = 'traffic' | 'journeys' | 'orders' | 'inventory' | 'events' | 'line'

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
  landingPath?: string | null
  sourceChannel?: string | null
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

type LineRecoveryResponse = {
  ok: boolean
  status: string
  recoveryId: string
  templateId: string
  targetUrl?: string
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
  dropoffs?: TrafficDropoff[]
  exits: TrafficExit[]
  devices: TrafficDevice[]
  browsers: TrafficBrowser[]
  networks: TrafficNetwork[]
  geography: TrafficGeo[]
  recentEvents?: TrafficRecentEvent[]
}

type JourneyEvent = {
  eventName: string
  routePath?: string | null
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
  journeys: Journey[]
}

type ApiError = {
  error?: string
}

const initialData: AdminData = {
  orders: [],
  inventory: [],
  events: [],
  customers: [],
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

const tabs: Array<{ id: AdminTab; label: string }> = [
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
  if (status === 'skipped_missing_token') return '確認卡缺少 Token'
  if (status === 'skipped_no_line_user') return '確認卡未綁 LINE'
  if (status === 'skipped_not_free_reserved') return '非免費預約'
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

function recoveryButtonLabel(customer: LineCustomer) {
  if ((customer.pendingOrders || 0) > 0) return '發送待付款提醒'
  if (customer.latestOrderReferenceId) return '發送課程提醒'
  return '發送新手課提醒'
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
}: {
  orders: AdminOrder[]
  customers: LineCustomer[]
  onLinkLine: (referenceId: string, lineUserId: string) => Promise<void>
}) {
  if (orders.length === 0) return <EmptyState>目前還沒有訂單資料。</EmptyState>

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
                <span className="line-clamp-3 break-all">
                  {event.routePath || '-'}
                </span>
              </td>
              <td className="px-4 py-4 font-mono text-xs text-mist/55">
                {event.anonymousId}
              </td>
              <td className="max-w-[240px] px-4 py-4 text-mist/55">
                <p className="font-heading text-pearl/85">
                  {event.sourceChannel || 'direct'}
                  {event.deviceType ? ` · ${event.deviceType}` : ''}
                </p>
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

function LineCustomersTableV2({
  customers,
  onSendRecovery,
}: {
  customers: LineCustomer[]
  onSendRecovery: (lineUserId: string) => Promise<void>
}) {
  const [sendingLineUserId, setSendingLineUserId] = useState<string | null>(null)

  if (customers.length === 0) return <EmptyState>尚無 LINE 用戶紀錄</EmptyState>

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {customers.map((customer) => {
        const latestOrderTime =
          customer.latestOrderPaidAt || customer.latestOrderCreatedAt
        const latestRecoveryTime =
          customer.latestRecoverySentAt || customer.latestRecoveryAttemptedAt
        const canSendRecovery =
          customer.isFriend && (customer.paidOrders || 0) === 0
        const isSending = sendingLineUserId === customer.lineUserId

        const handleSendRecovery = async () => {
          if (!canSendRecovery || isSending) return
          setSendingLineUserId(customer.lineUserId)
          try {
            await onSendRecovery(customer.lineUserId)
          } finally {
            setSendingLineUserId(null)
          }
        }

        return (
          <div
            key={customer.lineUserId}
            className="rounded-lg border border-pearl/10 bg-black/28 p-4"
          >
            <div className="flex gap-3">
              {customer.pictureUrl ? (
                <img
                  src={customer.pictureUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-full bg-pearl/8" />
              )}
              <div className="min-w-0 flex-1">
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
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-heading ${linePaymentClass(customer)}`}
                  >
                    {linePaymentLabel(customer)}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-[11px] text-mist/45">
                  {customer.lineUserId}
                </p>
                {customer.email && (
                  <p className="mt-1 break-all text-[11px] text-gold/75">
                    {customer.email}
                    {customer.emailVerified ? ' verified' : ' unverified'}
                  </p>
                )}
                <p className="mt-2 text-sm text-mist/65">
                  進站 {customer.accessCount} 次，最近{' '}
                  {formatDateTime(customer.lastSeenAt)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-pearl/8 bg-black/20 p-3">
              {customer.latestOrderReferenceId ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-pearl">
                        {customer.latestOrderCourseName || '未命名課程'}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-mist/45">
                        {customer.latestOrderReferenceId}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-heading ${statusClass(
                        customer.latestOrderStatus || '',
                      )}`}
                    >
                      {statusLabel(customer.latestOrderStatus || '')}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-mist/65">
                    <p>
                      累計已付款 {customer.paidOrders || 0} 筆 /{' '}
                      {formatMoney(customer.paidRevenue || 0)}
                    </p>
                    <p>
                      最近訂單 {formatMoney(customer.latestOrderAmountValue || 0)}，
                      {formatDateTime(latestOrderTime)}
                    </p>
                    {(customer.buyerName ||
                      customer.buyerPhone ||
                      customer.buyerEmail) && (
                      <p className="break-all text-mist/50">
                        {customer.buyerName || '-'} / {customer.buyerPhone || '-'}
                        {customer.buyerEmail ? ` / ${customer.buyerEmail}` : ''}
                      </p>
                    )}
                    {customer.latestOrderLineEmail &&
                      !sameEmail(customer.latestOrderLineEmail, customer.buyerEmail) && (
                        <p className="break-all text-[11px] text-gold/70">
                          LINE email: {customer.latestOrderLineEmail}
                          {customer.latestOrderLineEmailVerified
                            ? ' verified'
                            : ' unverified'}
                        </p>
                      )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-mist/55">尚未建立購課訂單</p>
              )}
            </div>

            <div className="mt-3 rounded-lg border border-pearl/8 bg-black/18 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-heading ${lineRecoveryClass(
                    customer.latestRecoveryStatus,
                  )}`}
                >
                  {lineRecoveryLabel(customer.latestRecoveryStatus)}
                </span>
                {latestRecoveryTime && (
                  <span className="text-[11px] text-mist/45">
                    {formatDateTime(latestRecoveryTime)}
                  </span>
                )}
              </div>
              {customer.latestRecoveryTemplateId && (
                <p className="mt-2 text-[11px] text-mist/45">
                  模板 {customer.latestRecoveryTemplateId}
                </p>
              )}
              {customer.latestRecoveryError && (
                <p className="mt-2 line-clamp-2 text-xs text-blaze/75">
                  {customer.latestRecoveryError}
                </p>
              )}
              <button
                type="button"
                onClick={() => void handleSendRecovery()}
                disabled={!canSendRecovery || isSending}
                className="mt-3 w-full rounded-lg border border-neon/25 bg-neon/10 px-3 py-2 font-heading text-sm text-neon transition-colors hover:border-neon/45 hover:bg-neon/15 disabled:cursor-not-allowed disabled:border-pearl/10 disabled:bg-pearl/5 disabled:text-mist/45"
              >
                {isSending
                  ? '發送中...'
                  : canSendRecovery
                    ? recoveryButtonLabel(customer)
                    : customer.isFriend
                      ? '已付款不喚回'
                      : '非好友無法推播'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TrafficDashboard({ traffic }: { traffic?: TrafficData }) {
  if (!traffic) return <EmptyState>流量資料讀取中。</EmptyState>

  const overview = traffic.overview
  const daily = traffic.daily || []
  const dropoffs = traffic.dropoffs || []
  const recentEvents = traffic.recentEvents || []

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
                  #{section.sectionId}
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
                    <td className="py-3 pr-4 font-heading text-neon">
                      {event.eventName}
                    </td>
                    <td className="max-w-[260px] py-3 pr-4 text-mist/75">
                      <span className="line-clamp-2 break-all">
                        {event.sectionId ? `#${event.sectionId}` : event.routePath || '-'}
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
                  {event.sectionId ? `#${event.sectionId}` : event.routePath || '-'}
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
  const [activeTab, setActiveTab] = useState<AdminTab>('orders')
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

        const response = await fetchAdmin<{ customers: LineCustomer[] }>(
          '/api/admin/line-customers?limit=120',
          token,
        )
        return { customers: response.customers }
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

  const handleSendLineRecovery = useCallback(
    async (lineUserId: string) => {
      if (!token) return

      setError('')
      setLineRecoveryResult('')
      try {
        const response = await postAdmin<LineRecoveryResponse>(
          `/api/admin/line-customers/${encodeURIComponent(
            lineUserId,
          )}/send-recovery`,
          token,
        )
        setLineRecoveryResult(
          `已發送 LINE 喚回訊息：${response.templateId} / ${response.recoveryId}`,
        )
        await loadAdminData(activeTab, { refreshSummary: true })
      } catch (sendError) {
        setError(
          sendError instanceof Error ? sendError.message : 'LINE 喚回發送失敗',
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
          {activeTab === 'traffic' && <TrafficDashboard traffic={data.traffic} />}
          {activeTab === 'journeys' && <JourneysPanel journeys={data.journeys} />}
          {activeTab === 'orders' && (
            <OrdersTable
              orders={data.orders}
              customers={data.customers}
              onLinkLine={handleLinkOrderLine}
            />
          )}
          {activeTab === 'inventory' && (
            <InventoryTable inventory={data.inventory} />
          )}
          {activeTab === 'events' && <EventsTable events={data.events} />}
          {activeTab === 'line' && (
            <LineCustomersTableV2
              customers={data.customers}
              onSendRecovery={handleSendLineRecovery}
            />
          )}
        </section>
      </main>
    </div>
  )
}
