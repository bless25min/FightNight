/* global HTMLRewriter */

const PUBLIC_IMAGE_PATHS = {
  event: '/line-recovery/hero-poster.jpg',
  offers: '/line-recovery/offers-hero-octagon-poster.jpg',
  bootCamp: '/line-recovery/bootcamp-origin-poster.jpg',
}

const DEFAULT_META = {
  title: 'Fight Night｜Fight Night Pass｜UFCGYM TAIWAN',
  description:
    '本頁為 UFCGYM TAIWAN 活動預約與課程報名落地頁，提供 Fight Night 夜間入場體驗、首次免費體驗、Boot Camp 課程方案、線上付款與官方 LINE 報名確認。',
  keywords:
    'Fight Night, Fight Night Pass, UFCGYM TAIWAN, UFC GYM, 免費體驗, Boot Camp, 拳擊課程, 泰拳課程',
  imagePath: PUBLIC_IMAGE_PATHS.event,
  imageAlt: 'UFC GYM Fight Night Pass 活動主視覺',
}

const ROUTE_META = {
  '/': DEFAULT_META,
  '/fight-night-event': {
    title: 'Fight Night｜Fight Night Pass｜UFCGYM TAIWAN',
    description:
      'UFCGYM TAIWAN Fight Night 活動預約頁。走進 UFC GYM，戴上拳套，把 50 分鐘交給倒數、沙包聲和全場，線上保留場次後以官方 LINE 確認報名。',
    keywords:
      'Fight Night, Fight Night Pass, UFCGYM TAIWAN, UFC GYM, 夜間運動, 沙包聲, 免費體驗',
    imagePath: PUBLIC_IMAGE_PATHS.event,
    imageAlt: 'UFC GYM Fight Night Pass 活動主視覺',
  },
  '/offers': {
    title: 'UFC GYM 課程方案｜預約與購買入口｜UFCGYM TAIWAN',
    description:
      'UFCGYM TAIWAN 課程預約與購買入口。比較 Fight Night Pass、首次免費體驗與 Boot Camp 方案，先選場館、日期與時段，再線上保留課程。',
    keywords:
      'UFC GYM 課程方案, Fight Night Pass, Boot Camp, 免費體驗, 拳擊課程, 泰拳課程, 台北拳擊, 台中拳擊',
    imagePath: PUBLIC_IMAGE_PATHS.offers,
    imageAlt: 'UFC GYM Fight Night 與 Boot Camp 課程方案主視覺',
  },
  '/boot-camp': {
    title: 'Boot Camp 拳擊/泰拳課程｜台北台中 UFCGYM 初學者訓練計畫',
    description:
      '想找台北或台中拳擊、泰拳、踢拳課程？UFCGYM TAIWAN Boot Camp 幫你選場館、第一堂日期與兩堂或四堂訓練節奏。',
    keywords:
      'Boot Camp, UFCGYM TAIWAN, 拳擊課程, 泰拳課程, 踢拳課程, 台北拳擊, 台中拳擊, 初學者訓練',
    imagePath: PUBLIC_IMAGE_PATHS.bootCamp,
    imageAlt: 'UFC GYM Boot Camp 拳擊與泰拳訓練主視覺',
  },
  '/fight-night-intro': {
    title: 'Fight Night｜TRAIN DIFFERENT｜UFCGYM TAIWAN',
    description:
      'Fight Night 把倒數、口令、沙包聲和全場節奏，變成一個讓人進入狀態的晚上。了解 UFC GYM Fight Night 的入場體驗。',
    keywords:
      'Fight Night, TRAIN DIFFERENT, UFCGYM TAIWAN, UFC GYM, 沙包聲, 夜間運動',
    imagePath: PUBLIC_IMAGE_PATHS.event,
    imageAlt: 'UFC GYM Fight Night 入場體驗主視覺',
  },
  '/privacy-policy': {
    title: '隱私權政策｜UFCGYM TAIWAN 活動預約與課程報名',
    description:
      'UFCGYM TAIWAN 活動預約與課程報名落地頁隱私權政策，說明預約、購買、LINE 確認、付款與廣告成效資料之處理方式。',
    keywords: '隱私權政策, 個人資料保護, Fight Night, Boot Camp, UFCGYM TAIWAN',
    imagePath: PUBLIC_IMAGE_PATHS.event,
    imageAlt: 'UFCGYM TAIWAN 活動預約與課程報名網站資訊',
  },
  '/terms-of-service': {
    title: '服務條款｜UFCGYM TAIWAN 活動預約與課程報名',
    description:
      'UFCGYM TAIWAN 活動預約與課程報名落地頁服務條款，說明預約、購買、付款、課程參與、第三方服務與使用者權利義務。',
    keywords: '服務條款, Fight Night 條款, Boot Camp 條款, UFCGYM TAIWAN',
    imagePath: PUBLIC_IMAGE_PATHS.event,
    imageAlt: 'UFCGYM TAIWAN 活動預約與課程報名服務條款',
  },
  '/refund-policy': {
    title: '退款與取消政策｜UFCGYM TAIWAN 活動預約與課程報名',
    description:
      'UFCGYM TAIWAN 活動預約與課程報名落地頁退款與取消政策，說明免費體驗、付費課程、改期、退款申請與作業時間。',
    keywords: '退款與取消政策, Fight Night 退款, Boot Camp 退款, UFCGYM TAIWAN',
    imagePath: PUBLIC_IMAGE_PATHS.event,
    imageAlt: 'UFCGYM TAIWAN 活動預約與課程報名退款與取消政策',
  },
  '/guides/taipei-boxing-muay-thai-classes': {
    title: '台北拳擊、泰拳課程怎麼選？敦南與內湖初學者指南',
    description:
      '正在找台北拳擊課程、泰拳課程或下班後的格鬥健身？整理 UFCGYM TAIWAN 敦南旗艦館、內科模範館的交通、課程選擇與新手常見問題。',
    keywords: '台北拳擊課程, 台北泰拳課程, UFCGYM 台北, 大安拳擊課程, 內湖拳擊課程',
    imagePath: PUBLIC_IMAGE_PATHS.bootCamp,
    imageAlt: '台北 UFC GYM 拳擊與泰拳課程指南',
  },
  '/guides/taichung-boxing-muay-thai-classes': {
    title: '台中拳擊、泰拳課程怎麼選？勤美旗艦館初學者指南',
    description:
      '想在台中找拳擊課、泰拳課、踢拳課或固定運動習慣？整理 UFCGYM TAIWAN 台中勤美旗艦館的課程選擇、交通位置與新手問題。',
    keywords: '台中拳擊課程, 台中泰拳課程, 台中 UFCGYM, 勤美拳擊, 台中格鬥健身',
    imagePath: PUBLIC_IMAGE_PATHS.bootCamp,
    imageAlt: '台中 UFC GYM 拳擊與泰拳課程指南',
  },
  '/guides/beginner-combat-fitness': {
    title: '拳擊、泰拳初學者可以上嗎？第一次格鬥健身指南',
    description:
      '第一次想上拳擊課或泰拳課，常會擔心跟不上、被打、動作不會做。整理 Fight Night 與 Boot Camp 的差異和選課方式。',
    keywords: '拳擊初學者, 泰拳初學者, 格鬥健身新手, Fight Night, Boot Camp',
    imagePath: PUBLIC_IMAGE_PATHS.bootCamp,
    imageAlt: 'UFC GYM 初學者格鬥健身指南',
  },
  '/guides/stress-release-after-workout': {
    title: '下班後壓力怎麼釋放？拳擊、泰拳與 Fight Night 指南',
    description:
      '如果你想找下班後能釋放壓力的運動，整理 Fight Night、拳擊、泰拳和 Boot Camp 如何用節奏、沙包聲與課程安排帶你進入狀態。',
    keywords: '下班後運動, 壓力釋放, Fight Night, 拳擊課程, 泰拳課程, Boot Camp',
    imagePath: PUBLIC_IMAGE_PATHS.event,
    imageAlt: 'UFC GYM 下班後壓力釋放與 Fight Night 指南',
  },
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

function absoluteUrl(origin, path) {
  return new URL(path, origin).toString()
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

function applyRouteMeta(response, meta) {
  return new HTMLRewriter()
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
  const response = await context.next()

  if (!shouldInspectHtml(context.request, url.pathname)) return response

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const meta = getMetaForPath(url.pathname, url.origin)
  if (!meta) return response

  return applyRouteMeta(response, meta)
}
