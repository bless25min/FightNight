export type TrackingParams = Record<string, string | number | boolean>

type GtagArguments =
  | ['js', Date]
  | ['config', string]
  | ['event', string, TrackingParams?]

type GtagFunction = (...args: GtagArguments) => void

type MetaPixelArguments =
  | ['init', string]
  | ['track', string]
  | ['trackCustom', string, TrackingParams?]

type MetaPixelFunction = ((...args: MetaPixelArguments) => void) & {
  callMethod?: (...args: MetaPixelArguments) => void
  queue: MetaPixelArguments[]
  push: MetaPixelFunction
  loaded: boolean
  version: string
}

declare global {
  interface Window {
    dataLayer?: GtagArguments[]
    gtag?: GtagFunction
    fbq?: MetaPixelFunction
    _fbq?: MetaPixelFunction
  }
}

// GA4 初始化
export function initGA4() {
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (!gaId) return

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

// Meta Pixel 初始化
export function initMetaPixel() {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID
  if (!pixelId) return

  if (window.fbq) return

  // Meta Pixel SDK 載入
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

  const s = document.createElement('script')
  s.async = true
  s.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(s)

  window.fbq('init', pixelId)
  window.fbq('track', 'PageView')
}

// 統一初始化入口
export function initAnalytics() {
  initGA4()
  initMetaPixel()
}
