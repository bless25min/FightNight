/* global HTMLRewriter */

const PUBLIC_IMAGE_PATHS = {
  event: '/line-recovery/hero-poster.jpg',
  offers: '/line-recovery/offers-hero-octagon-poster.jpg',
  trainingPlan: '/line-recovery/training-plan-origin-poster.jpg',
}

const OFFICIAL_ORIGIN = 'https://booking.ufcgym.com.tw'
const OFFICIAL_HOST = 'booking.ufcgym.com.tw'
const LEGACY_PUBLIC_HOSTS = new Set([
  'fightnight.25min.co',
  'ufcgymtaiwan.25min.co',
  'fightnight-387.pages.dev',
])

const DEFAULT_META = {
  title: 'UFC GYM 官方課程預約｜UFCGYM TAIWAN',
  description:
    'UFCGYM TAIWAN 官方課程預約頁。選擇場館、日期與時段，預約單次體驗、拳擊／泰拳課程方案或免費體驗，線上付款後以官方 LINE 確認報名。',
  keywords:
    'UFCGYM TAIWAN, UFC GYM, 官方課程預約, 免費體驗, 單次體驗, 拳擊課程, 泰拳課程, 台北拳擊, 台中拳擊',
  imagePath: PUBLIC_IMAGE_PATHS.event,
  imageAlt: 'UFC GYM 官方課程預約主視覺',
}

const ROUTE_META = {
  '/': DEFAULT_META,
  '/single-session-event': DEFAULT_META,
  '/single-session-intro': DEFAULT_META,
  '/offers': {
    title: 'UFC GYM 課程方案｜預約與購買入口｜UFCGYM TAIWAN',
    description:
      'UFCGYM TAIWAN 課程預約與購買入口。比較單次體驗、首次免費體驗與拳擊／泰拳課程方案，先選場館、日期與時段，再線上保留課程。',
    keywords:
      'UFC GYM 課程方案, 單次體驗, 免費體驗, 拳擊課程, 泰拳課程, 台北拳擊, 台中拳擊',
    imagePath: PUBLIC_IMAGE_PATHS.offers,
    imageAlt: 'UFC GYM 課程方案主視覺',
  },
  '/privacy-policy': {
    title: '隱私權政策｜UFCGYM TAIWAN 課程預約',
    description:
      'UFCGYM TAIWAN 課程預約頁之隱私權政策，說明個人資料蒐集、使用、保存、LINE 報名確認與聯絡方式。',
    keywords: '隱私權政策, 個人資料保護, UFCGYM TAIWAN, UFC GYM 課程預約',
    imagePath: PUBLIC_IMAGE_PATHS.event,
    imageAlt: 'UFCGYM TAIWAN 課程預約隱私權政策',
  },
  '/terms-of-service': {
    title: '服務條款｜UFCGYM TAIWAN 課程預約',
    description:
      'UFCGYM TAIWAN 課程預約頁之服務條款，說明預約、付款、報到、取消、退款與客服聯繫規則。',
    keywords: '服務條款, UFCGYM TAIWAN, UFC GYM 課程預約',
    imagePath: PUBLIC_IMAGE_PATHS.event,
    imageAlt: 'UFCGYM TAIWAN 課程預約服務條款',
  },
  '/refund-policy': {
    title: '退款與取消政策｜UFCGYM TAIWAN 課程預約',
    description:
      'UFCGYM TAIWAN 課程預約頁之退款與取消政策，說明付款後取消、改期、退款申請與客服聯繫方式。',
    keywords: '退款與取消政策, UFCGYM TAIWAN, UFC GYM 課程預約',
    imagePath: PUBLIC_IMAGE_PATHS.event,
    imageAlt: 'UFCGYM TAIWAN 課程預約退款與取消政策',
  },
  '/guides/taipei-boxing-muay-thai-classes': {
    title: '台北拳擊／泰拳課程｜敦南與內湖場館選課指南',
    description:
      '整理台北拳擊、泰拳與踢拳課程的場館位置、初學者選課方向，以及 UFCGYM TAIWAN 敦南與內湖場館的預約方式。',
    keywords: '台北拳擊課程, 台北泰拳課程, UFCGYM 台北, 敦南拳擊課程, 內湖拳擊課程',
    imagePath: PUBLIC_IMAGE_PATHS.trainingPlan,
    imageAlt: '台北 UFC GYM 拳擊與泰拳課程指南',
  },
  '/guides/taichung-boxing-muay-thai-classes': {
    title: '台中拳擊／泰拳課程｜勤美旗艦館選課指南',
    description:
      '整理台中拳擊、泰拳與踢拳課程的場館位置、初學者選課方向，以及 UFCGYM TAIWAN 台中勤美旗艦館的預約方式。',
    keywords: '台中拳擊課程, 台中泰拳課程, 台中 UFCGYM, 勤美拳擊, 台中下班後運動',
    imagePath: PUBLIC_IMAGE_PATHS.trainingPlan,
    imageAlt: '台中 UFC GYM 拳擊與泰拳課程指南',
  },
  '/guides/beginner-combat-fitness': {
    title: '拳擊／泰拳新手指南｜第一次上課前可以先知道的事',
    description:
      '第一次想上拳擊課或泰拳課，常會擔心跟不上、被打或不知道要帶什麼。這份指南整理單次體驗與課程方案的差異和選課方式。',
    keywords: '拳擊新手, 泰拳新手, 格鬥健身新手, UFC GYM, 單次體驗',
    imagePath: PUBLIC_IMAGE_PATHS.trainingPlan,
    imageAlt: 'UFC GYM 初學者格鬥健身指南',
  },
  '/guides/stress-release-after-workout': {
    title: '下班後紓壓運動｜拳擊、泰拳與 UFC GYM 課程選擇',
    description:
      '如果你想找下班後能釋放壓力的運動，整理 UFC GYM 單次體驗、拳擊、泰拳和課程方案如何用節奏與沙包聲帶你進入狀態。',
    keywords: '下班後運動, 紓壓運動, UFC GYM, 拳擊課程, 泰拳課程',
    imagePath: PUBLIC_IMAGE_PATHS.event,
    imageAlt: 'UFC GYM 下班後紓壓課程指南',
  },
}

const LEGACY_ROUTE_REDIRECTS = {
  '/fight-night-event': '/',
  '/fight-night-intro': '/',
  '/boot-camp': '/offers',
}

function normalizePath(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path.endsWith('.html')) {
    const withoutHtml = path.replace(/\.html$/, '')
    return withoutHtml || '/'
  }
  return path
}

function shouldInspectHtml(request, pathname) {
  if (request.method !== 'GET') return false
  if (pathname.startsWith('/api/')) return false
  if (pathname.startsWith('/assets/')) return false

  const normalizedPath = normalizePath(pathname)
  if (!ROUTE_META[normalizedPath]) return false
  if (pathname.includes('.') && !pathname.endsWith('.html')) return false

  const accept = request.headers.get('accept') || ''
  return !accept || accept.includes('text/html') || accept.includes('*/*')
}

function shouldRedirectPublicHost(request, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  if (url.hostname === OFFICIAL_HOST) return false
  if (url.pathname.startsWith('/api/')) return false
  if (url.pathname.startsWith('/assets/')) return false
  if (url.pathname === '/favicon.ico') return false
  if (url.pathname.includes('.') && !url.pathname.endsWith('.html')) return false

  const isLegacyHost =
    LEGACY_PUBLIC_HOSTS.has(url.hostname) ||
    url.hostname.endsWith('.fightnight-387.pages.dev')
  if (!isLegacyHost) return false

  const accept = request.headers.get('accept') || ''
  return !accept || accept.includes('text/html') || accept.includes('*/*')
}

function absoluteUrl(origin, path) {
  return new URL(path, origin).toString()
}

function getLegacyRedirectUrl(pathname, origin, search) {
  const targetPath = LEGACY_ROUTE_REDIRECTS[normalizePath(pathname)]
  if (!targetPath) return null

  const targetUrl = new URL(targetPath, origin)
  targetUrl.search = search
  return targetUrl.toString()
}

function getMetaForPath(pathname, origin) {
  const normalizedPath = normalizePath(pathname)
  const meta = ROUTE_META[normalizedPath]
  if (!meta) return null

  return {
    ...meta,
    canonicalUrl: absoluteUrl(origin, normalizedPath),
    imageUrl: absoluteUrl(origin, meta.imagePath),
  }
}

function getFacebookAppId(env) {
  const value =
    env.FACEBOOK_APP_ID ||
    env.META_FACEBOOK_APP_ID ||
    env.VITE_FACEBOOK_APP_ID ||
    ''
  const normalized = String(value || '').trim()
  return /^\d{6,}$/.test(normalized) ? normalized : ''
}

class AttributeSetter {
  constructor(attribute, value) {
    this.attribute = attribute
    this.value = value
  }

  element(element) {
    element.setAttribute(this.attribute, this.value)
  }
}

class TitleSetter {
  constructor(value) {
    this.value = value
  }

  element(element) {
    element.setInnerContent(this.value)
  }
}

class HeadMetaAppender {
  constructor(meta) {
    this.meta = meta
  }

  element(element) {
    if (!this.meta.facebookAppId) return
    element.append(
      `\n    <meta property="fb:app_id" content="${this.meta.facebookAppId}" />`,
      { html: true },
    )
  }
}

function applyRouteMeta(response, meta) {
  return new HTMLRewriter()
    .on('head', new HeadMetaAppender(meta))
    .on('title', new TitleSetter(meta.title))
    .on('meta[name="description"]', new AttributeSetter('content', meta.description))
    .on('meta[name="keywords"]', new AttributeSetter('content', meta.keywords))
    .on('link[rel="canonical"]', new AttributeSetter('href', meta.canonicalUrl))
    .on('meta[property="og:title"]', new AttributeSetter('content', meta.title))
    .on('meta[property="og:description"]', new AttributeSetter('content', meta.description))
    .on('meta[property="og:url"]', new AttributeSetter('content', meta.canonicalUrl))
    .on('meta[property="og:image"]', new AttributeSetter('content', meta.imageUrl))
    .on('meta[property="og:image:alt"]', new AttributeSetter('content', meta.imageAlt))
    .on('meta[name="twitter:title"]', new AttributeSetter('content', meta.title))
    .on('meta[name="twitter:description"]', new AttributeSetter('content', meta.description))
    .on('meta[name="twitter:image"]', new AttributeSetter('content', meta.imageUrl))
    .on('meta[name="twitter:image:alt"]', new AttributeSetter('content', meta.imageAlt))
    .transform(response)
}

export async function onRequest(context) {
  const url = new URL(context.request.url)

  if (context.request.method === 'GET' || context.request.method === 'HEAD') {
    const redirectUrl = getLegacyRedirectUrl(url.pathname, OFFICIAL_ORIGIN, url.search)
    if (redirectUrl) return Response.redirect(redirectUrl, 301)
  }

  if (shouldRedirectPublicHost(context.request, url)) {
    const redirectUrl = new URL(normalizePath(url.pathname), OFFICIAL_ORIGIN)
    redirectUrl.search = url.search
    return Response.redirect(redirectUrl.toString(), 301)
  }

  const response = await context.next()

  if (!shouldInspectHtml(context.request, url.pathname)) return response

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const routeMeta = getMetaForPath(url.pathname, OFFICIAL_ORIGIN)
  if (!routeMeta) return response

  const meta = {
    ...routeMeta,
    facebookAppId: getFacebookAppId(context.env),
  }

  return applyRouteMeta(response, meta)
}
