export type TrackingParams = Record<
  string,
  string | number | boolean | undefined | null
>

export type MetaStandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'Lead'
  | 'InitiateCheckout'
  | 'AddToCart'
  | 'CompleteRegistration'

type GtagArguments =
  | ['js', Date]
  | ['config', string, TrackingParams?]
  | ['event', string, TrackingParams?]

type GtagFunction = (...args: GtagArguments) => void

type MetaPixelArguments =
  | ['init', string]
  | ['track', string, TrackingParams?, MetaPixelOptions?]
  | ['trackCustom', string, TrackingParams?, MetaPixelOptions?]

type MetaPixelOptions = {
  eventID?: string
}

type MetaPixelFunction = ((...args: MetaPixelArguments) => void) & {
  callMethod?: (...args: MetaPixelArguments) => void
  queue: MetaPixelArguments[]
  push: MetaPixelFunction
  loaded: boolean
  version: string
}

type LineTagFunction = (...args: unknown[]) => void

type RuntimeAnalyticsConfig = {
  gaMeasurementId?: string
  lineTagCustomerType?: string
  lineTagId?: string
  metaPixelId?: string
}

const anonymousIdKey = 'fightnight_anonymous_id'
const sessionIdKey = 'fightnight_session_id'
const attributionKey = 'fightnight_attribution'
const visitorProfileKey = 'fightnight_visitor_profile'
let runtimeConfig: RuntimeAnalyticsConfig = {}
let runtimeConfigPromise: Promise<RuntimeAnalyticsConfig> | undefined
let behaviorTrackingStarted = false

type StoredAttribution = {
  landingPath: string
  landingUrl: string
  referrer: string
  sourceChannel: string
  createdAt: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  clickIdType?: string
  clickIdValue?: string
}

type StoredVisitorProfile = {
  firstSeenAt: string
  lastSessionId?: string
  sessionIndex: number
}

type PageState = {
  path: string
  startedAt: number
  maxScrollDepth: number
  interactions: number
  firedScrollDepths: Set<number>
  viewedSections: Set<string>
  engagementSentAt: number
  activeSectionId?: string
  activeSectionStartedAt?: number
}

let pageState: PageState | undefined
let sectionObserver: IntersectionObserver | undefined
const minSectionDurationMs = 700
const maxSectionDurationMs = 5 * 60 * 1000

declare global {
  interface Window {
    dataLayer?: GtagArguments[]
    gtag?: GtagFunction
    fbq?: MetaPixelFunction
    _fbq?: MetaPixelFunction
    _ltq?: unknown[]
    _lt?: LineTagFunction
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function readRuntimeConfigValue(key: keyof RuntimeAnalyticsConfig) {
  const value = runtimeConfig[key]
  return isNonEmptyString(value) ? value.trim() : undefined
}

function applyRuntimeConfig(data: unknown) {
  if (!data || typeof data !== 'object') return runtimeConfig

  const next = data as RuntimeAnalyticsConfig
  runtimeConfig = {
    gaMeasurementId: isNonEmptyString(next.gaMeasurementId)
      ? next.gaMeasurementId.trim()
      : runtimeConfig.gaMeasurementId,
    lineTagCustomerType: isNonEmptyString(next.lineTagCustomerType)
      ? next.lineTagCustomerType.trim()
      : runtimeConfig.lineTagCustomerType,
    lineTagId: isNonEmptyString(next.lineTagId)
      ? next.lineTagId.trim()
      : runtimeConfig.lineTagId,
    metaPixelId: isNonEmptyString(next.metaPixelId)
      ? next.metaPixelId.trim()
      : runtimeConfig.metaPixelId,
  }

  return runtimeConfig
}

function loadRuntimeConfig() {
  if (typeof window === 'undefined') {
    return Promise.resolve(runtimeConfig)
  }

  runtimeConfigPromise ??= fetch('/api/config', {
    headers: { accept: 'application/json' },
  })
    .then((response) => (response.ok ? response.json() : null))
    .then(applyRuntimeConfig)
    .catch(() => runtimeConfig)

  return runtimeConfigPromise
}

function getGaMeasurementId() {
  return (
    (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) ||
    readRuntimeConfigValue('gaMeasurementId')
  )
}

function getMetaPixelId() {
  return (
    (import.meta.env.VITE_META_PIXEL_ID as string | undefined) ||
    readRuntimeConfigValue('metaPixelId')
  )
}

function getLineTagId() {
  return (
    (import.meta.env.VITE_LINE_TAG_ID as string | undefined) ||
    readRuntimeConfigValue('lineTagId')
  )
}

function getLineCustomerType() {
  return (
    (import.meta.env.VITE_LINE_TAG_CUSTOMER_TYPE as string | undefined) ||
    readRuntimeConfigValue('lineTagCustomerType') ||
    'lap'
  )
}

function normalizeParams(params?: TrackingParams): TrackingParams | undefined {
  if (!params) return undefined

  return Object.entries(params).reduce<TrackingParams>((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') acc[key] = value
    return acc
  }, {})
}

function sanitizeLineEventName(eventName: string) {
  const sanitized = eventName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
  return sanitized || 'CustomEvent'
}

function createEventId(event: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${event}.${crypto.randomUUID()}`
  }

  return `${event}.${Date.now()}.${Math.random().toString(36).slice(2)}`
}

function createClientId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}.${crypto.randomUUID()}`
  }

  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2)}`
}

function getStoredClientId(
  storage: Storage | undefined,
  key: string,
  prefix: string,
) {
  if (!storage) return createClientId(prefix)

  try {
    const existing = storage.getItem(key)
    if (existing) return existing

    const next = createClientId(prefix)
    storage.setItem(key, next)
    return next
  } catch {
    return createClientId(prefix)
  }
}

function getAnonymousId() {
  if (typeof window === 'undefined') return createClientId('anon')
  return getStoredClientId(window.localStorage, anonymousIdKey, 'anon')
}

function getSessionId() {
  if (typeof window === 'undefined') return createClientId('session')
  return getStoredClientId(window.sessionStorage, sessionIdKey, 'session')
}

function getRoutePath() {
  if (typeof window === 'undefined') return ''
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function getPathOnly() {
  if (typeof window === 'undefined') return ''
  return `${window.location.pathname}${window.location.hash}`
}

function isPrivateAnalyticsPath(path: string) {
  return (
    path.startsWith('/admin') ||
    path.startsWith('/admin.html') ||
    path.includes('#/admin')
  )
}

function isPrivateAnalyticsRoute() {
  return isPrivateAnalyticsPath(getRoutePath())
}

function readStorageJson<T>(storage: Storage | undefined, key: string): T | null {
  if (!storage) return null

  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeStorageJson<T>(storage: Storage | undefined, key: string, value: T) {
  if (!storage) return

  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Analytics should never block the page.
  }
}

function getClickIdType(searchParams: URLSearchParams) {
  if (searchParams.get('fbclid')) return 'fbclid'
  if (searchParams.get('gclid')) return 'gclid'
  if (searchParams.get('gbraid')) return 'gbraid'
  if (searchParams.get('wbraid')) return 'wbraid'
  if (searchParams.get('msclkid')) return 'msclkid'
  if (searchParams.get('ttclid')) return 'ttclid'
  if (searchParams.get('li_fat_id')) return 'line'
  return ''
}

function getClickIdValue(searchParams: URLSearchParams) {
  for (const key of [
    'fbclid',
    'gclid',
    'gbraid',
    'wbraid',
    'msclkid',
    'ttclid',
    'li_fat_id',
  ]) {
    const value = searchParams.get(key)
    if (value) return value
  }
  return ''
}

function getReferrerHost(referrer: string) {
  try {
    return referrer ? new URL(referrer).hostname.replace(/^www\./, '') : ''
  } catch {
    return ''
  }
}

function inferSourceChannel(searchParams: URLSearchParams, referrer: string) {
  const medium = (searchParams.get('utm_medium') || '').toLowerCase()
  const source = (searchParams.get('utm_source') || '').toLowerCase()
  const clickId = getClickIdType(searchParams)
  const host = getReferrerHost(referrer).toLowerCase()

  if (clickId) return clickId === 'line' ? 'paid_line' : 'paid'
  if (/(cpc|ppc|paid|ads?|display|retarget|remarketing)/i.test(medium)) return 'paid'
  if (/email|newsletter/.test(medium)) return 'email'
  if (/line/.test(source) || /line/.test(host)) return 'line'
  if (/facebook|instagram|threads|meta|tiktok|youtube/.test(source)) return 'social'
  if (/facebook|instagram|threads|tiktok|youtube|x\.com|twitter/.test(host)) return 'social'
  if (/google|bing|yahoo|duckduckgo|baidu/.test(host)) return 'organic_search'
  if (host) return 'referral'
  return 'direct'
}

function buildAttributionFromLocation(): StoredAttribution {
  const url = new URL(window.location.href)
  const referrer = document.referrer || ''
  const searchParams = url.searchParams
  return {
    landingPath: getPathOnly() || '/',
    landingUrl: window.location.href,
    referrer,
    sourceChannel: inferSourceChannel(searchParams, referrer),
    createdAt: new Date().toISOString(),
    utmSource: searchParams.get('utm_source') || undefined,
    utmMedium: searchParams.get('utm_medium') || undefined,
    utmCampaign: searchParams.get('utm_campaign') || undefined,
    utmContent: searchParams.get('utm_content') || undefined,
    utmTerm: searchParams.get('utm_term') || undefined,
    clickIdType: getClickIdType(searchParams) || undefined,
    clickIdValue: getClickIdValue(searchParams) || undefined,
  }
}

function getAttribution() {
  if (typeof window === 'undefined') return null

  const current = buildAttributionFromLocation()
  const stored = readStorageJson<StoredAttribution>(
    window.localStorage,
    attributionKey,
  )

  if (!stored) {
    writeStorageJson(window.localStorage, attributionKey, current)
    return {
      first: current,
      current,
    }
  }

  return {
    first: stored,
    current,
  }
}

function getDeviceType() {
  if (typeof window === 'undefined') return 'unknown'

  const userAgent = window.navigator.userAgent
  if (/bot|crawler|spider|crawling/i.test(userAgent)) return 'bot'
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) return 'tablet'
  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

function getBrowserName() {
  if (typeof window === 'undefined') return 'unknown'
  const ua = window.navigator.userAgent

  if (/Line\//i.test(ua)) return 'LINE'
  if (/Instagram/i.test(ua)) return 'Instagram'
  if (/FBAN|FBAV|FBIOS|FB_IAB/i.test(ua)) return 'Facebook'
  if (/TikTok/i.test(ua)) return 'TikTok'
  if (/Edg\//i.test(ua)) return 'Edge'
  if (/CriOS|Chrome\//i.test(ua)) return 'Chrome'
  if (/FxiOS|Firefox\//i.test(ua)) return 'Firefox'
  if (/Safari\//i.test(ua)) return 'Safari'
  return 'other'
}

function getOsName() {
  if (typeof window === 'undefined') return 'unknown'
  const ua = window.navigator.userAgent
  const platform = window.navigator.platform || ''

  if (/Android/i.test(ua)) return 'Android'
  if (/iPhone|iPad|iPod/i.test(ua) || (/Mac/i.test(platform) && 'ontouchend' in document)) {
    return 'iOS'
  }
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS'
  if (/CrOS/i.test(ua)) return 'ChromeOS'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'other'
}

function getInAppBrowser() {
  if (typeof window === 'undefined') return ''
  const ua = window.navigator.userAgent

  if (/Line\//i.test(ua)) return 'LINE'
  if (/Instagram/i.test(ua)) return 'Instagram'
  if (/FBAN|FBAV|FBIOS|FB_IAB/i.test(ua)) return 'Facebook'
  if (/TikTok/i.test(ua)) return 'TikTok'
  if (/MicroMessenger/i.test(ua)) return 'WeChat'
  return ''
}

function getVisitorProfile() {
  if (typeof window === 'undefined') {
    return { visitorType: 'unknown', sessionIndex: 0 }
  }

  const sessionId = getSessionId()
  const existing = readStorageJson<StoredVisitorProfile>(
    window.localStorage,
    visitorProfileKey,
  )
  const profile: StoredVisitorProfile = existing
    ? { ...existing }
    : { firstSeenAt: new Date().toISOString(), sessionIndex: 0 }

  if (profile.lastSessionId !== sessionId) {
    profile.sessionIndex = Math.max(0, profile.sessionIndex || 0) + 1
    profile.lastSessionId = sessionId
    writeStorageJson(window.localStorage, visitorProfileKey, profile)
  }

  return {
    visitorType: profile.sessionIndex <= 1 ? 'new' : 'returning',
    sessionIndex: profile.sessionIndex,
  }
}

function getTrackingContextParams(): TrackingParams {
  if (typeof window === 'undefined') return {}

  const attribution = getAttribution()
  const first = attribution?.first
  const current = attribution?.current
  const visitor = getVisitorProfile()

  return normalizeParams({
    page_path: getRoutePath(),
    landing_path: first?.landingPath || getPathOnly(),
    source_channel: current?.sourceChannel || 'direct',
    first_source_channel: first?.sourceChannel || 'direct',
    first_landing_path: first?.landingPath || getPathOnly(),
    referrer_host: getReferrerHost(document.referrer || first?.referrer || ''),
    utm_source: current?.utmSource || first?.utmSource || '',
    utm_medium: current?.utmMedium || first?.utmMedium || '',
    utm_campaign: current?.utmCampaign || first?.utmCampaign || '',
    utm_content: current?.utmContent || first?.utmContent || '',
    utm_term: current?.utmTerm || first?.utmTerm || '',
    click_id_type: current?.clickIdType || first?.clickIdType || '',
    click_id_value: current?.clickIdValue || first?.clickIdValue || '',
    device_type: getDeviceType(),
    browser_name: getBrowserName(),
    os_name: getOsName(),
    in_app_browser: getInAppBrowser(),
    browser_language: window.navigator.language || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    visitor_type: visitor.visitorType,
    session_index: visitor.sessionIndex,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    screen_width: window.screen?.width || 0,
    screen_height: window.screen?.height || 0,
  }) ?? {}
}

function getScrollDepth() {
  if (typeof window === 'undefined') return 0

  const total = document.documentElement.scrollHeight - window.innerHeight
  if (total <= 0) return 100

  return Math.max(0, Math.min(100, Math.round((window.scrollY / total) * 100)))
}

function getPageState() {
  const path = getRoutePath()
  if (!pageState || pageState.path !== path) {
    pageState = {
      path,
      startedAt: Date.now(),
      maxScrollDepth: getScrollDepth(),
      interactions: 0,
      firedScrollDepths: new Set(),
      viewedSections: new Set(),
      engagementSentAt: 0,
    }
  }

  return pageState
}

function markInteraction() {
  if (isPrivateAnalyticsRoute()) return
  getPageState().interactions += 1
}

function postServerEvent(
  event: string,
  params: TrackingParams | undefined,
  eventId: string,
) {
  if (typeof window === 'undefined') return

  const mergedParams = normalizeParams({
    ...getTrackingContextParams(),
    ...(params ?? {}),
  })
  const payload = JSON.stringify({
    event,
    params: mergedParams ?? {},
    eventId,
    anonymousId: getAnonymousId(),
    sessionId: getSessionId(),
    eventValue: mergedParams?.value ?? mergedParams?.event_value,
    currency: mergedParams?.currency ?? 'TWD',
    sourceUrl: window.location.href,
    referrer: document.referrer,
    routePath: getRoutePath(),
  })

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      '/api/events',
      new Blob([payload], { type: 'application/json' }),
    )
    if (sent) return
  }

  void fetch('/api/events', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: payload,
    keepalive: true,
  }).catch(() => undefined)
}

function flushPageEngagement(eventName = 'page_exit') {
  if (typeof window === 'undefined' || isPrivateAnalyticsRoute() || !pageState) return

  const state = pageState
  const now = Date.now()
  const durationMs = Math.max(0, now - state.startedAt)

  if (eventName === 'page_exit') {
    flushActiveSectionEngagement(state, now, 'page_exit')
    state.activeSectionId = undefined
    state.activeSectionStartedAt = undefined
  }

  if (eventName !== 'page_exit' && now - state.engagementSentAt < 20_000) return
  state.engagementSentAt = now
  state.maxScrollDepth = Math.max(state.maxScrollDepth, getScrollDepth())

  postServerEvent(
    eventName,
    {
      page_path: state.path,
      duration_ms: durationMs,
      max_scroll_depth: state.maxScrollDepth,
      interaction_count: state.interactions,
      is_bounce: state.interactions === 0 && state.maxScrollDepth < 25,
    },
    createEventId(eventName),
  )
}

function flushActiveSectionEngagement(
  state: PageState,
  now = Date.now(),
  nextSectionId?: string,
) {
  if (!state.activeSectionId || !state.activeSectionStartedAt) return

  const rawDurationMs = Math.max(0, now - state.activeSectionStartedAt)
  if (rawDurationMs < minSectionDurationMs) return

  const durationMs = Math.min(rawDurationMs, maxSectionDurationMs)

  postServerEvent(
    'section_engagement',
    {
      page_path: state.path,
      section_id: state.activeSectionId,
      duration_ms: durationMs,
      next_section_id: nextSectionId,
      duration_capped: rawDurationMs > maxSectionDurationMs,
    },
    createEventId('section_engagement'),
  )
}

function markActiveSection(state: PageState, sectionId: string) {
  if (state.activeSectionId === sectionId) return

  const now = Date.now()
  flushActiveSectionEngagement(state, now, sectionId)
  state.activeSectionId = sectionId
  state.activeSectionStartedAt = now
}

function resetPageState(path = getRoutePath()) {
  pageState = {
    path,
    startedAt: Date.now(),
    maxScrollDepth: getScrollDepth(),
    interactions: 0,
    firedScrollDepths: new Set(),
    viewedSections: new Set(),
    engagementSentAt: 0,
  }
}

function refreshSectionObserver() {
  if (typeof window === 'undefined' || isPrivateAnalyticsRoute()) return
  sectionObserver?.disconnect()

  const state = getPageState()
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('[data-section], section[id]'),
  ).filter((section) => section.dataset.section || section.id)

  if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return

  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) continue
        const target = entry.target as HTMLElement
        const sectionId = target.dataset.section || target.id
        if (!sectionId) continue

        markActiveSection(state, sectionId)
        if (state.viewedSections.has(sectionId)) continue
        state.viewedSections.add(sectionId)
        postServerEvent(
          'section_view',
          {
            section_id: sectionId,
            section_index: sections.indexOf(target) + 1,
            visible_ratio: Number(entry.intersectionRatio.toFixed(2)),
          },
          createEventId('section_view'),
        )
      }
    },
    { threshold: [0.35, 0.6] },
  )

  sections.forEach((section) => sectionObserver?.observe(section))
}

function setupSectionObserverSoon() {
  window.setTimeout(refreshSectionObserver, 250)
  window.setTimeout(refreshSectionObserver, 1200)
}

function handleScrollDepth() {
  if (isPrivateAnalyticsRoute()) return
  const state = getPageState()
  const depth = getScrollDepth()
  state.maxScrollDepth = Math.max(state.maxScrollDepth, depth)

  for (const checkpoint of [25, 50, 75, 90, 100]) {
    if (depth >= checkpoint && !state.firedScrollDepths.has(checkpoint)) {
      state.firedScrollDepths.add(checkpoint)
      postServerEvent(
        'scroll_depth',
        {
          scroll_depth: checkpoint,
          max_scroll_depth: depth,
        },
        createEventId(`scroll_${checkpoint}`),
      )
    }
  }
}

function getElementText(element: Element) {
  return (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80)
}

function setupDelegatedClickTracking() {
  document.addEventListener(
    'click',
    (event) => {
      if (isPrivateAnalyticsRoute() || !(event.target instanceof Element)) return

      const element = event.target.closest<HTMLElement>('[data-cta], a[href]')
      if (!element) return

      markInteraction()
      const section = element.closest<HTMLElement>('[data-section], section[id]')
      const href = element instanceof HTMLAnchorElement ? element.href : ''
      const ctaId = element.dataset.cta || ''

      postServerEvent(
        'ui_click',
        {
          cta_id: ctaId || href || element.tagName.toLowerCase(),
          target_tag: element.tagName.toLowerCase(),
          target_text: getElementText(element),
          href,
          section_id: section?.dataset.section || section?.id || '',
        },
        createEventId('ui_click'),
      )
    },
    true,
  )
}

function setupBehaviorTracking() {
  if (typeof window === 'undefined' || behaviorTrackingStarted) return
  behaviorTrackingStarted = true
  resetPageState()
  setupSectionObserverSoon()

  window.addEventListener('scroll', handleScrollDepth, { passive: true })
  window.addEventListener('pagehide', () => flushPageEngagement('page_exit'))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPageEngagement('page_exit')
  })
  window.setInterval(() => flushPageEngagement('page_engagement'), 30_000)
  setupDelegatedClickTracking()
}

export function initGA4() {
  const gaId = getGaMeasurementId()
  if (!gaId || window.gtag) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function (...args) {
    window.dataLayer?.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', gaId)
}

export function initMetaPixel() {
  const pixelId = getMetaPixelId()
  if (!pixelId || window.fbq) return

  const fbq = function (...args: MetaPixelArguments) {
    if (fbq.callMethod) {
      fbq.callMethod(...args)
    } else {
      fbq.queue.push(args)
    }
  } as MetaPixelFunction

  fbq.queue = []
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'

  window.fbq = fbq
  window._fbq = fbq

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)

  window.fbq('init', pixelId)
  window.fbq('track', 'PageView')
}

export function initLineTag() {
  const tagId = getLineTagId()
  if (!tagId || window._lt) return

  window._ltq = window._ltq || []
  window._lt = function (...args: unknown[]) {
    window._ltq?.push(args)
  }

  const host =
    window.location.protocol === 'https:'
      ? 'https://d.line-scdn.net'
      : 'http://d.line-cdn.net'
  const script = document.createElement('script')
  script.async = true
  script.src = `${host}/n/line_tag/public/release/v1/lt.js`

  const firstScript = document.getElementsByTagName('script')[0]
  firstScript?.parentNode?.insertBefore(script, firstScript)

  window._lt('init', {
    customerType: getLineCustomerType(),
    tagId,
  })
  window._lt('send', 'pv', [tagId])
}

export function initAnalytics() {
  if (isPrivateAnalyticsRoute()) return

  setupBehaviorTracking()
  initGA4()
  initMetaPixel()
  initLineTag()
  void loadRuntimeConfig().then(() => {
    initGA4()
    initMetaPixel()
    initLineTag()
  })
  postServerEvent(
    'page_view',
    { page_path: getRoutePath() },
    createEventId('page_view'),
  )
}

export function trackPageView(path: string) {
  if (isPrivateAnalyticsPath(path)) return

  flushPageEngagement('page_exit')
  resetPageState(path)
  setupSectionObserverSoon()

  const params = normalizeParams({ page_path: path })
  const eventId = createEventId('page_view')
  const gaId = getGaMeasurementId()
  const lineTagId = getLineTagId()

  if (gaId) window.gtag?.('config', gaId, params)
  window.fbq?.('track', 'PageView')
  if (lineTagId) window._lt?.('send', 'pv', [lineTagId])
  postServerEvent('page_view', params, eventId)
}

export function trackAnalyticsEvent(
  event: string,
  params?: TrackingParams,
  options: {
    metaStandardEvent?: MetaStandardEvent
    lineEventName?: string
  } = {},
) {
  if (isPrivateAnalyticsRoute()) return

  const eventId =
    typeof params?.event_id === 'string' ? params.event_id : createEventId(event)
  const normalizedParams = normalizeParams({
    ...(params ?? {}),
    event_id: eventId,
  })
  const lineTagId = getLineTagId()
  const metaOptions: MetaPixelOptions = { eventID: eventId }

  window.gtag?.('event', event, normalizedParams)
  if (options.metaStandardEvent) {
    window.fbq?.('track', options.metaStandardEvent, normalizedParams, metaOptions)
  }
  window.fbq?.('trackCustom', event, normalizedParams, metaOptions)

  if (lineTagId && options.lineEventName) {
    window._lt?.(
      'send',
      'cv',
      {
        type: sanitizeLineEventName(options.lineEventName),
        ...(normalizedParams ?? {}),
      },
      [lineTagId],
    )
  }

  postServerEvent(event, normalizedParams, eventId)
}
