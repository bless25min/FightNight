import { useCallback, useEffect, useMemo, useState } from 'react'

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
  sourcePath?: string | null
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
  createdAt: string
}

type LineCustomer = {
  lineUserId: string
  displayName: string
  pictureUrl?: string | null
  isFriend: boolean
  accessCount: number
  firstSeenAt: string
  lastSeenAt: string
}

type AdminSummary = {
  orders: {
    total: number
    paid: number
    pending: number
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

type TrafficSource = {
  sourceChannel: string
  sessions: number
  visitors: number
  pageViews: number
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
  clickIdType?: string | null
  sessions: number
  actions: number
  checkoutIntents: number
}

type TrafficPage = {
  routePath: string
  sessions: number
  pageViews: number
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

type TrafficSection = {
  sectionId: string
  views: number
  sessions: number
  clicks: number
  lastAt?: string | null
}

type TrafficDevice = {
  deviceType: string
  sessions: number
  checkoutIntents: number
  avgScrollDepth: number
}

type TrafficGeo = {
  country: string
  region?: string | null
  city?: string | null
  sessions: number
  checkoutIntents: number
}

type TrafficData = {
  sources: TrafficSource[]
  campaigns: TrafficCampaign[]
  pages: TrafficPage[]
  sections: TrafficSection[]
  exits: TrafficExit[]
  devices: TrafficDevice[]
  geography: TrafficGeo[]
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
  createdAt: string
}

type Journey = {
  sessionId: string
  anonymousId: string
  startedAt: string
  lastAt: string
  sourceChannel: string
  landingPath?: string | null
  deviceType?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
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
  pending: '待付款',
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

function bounceRate(bounces: number, exits: number) {
  if (!exits) return '0%'
  return `${Math.round((bounces / exits) * 100)}%`
}

function statusLabel(status: string) {
  return statusLabels[status] || status
}

function statusClass(status: string) {
  if (status === 'paid') return 'border-neon/30 bg-neon/10 text-neon'
  if (status === 'pending') return 'border-gold/35 bg-gold/10 text-gold'
  return 'border-blaze/35 bg-blaze/10 text-blaze'
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

function OrdersTable({ orders }: { orders: AdminOrder[] }) {
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
              </td>
              <td className="px-4 py-4">
                <p className="font-medium text-pearl">{order.buyerName}</p>
                <p className="mt-1 text-mist/65">{order.buyerPhone}</p>
                {order.buyerEmail && (
                  <p className="mt-1 text-mist/45">{order.buyerEmail}</p>
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
                <p className="mt-1">付款 {formatDateTime(order.paidAt)}</p>
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
                {(event.city || event.country) && (
                  <p className="mt-1 text-xs text-mist/55">
                    {[event.city, event.region, event.country].filter(Boolean).join(' / ')}
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

function LineCustomersTable({ customers }: { customers: LineCustomer[] }) {
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

function TrafficDashboard({ traffic }: { traffic?: TrafficData }) {
  if (!traffic) return <EmptyState>流量資料讀取中。</EmptyState>

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {traffic.sources.slice(0, 4).map((source) => (
          <MetricCard
            key={source.sourceChannel}
            label={source.sourceChannel}
            value={`${source.sessions}`}
            detail={`訪客 ${source.visitors} · CTA ${source.actions} · 結帳意圖 ${source.checkoutIntents}`}
          />
        ))}
      </div>

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
                  看見 {section.views} · 點擊 {section.clicks}
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
            裝置與區域
          </p>
          <div className="mt-3 grid gap-2">
            {traffic.devices.map((device) => (
              <div
                key={device.deviceType}
                className="flex items-center justify-between gap-3 rounded-lg border border-pearl/8 bg-black/24 px-3 py-2"
              >
                <span className="font-heading text-pearl">{device.deviceType}</span>
                <span className="text-sm text-mist/70">
                  {device.sessions} sessions · 滾動 {formatPercent(device.avgScrollDepth)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            {traffic.geography.slice(0, 8).map((geo) => (
              <div
                key={`${geo.country}-${geo.region}-${geo.city}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-pearl/8 bg-black/24 px-3 py-2"
              >
                <span className="min-w-0 truncate text-mist/80">
                  {[geo.city, geo.region, geo.country].filter(Boolean).join(' / ')}
                </span>
                <span className="shrink-0 text-sm text-neon">
                  {geo.sessions}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {traffic.campaigns.length > 0 && (
        <section className="rounded-lg border border-pearl/10 bg-black/24 p-4">
          <p className="font-heading text-sm tracking-[0.18em] text-mist/60">
            UTM / 廣告活動
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {traffic.campaigns.map((campaign) => (
              <div
                key={`${campaign.utmSource}-${campaign.utmMedium}-${campaign.utmCampaign}-${campaign.clickIdType}`}
                className="rounded-lg border border-pearl/8 bg-black/24 p-3"
              >
                <p className="font-heading text-pearl">
                  {campaign.utmCampaign || campaign.clickIdType || '(none)'}
                </p>
                <p className="mt-1 text-sm text-mist/60">
                  {campaign.utmSource} / {campaign.utmMedium}
                </p>
                <p className="mt-2 text-sm text-mist/75">
                  {campaign.sessions} sessions · CTA {campaign.actions} · 結帳 {campaign.checkoutIntents}
                </p>
              </div>
            ))}
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
                {journey.sourceChannel} · {journey.deviceType || 'unknown'}
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-mist/45">
                {journey.sessionId}
              </p>
              <p className="mt-2 text-sm text-mist/65">
                入口 {journey.landingPath || '-'} · {[journey.city, journey.region, journey.country]
                  .filter(Boolean)
                  .join(' / ') || '區域未知'}
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
  const [activeTab, setActiveTab] = useState<AdminTab>('traffic')
  const [data, setData] = useState<AdminData>(initialData)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const summary = data.summary
  const checkoutRate = useMemo(() => {
    if (!summary || summary.orders.total === 0) return '0%'
    return `${Math.round((summary.orders.paid / summary.orders.total) * 100)}%`
  }, [summary])

  const loadAdminData = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError('')

    try {
      const [
        summaryResponse,
        trafficResponse,
        journeysResponse,
        ordersResponse,
        inventoryResponse,
        eventsResponse,
        lineResponse,
      ] =
        await Promise.all([
          fetchAdmin<{ summary: AdminSummary }>('/api/admin/summary', token),
          fetchAdmin<{ traffic: TrafficData }>('/api/admin/traffic', token),
          fetchAdmin<{ journeys: Journey[] }>('/api/admin/journeys?limit=40', token),
          fetchAdmin<{ orders: AdminOrder[] }>('/api/admin/orders?limit=80', token),
          fetchAdmin<{ inventory: InventoryRecord[] }>(
            '/api/admin/inventory?limit=120',
            token,
          ),
          fetchAdmin<{ events: TrackingEventRow[] }>('/api/admin/events?limit=120', token),
          fetchAdmin<{ customers: LineCustomer[] }>(
            '/api/admin/line-customers?limit=120',
            token,
          ),
        ])

      setData({
        summary: summaryResponse.summary,
        traffic: trafficResponse.traffic,
        journeys: journeysResponse.journeys,
        orders: ordersResponse.orders,
        inventory: inventoryResponse.inventory,
        events: eventsResponse.events,
        customers: lineResponse.customers,
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '後台資料讀取失敗')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadAdminData()
  }, [loadAdminData])

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
  }

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
              onClick={() => void loadAdminData()}
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

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="已付款營收"
            value={formatMoney(summary?.orders.paidRevenue ?? 0)}
            detail={`${summary?.orders.paid ?? 0} 筆付款成功`}
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
            detail={`${summary?.orders.total ?? 0} 筆總 checkout`}
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
          {activeTab === 'orders' && <OrdersTable orders={data.orders} />}
          {activeTab === 'inventory' && (
            <InventoryTable inventory={data.inventory} />
          )}
          {activeTab === 'events' && <EventsTable events={data.events} />}
          {activeTab === 'line' && (
            <LineCustomersTable customers={data.customers} />
          )}
        </section>
      </main>
    </div>
  )
}
