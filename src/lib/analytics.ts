export type TrackingParams = Record<string, string | number | boolean>

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

const anonymousIdKey = 'fightnight_anonymous_id'
const sessionIdKey = 'fightnight_session_id'

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

function getGaMeasurementId() {
  return import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
}

function getMetaPixelId() {
  return import.meta.env.VITE_META_PIXEL_ID as string | undefined
}

function getLineTagId() {
  return import.meta.env.VITE_LINE_TAG_ID as string | undefined
}

function getLineCustomerType() {
  return (
    (import.meta.env.VITE_LINE_TAG_CUSTOMER_TYPE as string | undefined) || 'lap'
  )
}

function normalizeParams(params?: TrackingParams): TrackingParams | undefined {
  if (!params) return undefined

  return Object.entries(params).reduce<TrackingParams>((acc, [key, value]) => {
    acc[key] = value
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

function postServerEvent(
  event: string,
  params: TrackingParams | undefined,
  eventId: string,
) {
  if (typeof window === 'undefined') return

  const payload = JSON.stringify({
    event,
    params: params ?? {},
    eventId,
    anonymousId: getAnonymousId(),
    sessionId: getSessionId(),
    eventValue: params?.value ?? params?.event_value,
    currency: params?.currency ?? 'TWD',
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

  initGA4()
  initMetaPixel()
  initLineTag()
  postServerEvent(
    'page_view',
    { page_path: getRoutePath() },
    createEventId('page_view'),
  )
}

export function trackPageView(path: string) {
  if (isPrivateAnalyticsPath(path)) return

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
