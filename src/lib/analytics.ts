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
  initGA4()
  initMetaPixel()
  initLineTag()
}

export function trackPageView(path: string) {
  const params = normalizeParams({ page_path: path })
  const gaId = getGaMeasurementId()
  const lineTagId = getLineTagId()

  if (gaId) window.gtag?.('config', gaId, params)
  window.fbq?.('track', 'PageView')
  if (lineTagId) window._lt?.('send', 'pv', [lineTagId])
}

export function trackAnalyticsEvent(
  event: string,
  params?: TrackingParams,
  options: {
    metaStandardEvent?: MetaStandardEvent
    lineEventName?: string
  } = {},
) {
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
}
