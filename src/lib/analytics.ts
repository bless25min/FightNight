// GA4 初始化
export function initGA4() {
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (!gaId) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
  document.head.appendChild(script)

  const w = window as any
  w.dataLayer = w.dataLayer || []
  w.gtag = function (...args: any[]) {
    w.dataLayer.push(args)
  }
  w.gtag('js', new Date())
  w.gtag('config', gaId)
}

// Meta Pixel 初始化
export function initMetaPixel() {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID
  if (!pixelId) return

  const w = window as any
  if (w.fbq) return

  // Meta Pixel SDK 載入
  const n: any = (w.fbq = function (...args: any[]) {
    if (n.callMethod) {
      n.callMethod(...args)
    } else {
      n.queue.push(args)
    }
  })
  w._fbq = n
  n.push = n
  n.loaded = true
  n.version = '2.0'
  n.queue = [] as any[]

  const s = document.createElement('script')
  s.async = true
  s.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(s)

  w.fbq('init', pixelId)
  w.fbq('track', 'PageView')
}

// 統一初始化入口
export function initAnalytics() {
  initGA4()
  initMetaPixel()
}
