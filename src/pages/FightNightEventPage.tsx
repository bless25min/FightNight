import { motion } from 'framer-motion'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import eventGroupEnergy from '../assets/landing/collective-euphoria-card.jpg'
import eventBagImpact from '../assets/landing/flow-step-4.jpg'
import eventAfterglow from '../assets/landing/flow-step-5.jpg'
import eventHeroEmotion from '../assets/landing/hero-poster.jpg'
import courseBasicBoxing from '../assets/event/course-basic-boxing.jpg'
import courseBasicMuaythai from '../assets/event/course-basic-muaythai.jpg'
import courseBoxingConditioning from '../assets/event/course-boxing-conditioning.jpg'
import courseFightFit from '../assets/event/course-fight-fit.jpg'
import courseMuaythaiKickboxingConditioning from '../assets/event/course-muaythai-kickboxing-conditioning.jpg'
import ufcBoxingGloves from '../assets/products/ufc-boxing-gloves.webp'
import ufcHandWraps from '../assets/products/ufc-hand-wraps.webp'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { Seo } from '../components/Seo'
import { FAQSection } from '../components/sections/FAQSection'
import { Button } from '../components/ui/Button'
import { SectionWrapper } from '../components/ui/SectionWrapper'
import {
  findCoachProfile,
  getCoachDisplayName,
  type CoachProfile,
} from '../data/coachProfiles'
import {
  ONLINE_BOOKING_START_OFFSET_DAYS,
  getWeeklyCourseForCategory,
  isWeeklyCourseAvailableForCategory,
  weeklyCourses,
} from '../data/weeklySchedule'
import { useLiffGate } from '../hooks/useLiffGate'
import { useLocale } from '../hooks/useLocale'
import {
  type SessionAvailability,
  useSessionAvailability,
} from '../hooks/useSessionAvailability'
import { useTracking } from '../hooks/useTracking'
import { getSavedBuyerContact, saveBuyerContact } from '../lib/buyerContact'
import {
  createMetaEventId,
  getCheckoutTrackingContext,
} from '../lib/checkoutTracking'
import {
  formatCoursePrice,
  getCoursePriceModel,
  getTaipeiTodayIso,
} from '../lib/coursePricing'
import { getLineRequestContext } from '../lib/lineContext'
import type { SupportedLocale } from '../lib/locale'
import type { FAQItem, WeeklyCourse } from '../types'

type BuyerContactForm = {
  name: string
  phone: string
  email: string
}

type EventTicket = {
  id: string
  course: WeeklyCourse
  sessionId: string
  title: string
  dateLabel: string
  timeLabel: string
  venueLabel: string
}

type EventTicketPrice = {
  amount: number
  label: string
  originalAmount: number
  originalLabel: string
  compareAtAmount?: number
  compareAtLabel?: string
  offerApplied: boolean
  pricingTier: 'foreign-fighter' | 'domestic-teacher'
}

type EventCoursePhoto = {
  src: string
  altZh: string
  altEn: string
}

type EventPassVariantId =
  | 'fight-night-pass'
  | 'fight-night-gear-pass'
  | 'single-class-paid'

type EventPassHighlight = {
  title: string
  body: string
  productId?: EventProductId
}

type EventProductId = 'hand-wraps' | 'boxing-gloves'

type EventPassVariant = {
  id: EventPassVariantId
  title: string
  ctaName: string
  priceDelta: number
  fixedAmount?: number
  equipmentPackage: 'wraps' | 'gloves-and-wraps' | 'self-or-rental'
  includesGloves: boolean
  includesWraps: boolean
  showPreferences: boolean
  highlights: EventPassHighlight[]
}

type FreeTrialStatusState =
  | 'unknown'
  | 'checking'
  | 'available'
  | 'used'
  | 'unavailable'

type FreeTrialStatusSnapshot = {
  lineUserId: string
  status: Exclude<FreeTrialStatusState, 'unknown' | 'checking'>
}

type Coordinates = {
  latitude: number
  longitude: number
}

type VenueRecommendation = {
  venueId: string
  distanceKm?: number
  source: 'cloudflare' | 'browser'
}

type LocationRecommendationResponse = {
  recommendation?: {
    venueId?: string
    distanceKm?: number
    source?: string
  } | null
}

type EventServicePreferences = {
  handWrapAssist: boolean
  quietMode: boolean
}

type EventCoachProfileDetailTone = 'pearl' | 'neon' | 'blaze'

const landingVariant = 'fightnight_event_night_ticket_paid_v3'
const eventName = 'Fight Night'
const eventMoreSessionsHash = '#event-more-sessions'
const eventCheckoutTicketParam = 'event_checkout_ticket'
const eventCheckoutVariantParam = 'event_checkout_variant'
const eventCoursePricingMode = 'weekly-course-no-first-purchase'
const eventCoursePhotos = {
  basicBoxing: {
    src: courseBasicBoxing,
    altZh: '基礎拳擊課程照片',
    altEn: 'Basic Boxing course photo',
  },
  basicMuaythai: {
    src: courseBasicMuaythai,
    altZh: '基礎泰拳課程照片',
    altEn: 'Basic Muay Thai course photo',
  },
  boxingConditioning: {
    src: courseBoxingConditioning,
    altZh: '拳擊體適能課程照片',
    altEn: 'Boxing Conditioning course photo',
  },
  fightFit: {
    src: courseFightFit,
    altZh: '戰鬥體適能課程照片',
    altEn: 'Fight Fit course photo',
  },
  muaythaiKickboxingConditioning: {
    src: courseMuaythaiKickboxingConditioning,
    altZh: '泰拳與踢拳體適能課程照片',
    altEn: 'Muay Thai and Kickboxing Conditioning course photo',
  },
} satisfies Record<string, EventCoursePhoto>

const eventPageCopy = {
  'zh-TW': {
    eventDescription:
      'Fight Night 是一張 Fight Night Pass。走進 UFC GYM，戴上拳套，把 50 分鐘交給倒數、沙包聲和全場。',
    venueLabels: {
      'venue-dunnan': '敦南旗艦館',
      'venue-neihu': '內湖旗艦館',
      'venue-taichung': '台中旗艦館',
    },
    nearbyAreaLabels: {
      'venue-dunnan': '捷運忠孝敦化站',
      'venue-neihu': '捷運港墘站',
      'venue-taichung': '勤美誠品',
    },
    products: {
      'hand-wraps': {
        title: '全新 UFC GYM 手綁帶',
        body: '結束後可以帶回家。',
        alt: '全新 UFC GYM 手綁帶',
      },
      'boxing-gloves': {
        title: '全新 UFC GYM 拳擊手套',
        body: '結束後可以帶回家。',
        alt: '全新 UFC GYM 拳擊手套',
      },
    },
    passHighlights: {
      entry: {
        title: '入場通行',
        body: '全設施使用。',
      },
      locker: {
        title: '感應式私人置物櫃',
        body: '飯店級盥洗用品。',
      },
      starterKit: {
        title: '新手包',
        body: '上課使用的拳套、手綁帶會先為你準備好。',
      },
      standardFlow: {
        title: '一般體驗流程',
        body: '裝備可自備，或現場租用。',
      },
    },
    passVariants: {
      'fight-night-pass': {
        title: 'Fight Night Pass',
        ctaName: 'Fight Night Pass',
      },
      'fight-night-gear-pass': {
        title: 'Fight Night Gear Pass',
        ctaName: 'Fight Night Gear Pass',
      },
      'single-class-paid': {
        title: '一般單堂體驗',
        ctaName: '這堂體驗',
      },
    },
    preferences: {
      heading: '入場偏好',
      selected: '已選',
      optional: '可選',
      handWrapAssist: {
        title: '課前準備',
        body: '專人協助教學及纏手綁帶',
      },
      quietMode: {
        title: '安靜模式',
        body: '現場不主動介紹入會方案。',
      },
    },
    faq: {
      title: '第一次來，先看這幾個。',
      items: [
        {
          id: 'event-first-time',
          question: '我完全沒打過可以嗎？',
          answer: '可以。前面會從能跟上的節奏開始，不需要先練好。',
        },
        {
          id: 'event-no-fight',
          question: '會對打嗎？',
          answer: '不會。主要是拳套、沙包、口令和回合。',
        },
        {
          id: 'event-what-to-wear',
          question: '要穿什麼？需要帶什麼？',
          answer:
            '穿一般好活動的運動服就可以。到場會帶你進流程，需要準備的細節會在 LINE 入場確認裡提醒。',
        },
        {
          id: 'event-cancel-change',
          question: '取消、變更預訂',
          answer:
            '若付款後尚未使用，可依退款與取消政策提出申請；課程開始前 24 小時以上可協助改期，未滿 24 小時取消會依現場名額與實際安排處理。',
          linkHref: '/refund-policy',
          linkLabel: '查看退款與取消政策',
        },
      ],
    },
    weekdays: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'],
    remaining: {
      featured: '精選課程',
      waitlist: '候補中',
      lastSeats: (remaining: number) => `最後名額剩下${remaining}位`,
    },
    hero: {
      imageAlt: 'Fight Night 拳套入場主視覺',
      eyebrow: 'FIGHT NIGHT',
      title: '下班後，進入另一種夜晚。',
      body:
        '你推門進 UFC GYM 的時候，白天還黏在身上。場地是紅的、黑的，音樂很近，有人已經戴好拳套在笑。第一聲倒數落下來，你會知道：這不是來上一堂課，是今晚真的要開始了。',
      cta: '看這一晚有多好玩',
    },
    reframe: {
      title: '自然而然，跟上現場氛圍。',
      body:
        '不用先懂拳擊，教練會把節奏拆到你跟得上，旁邊的人開始出聲，沙包一下一下響起來。',
      after:
        '你原本還有點保留，幾分鐘後，手會自己抬起來，嘴角也會自己上揚。',
    },
    proof: {
      title: '低沉悶響，將日常與當下切開。',
      body1: '拳套碰到沙包的那一下很近，低低的一聲，會把注意力拉回身體。',
      body2:
        '倒數越來越短，教練的口令、旁邊的呼吸、自己的心跳疊在一起；時間會變慢，感官會變清晰，壓力會留在黑底紅字的沙包上，彷彿自己正在蛻變得不一樣。',
    },
    safety: {
      title: '第一次來，也可以很單純。',
      items: [
        {
          title: '不用入會',
          body: '這張 Pass 只買這一晚。',
        },
        {
          title: '不用被推銷',
          body: '線上付款，LINE 留票，到場進場。',
        },
        {
          title: '新手也能玩得進去',
          body: '從跟得上的節奏開始，不用先練好。',
        },
      ],
    },
    flowPreview: {
      title: '愉快的餘韻會留在場上。',
      paragraphs: [
        '手還熱，沙包還在晃，旁邊的人也在喘，也在笑。',
        '聽著教練預告下回內容，用眼神約好下次一起上課。',
        '不自覺的，漸漸融入這個能量飽滿的社群。',
        '覺得有點想試，就把這一晚留下來吧。',
      ],
      cta: '把這一晚留下來',
    },
    passPreview: {
      eyebrow: 'FIGHT NIGHT PASS',
      title: '選一個晚上，\n走進那個會讓人亮起來的現場。',
      body:
        '到了那天，你不用先想自己會不會。裝備、置物櫃和入場確認都會先準備好；你只要出現，戴上拳套，跟著第一聲倒數開始。',
      items: ['入場通行', '裝備備妥', '可選安靜模式', 'LINE 確認'],
    },
    tickets: {
      sectionEyebrow: 'Fight Night Pass',
      sectionTitle: '可選場次',
      sectionSummary: (venue: string, count: number) =>
        `${venue} 目前 ${count} 場可選。`,
      venueTabsLabel: '選擇場館',
      venueSelectPrompt: '先選你會抵達的場館，再看該場館可保留的方案。',
      cardsLabel: (venue: string) => `${venue} Fight Night Pass 可選場次`,
      noVenueSessions: '這個場館目前沒有可報名場次。',
      noSessions: '下一場整理中，開放後會更新在這裡。',
      currentVenue: '目前場館',
      showAll: '查看所有場次',
      lineLoginShowAll: '查看所有場次',
      coachSuffix: '教練',
      view: '查看',
      soldOut: '本場候補中',
      freeTrialFirstTimeBadge: '首次限定',
      freeTrialUsedBadge: '一般體驗',
      freeTrialTitle: '本週限量免費體驗課',
      paidFallbackTitle: '一般單堂體驗',
      usedFirstTime: '已使用首次限定',
      freeTrialLimit: '每個 LINE 帳號限保留一次。',
      usedFallback: '這堂可用一般單堂價保留。',
      paidFallbackCta: 'NT$680｜保留這堂',
      checking: '確認資格中',
      unavailable: '暫時無法確認資格',
      freeTrialCta: '首次限定｜免費保留這堂',
      photo: '查看照片',
    },
    modal: {
      close: '關閉',
      coachInfo: '教練與課程資訊',
      coachInfoClose: '關閉教練與課程資訊',
      coachFallbackRole: 'Fight Night 教練',
      whyThisCoach: '為什麼值得跟他上這堂',
      certifications: '資格證明',
      experience: '教學 / 經歷',
      achievements: '比賽成就',
      courseInfo: '課程資訊',
      courseInfoBody: '這堂會由教練帶你跟上現場節奏，從能進入的動作開始。',
      time: '時間',
      venue: '場館',
      status: '狀態',
      backToSessions: '回到場次選擇',
      checkoutEyebrow: 'Fight Night Pass',
      checkoutTitle: '保留這一晚',
      comparePrefix: '一般',
      checkoutNote:
        '付款後，LINE 會留下這一晚的時間、地點和入場確認。到了那天，直接走進 UFC GYM。',
      normalEntryAssist: '現場依一般入場協助',
      name: '姓名',
      phone: '手機',
      namePlaceholder: '王小明',
      checkoutSubmit: '前往付款，保留這一晚',
      checkoutSubmitting: '正在建立付款連結...',
      checkoutSaved:
        '送出後會儲存這次填寫的資料，下次購買或預約會自動帶入。',
      checkoutLoginRequired: '請先完成 LINE 登入，付款後才能收到入場確認卡。',
      checkoutError: '目前無法建立付款連結，請稍後再試。',
      freeTrialEyebrow: '首次限定｜本週限量免費體驗課',
      freeTrialTitle: '免費保留這堂',
      freeTrialNote: '每個 LINE 帳號限保留一次。裝備可自備，或現場租用。',
      freeTrialLoginRequired: '請先完成 LINE 登入後，再保留免費體驗。',
      freeTrialError: '免費預約建立失敗，請稍後再試。',
      freeTrialSubmitting: '正在保留...',
    },
    footer: {
      privacy: '隱私政策',
      refund: '退款與取消政策',
    },
    sticky: {
      detailOpen: '選擇方案｜線上付款｜LINE 確認',
      detailClosed: 'Fight Night Pass',
    },
    seo: {
      title: 'Fight Night｜Fight Night Pass',
      keywords: ['Fight Night', 'Fight Night Pass', 'UFC GYM', '運動娛樂', '夜間運動', '沙包聲'],
    },
    photoAlts: {
      group: 'Fight Night 小團體被現場節奏帶起來',
      impact: '全力專注並釋放情緒的沙包段落',
      afterglow: 'Fight Night 結束後笑出來的放鬆感',
    },
  },
  en: {
    eventDescription:
      'Fight Night is a pass into a different kind of night at UFC GYM: gloves on, countdowns close, bag sounds loud, and the whole room moving with you.',
    venueLabels: {
      'venue-dunnan': 'Dunnan Flagship',
      'venue-neihu': 'Neihu Flagship',
      'venue-taichung': 'Taichung Flagship',
    },
    nearbyAreaLabels: {
      'venue-dunnan': 'Zhongxiao Dunhua MRT',
      'venue-neihu': 'Gangqian MRT',
      'venue-taichung': 'CMP Park Lane',
    },
    products: {
      'hand-wraps': {
        title: 'New UFC GYM hand wraps',
        body: 'Yours to take home after the session.',
        alt: 'New UFC GYM hand wraps',
      },
      'boxing-gloves': {
        title: 'New UFC GYM boxing gloves',
        body: 'Yours to take home after the session.',
        alt: 'New UFC GYM boxing gloves',
      },
    },
    passHighlights: {
      entry: {
        title: 'Entry pass',
        body: 'Full facility access.',
      },
      locker: {
        title: 'Private smart locker',
        body: 'Hotel-grade amenities included.',
      },
      starterKit: {
        title: 'Starter kit',
        body: 'Session gloves and wraps are prepared for you in advance.',
      },
      standardFlow: {
        title: 'Standard trial flow',
        body: 'Bring your own gear or rent gear on site.',
      },
    },
    passVariants: {
      'fight-night-pass': {
        title: 'Fight Night Pass',
        ctaName: 'Fight Night Pass',
      },
      'fight-night-gear-pass': {
        title: 'Fight Night Gear Pass',
        ctaName: 'Fight Night Gear Pass',
      },
      'single-class-paid': {
        title: 'Single Session',
        ctaName: 'this session',
      },
    },
    preferences: {
      heading: 'Entry preferences',
      selected: 'Selected',
      optional: 'Optional',
      handWrapAssist: {
        title: 'Pre-session setup',
        body: 'Staff help with basics and hand wrapping.',
      },
      quietMode: {
        title: 'Quiet mode',
        body: 'Reception will not introduce membership plans first.',
      },
    },
    faq: {
      title: 'First time here? Start with these.',
      items: [
        {
          id: 'event-first-time',
          question: 'Can I join if I have never boxed before?',
          answer:
            'Yes. The session starts from a rhythm you can follow. You do not need to train first.',
        },
        {
          id: 'event-no-fight',
          question: 'Will there be sparring?',
          answer:
            'No. This is built around gloves, bags, coaching cues, and rounds.',
        },
        {
          id: 'event-what-to-wear',
          question: 'What should I wear or bring?',
          answer:
            'Wear regular sportswear that is easy to move in. The arrival details will be sent through LINE after confirmation.',
        },
        {
          id: 'event-cancel-change',
          question: 'Cancellation or changes',
          answer:
            'Unused paid bookings can be handled under the refund and cancellation policy. We can help reschedule more than 24 hours before the session; cancellations within 24 hours depend on capacity and on-site arrangements.',
          linkHref: '/refund-policy',
          linkLabel: 'View refund and cancellation policy',
        },
      ],
    },
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    remaining: {
      featured: 'Featured',
      waitlist: 'Waitlist',
      lastSeats: (remaining: number) => `Last ${remaining} spots`,
    },
    hero: {
      imageAlt: 'Fight Night entry visual with boxing gloves',
      eyebrow: 'FIGHT NIGHT',
      title: 'After work, enter a different night.',
      body:
        'When you walk into UFC GYM, the day is still on you. The room is red and black, the music is close, and someone is already laughing with gloves on. When the first countdown drops, it does not feel like you came for a class. It feels like the night has started.',
      cta: 'See what this night feels like',
    },
    reframe: {
      title: 'Naturally, you start to follow the room.',
      body:
        'You do not need to understand boxing first. The coach breaks the rhythm down, people around you start making sound, and the bags begin to answer back.',
      after:
        'You may come in a little guarded. A few minutes later, your shoulders loosen and your smile comes out before you plan it.',
    },
    proof: {
      title: 'The first heavy sound cuts the day away.',
      body1:
        'The glove hitting the bag is close. Low, heavy, and direct enough to pull your attention back into your body.',
      body2:
        'As the countdown gets shorter, the coach, the room, your breath, and your heartbeat start to stack together. Time slows down. The day stays on the black-and-red bag, and you start feeling slightly different.',
    },
    safety: {
      title: 'First time can still be simple.',
      items: [
        {
          title: 'No membership required',
          body: 'This Pass is only for this night.',
        },
        {
          title: 'No sales pressure',
          body: 'Pay online, keep the pass in LINE, and walk in on the day.',
        },
        {
          title: 'Beginner-friendly',
          body: 'The session starts from a rhythm you can follow.',
        },
      ],
    },
    flowPreview: {
      title: 'The afterglow stays in the room.',
      paragraphs: [
        'Your hands are still warm. The bags are still moving. People around you are breathing hard and laughing.',
        'The coach previews what comes next, and people start looking at each other like they might come back together.',
        'Slowly, you begin to feel part of a room with a lot of energy.',
        'If it starts to sound like something you want to try, keep this night for yourself.',
      ],
      cta: 'Keep this night',
    },
    passPreview: {
      eyebrow: 'FIGHT NIGHT PASS',
      title: 'Choose a night.\nStep into the room that brings people alive.',
      body:
        'On the day, you do not need to wonder if you are ready. Gear, locker, and entry confirmation are prepared first. You show up, put the gloves on, and follow the first countdown.',
      items: ['Entry pass', 'Gear prepared', 'Quiet mode optional', 'LINE confirmation'],
    },
    tickets: {
      sectionEyebrow: 'Fight Night Pass',
      sectionTitle: 'Available sessions',
      sectionSummary: (venue: string, count: number) =>
        `${venue} has ${count} available session${count === 1 ? '' : 's'}.`,
      venueTabsLabel: 'Choose venue',
      venueSelectPrompt: 'Choose the venue you can reach, then pick a pass for that location.',
      cardsLabel: (venue: string) => `${venue} Fight Night Pass sessions`,
      noVenueSessions: 'This venue has no available sessions right now.',
      noSessions: 'The next session is being arranged and will appear here once open.',
      currentVenue: 'Current venue',
      showAll: 'View all sessions',
      lineLoginShowAll: 'View all sessions',
      coachSuffix: 'Coach',
      view: 'View',
      soldOut: 'Waitlist',
      freeTrialFirstTimeBadge: 'First-time only',
      freeTrialUsedBadge: 'Standard trial',
      freeTrialTitle: 'Limited free trial this week',
      paidFallbackTitle: 'Single Session',
      usedFirstTime: 'First-time offer used',
      freeTrialLimit: 'One free trial per LINE account.',
      usedFallback: 'You can reserve this session at the standard single-session price.',
      paidFallbackCta: 'NT$680 | Reserve this session',
      checking: 'Checking eligibility',
      unavailable: 'Eligibility unavailable',
      freeTrialCta: 'First-time only | Reserve free',
      photo: 'View photo',
    },
    modal: {
      close: 'Close',
      coachInfo: 'Coach and session info',
      coachInfoClose: 'Close coach and session info',
      coachFallbackRole: 'Fight Night Coach',
      whyThisCoach: 'Why train with this coach',
      certifications: 'Certifications',
      experience: 'Teaching / Experience',
      achievements: 'Competition achievements',
      courseInfo: 'Session info',
      courseInfoBody:
        'The coach leads you into the room rhythm and starts from movement you can enter.',
      time: 'Time',
      venue: 'Venue',
      status: 'Status',
      backToSessions: 'Back to session selection',
      checkoutEyebrow: 'Fight Night Pass',
      checkoutTitle: 'Reserve this night',
      comparePrefix: 'Regular',
      checkoutNote:
        'After payment, your time, location, and entry confirmation stay in LINE. On the day, walk straight into UFC GYM.',
      normalEntryAssist: 'Standard arrival support on site',
      name: 'Name',
      phone: 'Mobile',
      namePlaceholder: 'Your name',
      checkoutSubmit: 'Pay and keep this night',
      checkoutSubmitting: 'Creating payment link...',
      checkoutSaved:
        'Your details will be saved for your next purchase or reservation.',
      checkoutLoginRequired:
        'Please complete LINE login first so the entry confirmation can be sent after payment.',
      checkoutError: 'Unable to create the payment link. Please try again later.',
      freeTrialEyebrow: 'First-time only | Limited free trial this week',
      freeTrialTitle: 'Reserve free',
      freeTrialNote:
        'One free trial per LINE account. Bring your own gear or rent gear on site.',
      freeTrialLoginRequired:
        'Please complete LINE login first before reserving the free trial.',
      freeTrialError: 'Unable to create the free reservation. Please try again later.',
      freeTrialSubmitting: 'Reserving...',
    },
    footer: {
      privacy: 'Privacy Policy',
      refund: 'Refund and Cancellation Policy',
    },
    sticky: {
      detailOpen: 'Choose pass | Pay online | Confirm in LINE',
      detailClosed: 'Fight Night Pass',
    },
    seo: {
      title: 'Fight Night | Fight Night Pass',
      keywords: ['Fight Night', 'Fight Night Pass', 'UFC GYM', 'sports entertainment', 'night workout', 'heavy bag'],
    },
    photoAlts: {
      group: 'A Fight Night group getting pulled into the room energy',
      impact: 'A focused heavy bag moment with emotional release',
      afterglow: 'The relaxed smile after Fight Night ends',
    },
  },
} satisfies Record<SupportedLocale, Record<string, unknown>>

function getCopy(locale: SupportedLocale) {
  return eventPageCopy[locale] as typeof eventPageCopy['zh-TW']
}

const venueLabelMap: Record<string, string> = {
  'venue-dunnan': '敦南旗艦館',
  'venue-neihu': '內湖旗艦館',
  'venue-taichung': '台中旗艦館',
}

const venueNearbyAreaLabelMap: Record<string, string> = {
  'venue-dunnan': '捷運忠孝敦化站',
  'venue-neihu': '捷運港墘站',
  'venue-taichung': '勤美誠品',
}

function getEventVenueTabs(locale: SupportedLocale = 'zh-TW') {
  const copy = getCopy(locale)
  const venueLabels = copy.venueLabels as Record<string, string>
  const nearbyLabels = copy.nearbyAreaLabels as Record<string, string>

  return Object.keys(venueLabelMap).map((venueId) => ({
    venueId,
    label: venueLabels[venueId] ?? venueLabelMap[venueId],
    nearbyAreaLabel:
      nearbyLabels[venueId] ?? venueNearbyAreaLabelMap[venueId],
  }))
}

const venueCoordinates: Record<string, Coordinates> = {
  'venue-dunnan': {
    latitude: 25.03931467772036,
    longitude: 121.54767441193627,
  },
  'venue-neihu': {
    latitude: 25.079304677694402,
    longitude: 121.57099151193722,
  },
  'venue-taichung': {
    latitude: 24.151235378309035,
    longitude: 120.66126771191507,
  },
}

const eventProductDetails: Record<
  EventProductId,
  {
    title: string
    body: string
    image: string
    alt: string
  }
> = {
  'hand-wraps': {
    title: '全新 UFC GYM 手綁帶',
    body: '結束後可以帶回家。',
    image: ufcHandWraps,
    alt: '全新 UFC GYM 手綁帶',
  },
  'boxing-gloves': {
    title: '全新 UFC GYM 拳擊手套',
    body: '結束後可以帶回家。',
    image: ufcBoxingGloves,
    alt: '全新 UFC GYM 拳擊手套',
  },
}

const eventPassBaseHighlights: EventPassHighlight[] = [
  {
    title: '入場通行',
    body: '全設施使用。',
  },
  {
    title: '感應式私人置物櫃',
    body: '飯店級盥洗用品。',
  },
]

const eventPassVariants: EventPassVariant[] = [
  {
    id: 'fight-night-pass',
    title: 'Fight Night Pass',
    ctaName: 'Fight Night Pass',
    priceDelta: 0,
    equipmentPackage: 'wraps',
    includesGloves: false,
    includesWraps: true,
    showPreferences: true,
    highlights: [
      ...eventPassBaseHighlights,
      {
        title: '新手包',
        body: '上課使用的拳套、手綁帶會先為你準備好。',
      },
      {
        title: '全新 UFC GYM 手綁帶',
        body: '結束後可以帶回家。',
        productId: 'hand-wraps',
      },
    ],
  },
  {
    id: 'fight-night-gear-pass',
    title: 'Fight Night Gear Pass',
    ctaName: 'Fight Night Gear Pass',
    priceDelta: 1800,
    equipmentPackage: 'gloves-and-wraps',
    includesGloves: true,
    includesWraps: true,
    showPreferences: true,
    highlights: [
      ...eventPassBaseHighlights,
      {
        title: '全新 UFC GYM 手綁帶',
        body: '結束後可以帶回家。',
        productId: 'hand-wraps',
      },
      {
        title: '全新 UFC GYM 拳擊手套',
        body: '結束後可以帶回家。',
        productId: 'boxing-gloves',
      },
    ],
  },
]

const defaultEventPassVariant = eventPassVariants[0]

const singleClassPaidVariant: EventPassVariant = {
  id: 'single-class-paid',
  title: '一般單堂體驗',
  ctaName: '這堂體驗',
  priceDelta: 0,
  fixedAmount: 680,
  equipmentPackage: 'self-or-rental',
  includesGloves: false,
  includesWraps: false,
  showPreferences: false,
  highlights: [
    {
      title: '一般體驗流程',
      body: '裝備可自備，或現場租用。',
    },
  ],
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekdayLabel(iso: string, locale: SupportedLocale = 'zh-TW') {
  const date = new Date(`${iso}T00:00:00`)
  return getCopy(locale).weekdays[date.getDay()]
}

function formatDateLabel(iso: string, locale: SupportedLocale = 'zh-TW') {
  const [, month, day] = iso.split('-')
  return `${Number(month)}/${Number(day)} ${getWeekdayLabel(iso, locale)}`
}

function getDynamicCourseId(baseCourse: WeeklyCourse, date: string) {
  return date === baseCourse.date ? baseCourse.id : `${baseCourse.id}-${date}`
}

function getNextBookableOccurrence(
  baseCourse: WeeklyCourse,
  minDateIso: string,
  category: WeeklyCourse['category'] = 'FIGHT_NIGHT',
) {
  let date = baseCourse.date

  while (date < minDateIso) {
    date = addDays(date, 7)
  }

  const course = getWeeklyCourseForCategory(baseCourse, category)

  return {
    ...course,
    id: getDynamicCourseId(course, date),
    date,
    weekday: getWeekdayLabel(date, 'zh-TW'),
  }
}

function getVenueLabel(
  course: WeeklyCourse,
  locale: SupportedLocale = 'zh-TW',
) {
  const venueLabels = getCopy(locale).venueLabels as Record<string, string>
  return venueLabels[course.venueId] ?? course.venueName
}

function getNearbyAreaLabel(
  venueId: string,
  locale: SupportedLocale = 'zh-TW',
) {
  const nearbyLabels = getCopy(locale).nearbyAreaLabels as Record<string, string>
  return nearbyLabels[venueId]
}

function getCourseDisplayName(
  course: WeeklyCourse,
  locale: SupportedLocale = 'zh-TW',
) {
  return locale === 'en' ? course.nameEn || course.name : course.name
}

function getEventCoursePhoto(
  course: WeeklyCourse,
): EventCoursePhoto {
  const name = course.nameEn.toLowerCase()

  if (name.includes('basic boxing')) return eventCoursePhotos.basicBoxing
  if (name.includes('basic muay thai')) return eventCoursePhotos.basicMuaythai
  if (name.includes('boxing conditioning')) {
    return eventCoursePhotos.boxingConditioning
  }
  if (name.includes('muay thai conditioning') || name.includes('kickboxing')) {
    return eventCoursePhotos.muaythaiKickboxingConditioning
  }
  return eventCoursePhotos.fightFit
}

function EventCoursePhotoPreview({
  photo,
  locale,
}: {
  photo: EventCoursePhoto
  locale: SupportedLocale
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-pearl/10 bg-black/28 shadow-[0_16px_38px_rgba(0,0,0,0.28)]">
      <img
        src={photo.src}
        alt={locale === 'en' ? photo.altEn : photo.altZh}
        draggable={false}
        loading="lazy"
        className="h-[clamp(8.5rem,24svh,12rem)] w-full object-cover sm:h-[clamp(6.75rem,18svh,9rem)]"
      />
    </div>
  )
}

function sortEventTicketsByVenuePriority(
  tickets: EventTicket[],
  recommendation: VenueRecommendation | null,
  getAvailability: (sessionId: string) => SessionAvailability,
  hasLiveData: boolean,
) {
  const recommendedVenueId = recommendation?.venueId
  const purchasableTickets = hasLiveData
    ? tickets.filter((ticket) => getAvailability(ticket.sessionId).remaining > 0)
    : tickets
  const sourceTickets = purchasableTickets.length > 0 ? purchasableTickets : tickets

  return [...sourceTickets].sort((a, b) => {
    const aVenuePriority =
      recommendedVenueId && a.course.venueId === recommendedVenueId ? 0 : 1
    const bVenuePriority =
      recommendedVenueId && b.course.venueId === recommendedVenueId ? 0 : 1

    if (aVenuePriority !== bVenuePriority) {
      return aVenuePriority - bVenuePriority
    }

    const aAvailabilityPriority =
      !hasLiveData || getAvailability(a.sessionId).remaining > 0 ? 0 : 1
    const bAvailabilityPriority =
      !hasLiveData || getAvailability(b.sessionId).remaining > 0 ? 0 : 1

    if (aAvailabilityPriority !== bAvailabilityPriority) {
      return aAvailabilityPriority - bAvailabilityPriority
    }

    if (a.course.date !== b.course.date) {
      return a.course.date < b.course.date ? -1 : 1
    }
    if (a.course.startTime !== b.course.startTime) {
      return a.course.startTime < b.course.startTime ? -1 : 1
    }
    return a.course.venueId < b.course.venueId ? -1 : 1
  })
}

function getCoachPricingTier(course: WeeklyCourse) {
  return findCoachProfile(course.coach)?.pricingTier ?? 'domestic-teacher'
}

function hasCoachProfile(course: WeeklyCourse) {
  return Boolean(findCoachProfile(course.coach))
}

function isDomesticTeacherCourse(course: WeeklyCourse) {
  return findCoachProfile(course.coach)?.pricingTier === 'domestic-teacher'
}

function isBasicPaidCourse(course: WeeklyCourse) {
  return course.name.includes('基礎拳擊') || course.name.includes('基礎泰拳')
}

function getEventTicketFromCourse(
  course: WeeklyCourse,
  locale: SupportedLocale = 'zh-TW',
): EventTicket {
  return {
    id: course.id,
    course,
    sessionId: course.id,
    title: eventName,
    dateLabel: formatDateLabel(course.date, locale),
    timeLabel: `${course.startTime}-${course.endTime}`,
    venueLabel: getVenueLabel(course, locale),
  }
}

function getPaidEventTickets(locale: SupportedLocale = 'zh-TW', limit = 72): EventTicket[] {
  const bookableFromIso = addDays(
    getTaipeiTodayIso(),
    ONLINE_BOOKING_START_OFFSET_DAYS,
  )

  return weeklyCourses
    .filter(
      (course) =>
        hasCoachProfile(course) &&
        (isWeeklyCourseAvailableForCategory(course, 'FIGHT_NIGHT') ||
          isBasicPaidCourse(course)),
    )
    .map((course) =>
      getNextBookableOccurrence(
        course,
        bookableFromIso,
        isBasicPaidCourse(course) ? 'BOOT_CAMP' : 'FIGHT_NIGHT',
      ),
    )
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1
      if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1
      return a.venueId < b.venueId ? -1 : 1
    })
    .slice(0, limit)
    .map((course) => getEventTicketFromCourse(course, locale))
}

function getWeeklyFreeTrialTickets(
  locale: SupportedLocale = 'zh-TW',
  limit = 4,
): EventTicket[] {
  const bookableFromIso = addDays(
    getTaipeiTodayIso(),
    ONLINE_BOOKING_START_OFFSET_DAYS,
  )

  return weeklyCourses
    .filter(
      (course) =>
        hasCoachProfile(course) &&
        isDomesticTeacherCourse(course) &&
        isWeeklyCourseAvailableForCategory(course, 'FIGHT_NIGHT'),
    )
    .map((course) => getNextBookableOccurrence(course, bookableFromIso))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1
      if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1
      return a.venueId < b.venueId ? -1 : 1
    })
    .slice(0, limit)
    .map((course) => getEventTicketFromCourse(course, locale))
}

function getRemainingLabel(
  availability: SessionAvailability,
  hasLiveData: boolean,
  locale: SupportedLocale = 'zh-TW',
) {
  const copy = getCopy(locale).remaining
  if (!hasLiveData) {
    return copy.featured
  }
  if (availability.remaining <= 0) return copy.waitlist
  if (availability.remaining <= 3) {
    return copy.lastSeats(availability.remaining)
  }
  return copy.featured
}

type EventCoachEnglishProfile = {
  name: string
  role: string
  tags: string[]
  paragraphs: string[]
  trustPoints: string[]
  certifications?: string[]
  experience?: string[]
  achievements?: string[]
}

const eventCoachEnglishProfiles: Record<string, EventCoachEnglishProfile> = {
  andre: {
    name: 'Andre',
    role: 'Muay Thai / MMA Coach',
    tags: ['Muay Thai / MMA', 'Swiss / European Muay Thai Champion', 'Brazilian Coach', 'Fight Background'],
    paragraphs: [
      'Andre brings a Brazilian fight background into the room, with Muay Thai, MMA, and striking experience built through years of competition and coaching.',
      'In Fight Night, his cues help you enter the rhythm fast: simple enough to follow, strong enough to make the room feel alive.',
    ],
    trustPoints: [
      'Swiss and European Muay Thai champion background',
      'Brazilian striking and MMA coaching experience',
      'High-energy cueing for first-time and experienced students',
    ],
    achievements: [
      'European Champion of Muay Thai',
      'Champion - Cearense of Muay Thai',
      'Champion - Shooto Brazil 7',
    ],
  },
  bruno: {
    name: 'Bruno',
    role: 'Muay Thai / MMA Coach',
    tags: ['Muay Thai / MMA', 'Pro Muay Thai Fighter', 'BJJ Black Belt', 'Fight Background'],
    paragraphs: [
      'Bruno is a Brazilian coach with professional Muay Thai and MMA experience, plus a Brazilian Jiu-Jitsu black belt background.',
      'His Fight Night sessions feel direct and physical, but still easy to enter because the rhythm is broken down before the room gets intense.',
    ],
    trustPoints: [
      'Professional Muay Thai record: 14 wins',
      'Professional MMA record: 4 wins',
      'Brazilian Jiu-Jitsu black belt',
    ],
    achievements: [
      'Copa de Bangkok Muay Thai Champion',
      'WOTD MMA competitor',
      'TJJF Brazilian Jiu-Jitsu medalist',
    ],
  },
  got: {
    name: 'Got',
    role: 'Muay Thai / Kickboxing Coach',
    tags: ['Muay Thai / Kickboxing', 'Kru Muay Thai', 'Pad Holder', 'Thailand Training'],
    paragraphs: [
      'Got comes from a Muay Thai teaching background, with experience training and coaching inside Thai fight-gym environments.',
      'His class energy is sharp and rhythmic. You follow the cue, hear the bag answer back, and the room starts pulling you in.',
    ],
    trustPoints: [
      'Kru Muay Thai Association certified teacher',
      'LKT Muay Thai Gym coaching background',
      'Yutthasart Muay Thai Gym training background',
    ],
    certifications: ['Kru Muay Thai Association - Certificate of Teacher'],
    experience: [
      'LKT Muay Thai Gym coach',
      'Yutthasart Muay Thai Gym training background',
    ],
  },
  mario: {
    name: 'Mario',
    role: 'Brazilian Jiu-Jitsu / MMA Coach',
    tags: ['BJJ / MMA', 'Pro MMA Fighter', 'BJJ Black Belt', 'Fight Background'],
    paragraphs: [
      'Mario brings Brazilian Jiu-Jitsu, Muay Thai, and professional MMA experience into the training floor.',
      'His Fight Night style is controlled but intense: you feel guided, while the room still has the energy of a real fight team.',
    ],
    trustPoints: [
      'Professional MMA record: 28 wins',
      'Team Nova Uniao background',
      'Brazilian Jiu-Jitsu black belt',
    ],
    achievements: [
      'MMA Brazilian King Fighter Champion',
      'MMA Mr. Cage Champion',
      'Jiu-Jitsu Black Belt State Champion',
    ],
  },
  rafael: {
    name: 'Rafael',
    role: 'Brazilian Jiu-Jitsu / MMA Coach',
    tags: ['BJJ Black Belt 4th Degree', 'Pro MMA Fighter', 'Brazilian Coach', 'Fight Background'],
    paragraphs: [
      'Rafael is a Brazilian Jiu-Jitsu black belt fourth degree with MMA and striking experience.',
      'In Fight Night, that background turns into clear pacing: he keeps the room moving while making the rhythm understandable for people walking in for the first time.',
    ],
    trustPoints: [
      'Brazilian Jiu-Jitsu black belt, fourth degree',
      'Professional MMA record: 11 wins',
      'IBJJF Asian Championship 2025 gold medalist',
    ],
    achievements: [
      'IBJJF Asian Championship 2025 - gold',
      "Mariana's Pro 2025 - first place",
      'Brazilian Jiu-Jitsu national champion',
    ],
  },
  sim: {
    name: 'Sim',
    role: 'Judo / MMA Coach',
    tags: ['Judo / MMA', 'Malaysia Judo Team', 'Combat Coach', 'Competition Background'],
    paragraphs: [
      'Sim comes from a judo and combat-sports background, with national-team competition experience and coaching credentials.',
      'His coaching makes the room feel secure before it becomes intense, so beginners can follow the first rhythm without feeling lost.',
    ],
    trustPoints: [
      'Malaysia Judo Team background',
      'Combat-sports coaching credentials',
      'Multiple judo and grappling competition results',
    ],
    achievements: [
      'Southeast Asia Games - Malaysia Judo Team',
      'Malaysia National Judo Championship gold medalist',
      'ASJJF Taiwan Open gold medalist',
    ],
  },
  mengyan: {
    name: 'Mengyan',
    role: 'Boxing / Combat Conditioning Coach',
    tags: ['Boxing', 'Combat Conditioning', 'College Boxing Champion', 'Team Background'],
    paragraphs: [
      'Mengyan brings a boxing team background and years of ring-based competition into class.',
      'His Fight Night coaching keeps the movement direct: follow the count, hit the bag, and let the room build your confidence one round at a time.',
    ],
    trustPoints: [
      'Four-time college boxing champion',
      'Boxing team and coaching background',
      'Combat conditioning teaching experience',
    ],
  },
  ruru: {
    name: 'RuRu',
    role: 'Boxing / Kickboxing Coach',
    tags: ['Boxing', 'Kickboxing', 'Fitness Coaching', 'Competition Background'],
    paragraphs: [
      'RuRu combines boxing, kickboxing, and fitness coaching into a class rhythm that feels bright and easy to enter.',
      'Her sessions help first-timers stop watching from the outside and start moving with the people around them.',
    ],
    trustPoints: [
      'Boxing and kickboxing coaching credentials',
      'Fitness and conditioning teaching background',
      'Boxing competition background',
    ],
  },
  joyce: {
    name: 'Joyce',
    role: 'Boxing / Functional Training Coach',
    tags: ['Boxing', 'Functional Training', 'WBC Coach', 'Competition Background'],
    paragraphs: [
      'Joyce brings boxing, functional training, and women-focused coaching experience into the room.',
      'Her classes feel clear and encouraging: you do not need to perform first, you just need to follow the rhythm until the room opens up.',
    ],
    trustPoints: [
      'WBC boxing coach background',
      'Boxing and functional training certifications',
      'Boxing competition podium experience',
    ],
  },
  fly: {
    name: 'Fly',
    role: 'Functional Training Coach',
    tags: ['Functional Training', 'Boxing Conditioning', 'RTS', 'Mobility'],
    paragraphs: [
      'Fly brings functional training, movement coaching, and boxing-conditioning experience into class.',
      'His Fight Night sessions help the body wake up quickly, so the rhythm feels physical without becoming confusing.',
    ],
    trustPoints: [
      'RTS training background',
      'Myofascial stretch instructor',
      'Boxing and conditioning competition background',
    ],
  },
  gilo: {
    name: 'Gilo',
    role: 'Boxing / Conditioning Coach',
    tags: ['Boxing', 'Conditioning', 'CPR / AED', 'Competition Background'],
    paragraphs: [
      'Gilo combines boxing, conditioning, and practical coaching experience into a steady class flow.',
      'His rhythm makes the room feel approachable first, then gradually brings the intensity up.',
    ],
    trustPoints: [
      'CPR and AED certified',
      'Boxing coaching credentials',
      'Boxing competition background',
    ],
  },
  ren: {
    name: 'Ren',
    role: 'Kickboxing / Fitness Coach',
    tags: ['Kickboxing', 'Fitness Coaching', 'Conditioning', 'Competition Background'],
    paragraphs: [
      'Ren brings kickboxing and fitness coaching experience into a class style that is direct, upbeat, and easy to follow.',
      'In Fight Night, his cues help the room move together so you can get pulled into the energy without overthinking.',
    ],
    trustPoints: [
      'Kickboxing coaching certifications',
      'Fitness and conditioning coaching background',
      'Kickboxing competition background',
    ],
  },
  willis: {
    name: 'Willis',
    role: 'Boxing / Conditioning Coach',
    tags: ['Boxing', 'WBC Coach', 'ACE-CPT', 'Conditioning'],
    paragraphs: [
      'Willis brings boxing, conditioning, and personal-training credentials into a clean and energetic class rhythm.',
      'His Fight Night coaching makes the first round feel simple enough to start, while the room builds the energy around you.',
    ],
    trustPoints: [
      'WBC boxing coach credential',
      'ACE-CPT certified trainer',
      'Kickboxing competition background',
    ],
  },
  simon: {
    name: 'Simon',
    role: 'Muay Thai / Conditioning Coach',
    tags: ['Muay Thai', 'Kickboxing', 'Kettlebell', 'Conditioning'],
    paragraphs: [
      'Simon blends Muay Thai, kickboxing, and conditioning work into a class that feels athletic without becoming hard to enter.',
      'His coaching keeps the cues clear, so the sound, count, and movement can stack into the Fight Night atmosphere.',
    ],
    trustPoints: [
      'WBC Muay Thai coaching background',
      'Kickboxing coaching credential',
      'Kettlebell training credential',
    ],
  },
  edward: {
    name: 'Edward',
    role: 'Kickboxing / Functional Training Coach',
    tags: ['Kickboxing', 'Functional Training', 'Mobility', 'Competition Background'],
    paragraphs: [
      'Edward brings kickboxing, mobility, and functional-training coaching into a controlled class flow.',
      'His Fight Night sessions help you move from cautious to engaged without feeling thrown into something you cannot follow.',
    ],
    trustPoints: [
      'Kickboxing coaching certifications',
      'Functional training background',
      'Kickboxing competition background',
    ],
  },
  tony: {
    name: 'Tony',
    role: 'Boxing / Kickboxing Coach',
    tags: ['Boxing', 'Kickboxing', 'TRX', 'Conditioning'],
    paragraphs: [
      'Tony brings boxing, kickboxing, and conditioning coaching into a class rhythm that feels strong but grounded.',
      'In Fight Night, he helps the group enter the count together, then lets the room energy do the rest.',
    ],
    trustPoints: [
      'Boxing and kickboxing coaching background',
      'TRX and conditioning training credentials',
      'Boxing competition background',
    ],
  },
  howard: {
    name: 'Howard',
    role: 'Boxing / Combat Conditioning Coach',
    tags: ['Boxing', 'Fight Fit', 'Combat Conditioning', 'Dunnan Coach'],
    paragraphs: [
      'Howard brings boxing and Fight Fit-style conditioning into a class flow built for people who want a more physical night out.',
      'His coaching keeps the room moving together, so the energy feels shared instead of solitary.',
    ],
    trustPoints: [
      'Dunnan coaching background',
      'Fight Fit combat-conditioning coach',
      'Boxing and conditioning teaching experience',
    ],
  },
}

function getEventCoachEnglishProfile(coachProfile: CoachProfile | null) {
  return coachProfile ? eventCoachEnglishProfiles[coachProfile.id] : undefined
}

function getEventCoachDisplayLabel(
  coachProfile: CoachProfile | null,
  fallback: string,
  locale: SupportedLocale,
) {
  if (locale === 'en') {
    return getEventCoachEnglishProfile(coachProfile)?.name ?? fallback
  }
  return coachProfile?.shortName ?? fallback
}

function getEventCoachRole(
  coachProfile: CoachProfile | null,
  locale: SupportedLocale,
  fallback: string,
) {
  if (locale === 'en') {
    return getEventCoachEnglishProfile(coachProfile)?.role ?? fallback
  }
  return coachProfile?.role ?? fallback
}

function getEventCoachParagraphs(
  coachProfile: CoachProfile | null,
  coachLabel: string,
  locale: SupportedLocale,
) {
  if (locale === 'en') {
    return (
      getEventCoachEnglishProfile(coachProfile)?.paragraphs ?? [
        `${coachLabel} will lead you into this Fight Night session.`,
        'The session starts from movement you can enter, then builds through coaching cues, bag work, and the room energy around you.',
      ]
    )
  }

  if (!coachProfile) return [`${coachLabel} 教練會帶你進入這一場 Fight Night。`]
  return coachProfile.bio?.length ? coachProfile.bio.slice(0, 2) : [coachProfile.intro]
}

function getEventCoachTrustPoints(
  coachProfile: CoachProfile | null,
  locale: SupportedLocale,
) {
  if (locale === 'en') {
    return getEventCoachEnglishProfile(coachProfile)?.trustPoints ?? []
  }
  return coachProfile?.trustPoints ?? []
}

function getEventCoachDetailItems(
  coachProfile: CoachProfile | null,
  field: 'certifications' | 'experience' | 'achievements',
  locale: SupportedLocale,
) {
  if (locale === 'en') {
    return getEventCoachEnglishProfile(coachProfile)?.[field]?.slice(0, 4) ?? []
  }
  return coachProfile?.[field]?.slice(0, 4) ?? []
}

function getEventCoachProofTag(
  coachProfile: CoachProfile | null,
  locale: SupportedLocale = 'zh-TW',
) {
  const isEnglish = locale === 'en'
  if (coachProfile?.id === 'andre') return isEnglish ? 'Swiss / European Muay Thai Champion' : '瑞士與歐洲泰拳冠軍'
  if (coachProfile?.id === 'bruno') return isEnglish ? 'Pro Muay Thai 14 Wins' : '職業泰拳 14 勝'
  if (coachProfile?.id === 'got') return isEnglish ? 'Kru Muay Thai' : '泰拳教師'
  if (coachProfile?.id === 'mario') return isEnglish ? 'Pro MMA 28 Wins' : '職業 MMA 28 勝'
  if (coachProfile?.id === 'rafael') return isEnglish ? 'BJJ Black Belt 4th Degree' : '柔術黑帶 4 段'
  if (coachProfile?.id === 'sim') return isEnglish ? 'Combat Coach Credentials' : '技擊教練資格'
  if (coachProfile?.id === 'mengyan') return isEnglish ? 'College Boxing Champion' : '拳擊四連霸'

  return coachProfile?.pricingTier === 'foreign-fighter'
    ? isEnglish
      ? 'International Fight Background'
      : '國際實戰背景'
    : null
}

function getEventCoachPreviewTags(
  coachProfile: CoachProfile | null,
  locale: SupportedLocale = 'zh-TW',
) {
  if (!coachProfile) return []
  if (locale === 'en') {
    return (
      getEventCoachEnglishProfile(coachProfile)?.tags ?? [
        getEventCoachRole(coachProfile, locale, 'Fight Night Coach'),
        getEventCoachProofTag(coachProfile, locale),
      ]
    )
      .filter((tag): tag is string => Boolean(tag))
      .slice(0, 4)
  }

  const tagsByCoach: Record<string, string[]> = {
    andre: ['泰拳 / MMA', '瑞士與歐洲泰拳冠軍', '巴西教練', '國際實戰背景'],
    bruno: ['泰拳 / MMA', '職業泰拳選手', '巴柔黑帶', '國際實戰背景'],
    got: ['泰拳 / 踢拳', '職業選手靶師', '泰拳教師', '泰國訓練背景'],
    mario: ['巴西柔術 / MMA', '職業 MMA 選手', '巴柔黑帶', '國際實戰背景'],
    rafael: ['巴柔黑帶 4 段', '職業 MMA 選手', '巴西教練', '國際實戰背景'],
    sim: ['柔道 / 綜合格鬥', '柔道代表隊教練', '技擊教練資格'],
    mengyan: ['拳擊 / 戰鬥體適能', '大專盃拳擊四連霸', '拳擊隊背景'],
  }
  const fallbackTags = [
    ...coachProfile.specialties.slice(0, 3),
    getEventCoachProofTag(coachProfile, locale),
  ]

  return Array.from(new Set(tagsByCoach[coachProfile.id] ?? fallbackTags))
    .filter((tag): tag is string => Boolean(tag))
    .slice(0, 4)
}

function getEventTicketPrice(
  ticket: EventTicket,
  availability: SessionAvailability,
  variant: EventPassVariant = defaultEventPassVariant,
): EventTicketPrice {
  const pricingTier = getCoachPricingTier(ticket.course)
  const coachProfile = findCoachProfile(ticket.course.coach)
  const basePrice = getCoursePriceModel({
    course: ticket.course,
    pricingTier,
    packageSize: 1,
    remaining: availability.remaining,
    coachId: coachProfile?.id,
  })
  const amount =
    typeof variant.fixedAmount === 'number'
      ? variant.fixedAmount
      : basePrice.amount + variant.priceDelta
  const compareAtAmount =
    typeof variant.fixedAmount === 'number'
      ? undefined
      : typeof basePrice.compareAtAmount === 'number'
      ? basePrice.compareAtAmount + variant.priceDelta
      : undefined

  return {
    amount,
    label: formatCoursePrice(amount),
    originalAmount: amount,
    originalLabel: formatCoursePrice(amount),
    compareAtAmount,
    compareAtLabel:
      typeof compareAtAmount === 'number'
        ? formatCoursePrice(compareAtAmount)
        : undefined,
    offerApplied: false,
    pricingTier,
  }
}

function getEventProductDetail(
  productId: EventProductId,
  locale: SupportedLocale = 'zh-TW',
) {
  const copy = getCopy(locale).products[productId]
  const source = eventProductDetails[productId]

  return {
    ...copy,
    image: source.image,
  }
}

function getEventPassVariantTitle(
  variant: EventPassVariant,
  locale: SupportedLocale = 'zh-TW',
) {
  return getCopy(locale).passVariants[variant.id].title
}

function getLocalizedPassHighlight(
  highlight: EventPassHighlight,
  locale: SupportedLocale = 'zh-TW',
) {
  const copy = getCopy(locale)

  if (highlight.productId) {
    return {
      ...highlight,
      ...copy.products[highlight.productId],
    }
  }

  if (highlight.title === eventPassBaseHighlights[0].title) {
    return { ...highlight, ...copy.passHighlights.entry }
  }
  if (highlight.title === eventPassBaseHighlights[1].title) {
    return { ...highlight, ...copy.passHighlights.locker }
  }
  if (highlight.title === '新手包') {
    return { ...highlight, ...copy.passHighlights.starterKit }
  }
  if (highlight.title === '一般體驗流程') {
    return { ...highlight, ...copy.passHighlights.standardFlow }
  }

  return highlight
}

function getEventPassHighlights(
  variant: EventPassVariant,
  locale: SupportedLocale = 'zh-TW',
) {
  return variant.highlights.map((highlight) =>
    getLocalizedPassHighlight(highlight, locale),
  )
}

function getEventPurchaseLabel(
  price: EventTicketPrice,
  locale: SupportedLocale = 'zh-TW',
) {
  if (locale === 'en') {
    return `First-purchase offer ${price.label}`
  }

  return `首購優惠 ${price.label}`
}

function AutoFitButtonLabel({
  children,
  maxSize = 16,
  minSize = 11.5,
}: {
  children: string
  maxSize?: number
  minSize?: number
}) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null)
  const contentRef = useRef<HTMLSpanElement | null>(null)
  const [fontSize, setFontSize] = useState(maxSize)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const content = contentRef.current
    if (!wrapper || !content) return

    const fitText = () => {
      const availableWidth = wrapper.clientWidth
      if (availableWidth <= 0) return

      content.style.fontSize = `${maxSize}px`
      const naturalWidth = content.scrollWidth
      if (naturalWidth <= 0) return

      const nextSize = Math.max(
        minSize,
        Math.min(maxSize, (availableWidth / naturalWidth) * maxSize),
      )
      setFontSize(Number(nextSize.toFixed(2)))
    }

    fitText()
    const resizeObserver = new ResizeObserver(fitText)
    resizeObserver.observe(wrapper)

    return () => resizeObserver.disconnect()
  }, [children, maxSize, minSize])

  return (
    <span
      ref={wrapperRef}
      className="block min-w-0 flex-1 overflow-hidden text-center leading-none"
    >
      <span
        ref={contentRef}
        className="inline-block whitespace-nowrap font-heading font-semibold leading-tight"
        style={{ fontSize }}
      >
        {children}
      </span>
    </span>
  )
}

function getClientContext() {
  if (typeof window === 'undefined') return {}

  return {
    screenWidth: String(window.screen.width),
    screenHeight: String(window.screen.height),
    timeZoneOffset: String(new Date().getTimezoneOffset()),
    transactionWebSite: window.location.origin,
    userAgent: window.navigator.userAgent,
    language: window.navigator.language,
    colorDepth: String(window.screen.colorDepth),
  }
}

function getSourcePath() {
  if (typeof window === 'undefined') return '/fight-night-event'
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function getLiffStatePath() {
  if (typeof window === 'undefined') return ''
  const statePath = new URLSearchParams(window.location.search).get('liff.state') || ''
  return statePath.startsWith('/') ? statePath : ''
}

function getEventPassVariantById(variantId: string | null) {
  if (variantId === singleClassPaidVariant.id) return singleClassPaidVariant
  return eventPassVariants.find((variant) => variant.id === variantId) ?? null
}

function getEventCheckoutIntentFromPath(value: string) {
  if (!value || typeof window === 'undefined') return null

  try {
    const url = new URL(value, window.location.origin)
    const ticketId = url.searchParams.get(eventCheckoutTicketParam)
    const variant = getEventPassVariantById(
      url.searchParams.get(eventCheckoutVariantParam),
    )

    if (!ticketId || !variant) return null
    return { ticketId, variant }
  } catch {
    return null
  }
}

function buildEventCheckoutReturnPath(
  ticket: EventTicket,
  variant: EventPassVariant,
) {
  if (typeof window === 'undefined') return '/fight-night-event'
  const url = new URL(window.location.href)
  url.searchParams.set(eventCheckoutTicketParam, ticket.id)
  url.searchParams.set(eventCheckoutVariantParam, variant.id)
  url.hash = eventMoreSessionsHash
  return `${url.pathname}${url.search}${url.hash}`
}

function normalizeEventCheckoutIntentUrl(liffStatePath = '') {
  if (typeof window === 'undefined') return
  const targetUrl =
    liffStatePath && getEventCheckoutIntentFromPath(liffStatePath)
      ? new URL(liffStatePath, window.location.origin)
      : new URL(window.location.href)

  targetUrl.searchParams.delete(eventCheckoutTicketParam)
  targetUrl.searchParams.delete(eventCheckoutVariantParam)
  targetUrl.searchParams.delete('liff.state')
  targetUrl.searchParams.delete('liff.referrer')
  targetUrl.hash = eventMoreSessionsHash
  window.history.replaceState(
    null,
    '',
    `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`,
  )
}

function consumeEventCheckoutIntent() {
  if (typeof window === 'undefined') return null
  const liffStatePath = getLiffStatePath()
  const intent =
    getEventCheckoutIntentFromPath(getSourcePath()) ||
    getEventCheckoutIntentFromPath(liffStatePath)

  if (intent) normalizeEventCheckoutIntentUrl(liffStatePath)
  return intent
}

function scrollToMoreSessions() {
  if (typeof window === 'undefined') return
  window.setTimeout(() => {
    document
      .getElementById('event-more-sessions')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 120)
}

function EventSectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string
  title: string
  children?: string
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="font-heading text-sm font-bold text-blaze/82">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 font-heading text-[2rem] font-black leading-tight text-pearl">
        {title}
      </h2>
      {children && (
        <p className="mt-4 text-base leading-relaxed text-mist/76">
          {children}
        </p>
      )}
    </div>
  )
}

function EventStandalonePhotoSection({
  id,
  src,
  alt,
  loading = 'lazy',
}: {
  id: string
  src: string
  alt: string
  loading?: 'eager' | 'lazy'
}) {
  return (
    <SectionWrapper
      id={id}
      className="max-w-[430px] px-0 sm:px-0"
      padding="py-0"
    >
      <motion.figure
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="overflow-hidden border-y border-pearl/10 bg-black/30"
      >
        <img
          src={src}
          alt={alt}
          className="block h-auto w-full"
          loading={loading}
          decoding="async"
        />
      </motion.figure>
    </SectionWrapper>
  )
}

function EventLanguageSwitch({
  locale,
  onChange,
}: {
  locale: SupportedLocale
  onChange: (locale: SupportedLocale) => void
}) {
  const options: Array<{ locale: SupportedLocale; label: string }> = [
    { locale: 'zh-TW', label: '中文' },
    { locale: 'en', label: 'EN' },
  ]

  return (
    <div
      className="inline-flex rounded-full border border-pearl/12 bg-black/28 p-1"
      aria-label="Language"
    >
      {options.map((option) => {
        const selected = option.locale === locale

        return (
          <button
            key={option.locale}
            type="button"
            onClick={() => onChange(option.locale)}
            className={`rounded-full px-3 py-1.5 font-heading text-xs transition-colors ${
              selected
                ? 'bg-pearl text-black'
                : 'text-mist/68 hover:text-pearl'
            }`}
            aria-pressed={selected}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function EventHeroSection({
  onPrimaryAction,
  locale,
  onLocaleChange,
}: {
  onPrimaryAction: () => void
  locale: SupportedLocale
  onLocaleChange: (locale: SupportedLocale) => void
}) {
  const copy = getCopy(locale).hero

  return (
    <section
      id="event-hero"
      className="relative scroll-mt-20 overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(245,98,45,0.22),transparent_30%),linear-gradient(180deg,#090909,#050505)] pt-16 text-pearl md:scroll-mt-28 md:pt-24"
    >
      <motion.figure
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.65 }}
        className="border-b border-pearl/10 bg-black"
      >
        <img
          src={eventHeroEmotion}
          alt={copy.imageAlt}
          className="block h-auto w-full"
          loading="eager"
          decoding="async"
        />
      </motion.figure>

      <div className="relative z-10 mx-auto flex max-w-[430px] items-end px-4 pb-9 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          className="max-w-full"
        >
          <div className="mb-5 flex justify-end">
            <EventLanguageSwitch locale={locale} onChange={onLocaleChange} />
          </div>
          <p className="font-heading text-sm font-bold text-neon">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 font-heading text-[2.65rem] font-black leading-[0.98] text-pearl">
            {copy.title}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-mist/84">
            {copy.body}
          </p>

          <Button
            size="lg"
            className="mt-8 w-full"
            onClick={onPrimaryAction}
            data-cta="event-hero-primary"
          >
            {copy.cta}
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

function EventReframeSection({ locale }: { locale: SupportedLocale }) {
  const copy = getCopy(locale).reframe

  return (
    <SectionWrapper
      id="event-reframe"
      className="max-w-[430px] px-4 sm:px-4"
      padding="py-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
      >
        <EventSectionHeading
          title={copy.title}
        >
          {copy.body}
        </EventSectionHeading>
        <p className="text-base leading-relaxed text-mist/76">
          {copy.after}
        </p>
      </motion.div>
    </SectionWrapper>
  )
}

function EventProofSection({ locale }: { locale: SupportedLocale }) {
  const copy = getCopy(locale).proof

  return (
    <SectionWrapper
      id="event-proof"
      className="max-w-[430px] px-4 sm:px-4"
      padding="py-8"
    >
      <EventSectionHeading title={copy.title} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="space-y-4 border-y border-pearl/10 py-5 text-base leading-relaxed text-mist/78"
      >
        <p>
          {copy.body1}
        </p>
        <p>
          {copy.body2}
        </p>
      </motion.div>
    </SectionWrapper>
  )
}

function EventSafetySection({ locale }: { locale: SupportedLocale }) {
  const copy = getCopy(locale).safety

  return (
    <SectionWrapper
      id="event-easy-entry"
      className="max-w-[430px] px-4 sm:px-4"
      padding="py-8"
    >
      <EventSectionHeading title={copy.title} />

      <div className="grid gap-3">
        {copy.items.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.04 }}
            className="rounded-xl border border-pearl/10 bg-pearl/[0.035] px-4 py-4"
          >
            <h3 className="font-heading text-lg font-bold text-pearl">
              {item.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-mist/72">
              {item.body}
            </p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}

function EventFlowPreviewSection({ locale }: { locale: SupportedLocale }) {
  const copy = getCopy(locale).flowPreview

  return (
    <SectionWrapper
      id="event-flow-preview"
      className="max-w-[430px] px-4 sm:px-4"
      padding="py-8"
    >
      <EventSectionHeading title={copy.title} />
      {copy.paragraphs.map((paragraph, index) => (
        <p
          key={paragraph}
          className={`${index === 0 ? '' : 'mt-4 '}text-base leading-relaxed text-mist/76`}
        >
          {paragraph}
        </p>
      ))}
      <Button
        size="lg"
        className="mt-6 w-full"
        onClick={() => scrollToId('event-entry')}
        data-cta="event-afterglow-cta"
      >
        {copy.cta}
      </Button>
    </SectionWrapper>
  )
}

function EventCoachProfileDetailList({
  title,
  items,
  tone = 'pearl',
}: {
  title: string
  items?: string[]
  tone?: EventCoachProfileDetailTone
}) {
  if (!items?.length) return null

  const toneClasses: Record<
    EventCoachProfileDetailTone,
    { box: string; title: string; dot: string }
  > = {
    pearl: {
      box: 'border-pearl/10 bg-black/22',
      title: 'text-mist/55',
      dot: 'bg-mist/65',
    },
    neon: {
      box: 'border-neon/18 bg-neon/8',
      title: 'text-neon/85',
      dot: 'bg-neon',
    },
    blaze: {
      box: 'border-blaze/20 bg-blaze/10',
      title: 'text-blaze/85',
      dot: 'bg-blaze',
    },
  }
  const classes = toneClasses[tone]

  return (
    <div className={`rounded-2xl border p-4 ${classes.box}`}>
      <p
        className={`text-xs font-heading uppercase tracking-[0.2em] ${classes.title}`}
      >
        {title}
      </p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex gap-2 text-sm leading-relaxed text-mist/78"
          >
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${classes.dot}`}
            />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EventTicketInfoModal({
  selectedTicket,
  availability,
  hasLiveData,
  locale,
  onClose,
}: {
  selectedTicket: EventTicket | null
  availability: SessionAvailability | null
  hasLiveData: boolean
  locale: SupportedLocale
  onClose: () => void
}) {
  if (!selectedTicket || !availability || typeof document === 'undefined') {
    return null
  }

  const copy = getCopy(locale)
  const coachProfile = findCoachProfile(selectedTicket.course.coach)
  const coachLabel = getEventCoachDisplayLabel(
    coachProfile,
    getCoachDisplayName(selectedTicket.course.coach),
    locale,
  )
  const coachInitial = coachLabel.slice(0, 1).toUpperCase()
  const coachPreviewTags = getEventCoachPreviewTags(coachProfile, locale)
  const remainingLabel = getRemainingLabel(availability, hasLiveData, locale)
  const nearbyAreaLabel =
    getNearbyAreaLabel(selectedTicket.course.venueId, locale)
  const courseName = getCourseDisplayName(selectedTicket.course, locale)
  const courseFacts = [
    {
      label: copy.modal.time,
      value: `${selectedTicket.dateLabel}｜${selectedTicket.timeLabel}`,
    },
    {
      label: copy.modal.venue,
      value: nearbyAreaLabel
        ? `${selectedTicket.venueLabel}｜${nearbyAreaLabel}`
        : selectedTicket.venueLabel,
    },
    {
      label: copy.modal.status,
      value: remainingLabel,
    },
  ]
  const coachParagraphs = getEventCoachParagraphs(
    coachProfile,
    coachLabel,
    locale,
  )
  const coachTrustPoints = getEventCoachTrustPoints(coachProfile, locale)
  const coachCertifications = getEventCoachDetailItems(
    coachProfile,
    'certifications',
    locale,
  )
  const coachExperience = getEventCoachDetailItems(
    coachProfile,
    'experience',
    locale,
  )
  const coachAchievements = getEventCoachDetailItems(
    coachProfile,
    'achievements',
    locale,
  )
  const showCoachDetails = Boolean(
    coachProfile &&
      (coachCertifications.length || coachExperience.length || coachAchievements.length),
  )

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/78 p-0 backdrop-blur-sm md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${courseName} ${copy.modal.coachInfo}`}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[100dvh] w-full max-w-2xl overflow-y-auto rounded-none border-y border-pearl/15 bg-abyss shadow-2xl shadow-black/50 md:max-h-[92vh] md:rounded-3xl md:border"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-pearl/10 bg-abyss/95 px-4 py-3 backdrop-blur md:px-6">
          <div>
            <p className="text-[10px] font-heading uppercase tracking-[0.24em] text-neon/80">
              {copy.modal.coachInfo}
            </p>
            <p className="mt-0.5 text-xs text-mist/55">
              {selectedTicket.dateLabel} · {selectedTicket.timeLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-interaction-hint
            className="interaction-hint flex h-10 w-10 items-center justify-center rounded-full border border-pearl/15 bg-black/35 font-heading text-lg font-black text-pearl transition-colors hover:bg-black/55"
            aria-label={copy.modal.coachInfoClose}
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-5 md:p-6">
          <section className="rounded-2xl border border-pearl/10 bg-black/25 p-4">
            <div className="flex items-center gap-3">
              {coachProfile ? (
                <img
                  src={coachProfile.photo}
                  alt={coachLabel}
                  className="h-16 w-16 shrink-0 rounded-full border border-neon/30 object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-pearl/10 bg-pearl/8 font-heading text-xl font-black text-mist">
                  {coachInitial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-heading text-2xl font-black leading-none text-pearl">
                  {coachLabel}
                </p>
                <p className="mt-1 text-sm font-heading text-mist/72">
                  {getEventCoachRole(
                    coachProfile,
                    locale,
                    copy.modal.coachFallbackRole,
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {coachPreviewTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-pearl/10 bg-pearl/5 px-2 py-0.5 text-[10px] leading-snug text-mist/72"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {coachParagraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-relaxed text-mist/82"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {coachTrustPoints.length ? (
              <div className="mt-4 rounded-2xl border border-neon/16 bg-neon/8 p-4">
                <p className="text-xs font-heading uppercase tracking-[0.2em] text-neon/85">
                  {copy.modal.whyThisCoach}
                </p>
                <div className="mt-3 grid gap-2">
                  {coachTrustPoints.map((point) => (
                    <div
                      key={point}
                      className="flex gap-2 text-sm leading-relaxed text-mist/78"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {showCoachDetails && coachProfile ? (
            <div className="grid gap-3">
              <EventCoachProfileDetailList
                title={copy.modal.certifications}
                items={coachCertifications}
                tone="neon"
              />
              <EventCoachProfileDetailList
                title={copy.modal.experience}
                items={coachExperience}
              />
              <EventCoachProfileDetailList
                title={copy.modal.achievements}
                items={coachAchievements}
                tone="blaze"
              />
            </div>
          ) : null}

          <section className="rounded-2xl border border-blaze/24 bg-blaze/10 p-4">
            <p className="text-xs font-heading uppercase tracking-[0.2em] text-neon">
              {copy.modal.courseInfo}
            </p>
            <h3 className="mt-3 font-heading text-2xl font-black leading-tight text-pearl">
              {courseName}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-mist/78">
              {copy.modal.courseInfoBody}
            </p>

            <div className="mt-4 grid gap-2">
              {courseFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-xl border border-pearl/10 bg-black/24 px-3 py-2"
                >
                  <p className="text-[10px] font-heading tracking-[0.16em] text-mist/42">
                    {fact.label}
                  </p>
                  <p className="mt-0.5 text-sm font-heading font-semibold leading-snug text-pearl/88">
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={onClose}
            data-cta="event-ticket-info-close"
          >
            {copy.modal.backToSessions}
          </Button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

function EventPassHighlightRow({
  item,
  locale,
  onOpenProduct,
}: {
  item: EventPassHighlight
  locale: SupportedLocale
  onOpenProduct: (productId: EventProductId) => void
}) {
  const copy = getCopy(locale).tickets
  const body = item.productId ? '' : item.body

  return (
    <div className="flex min-w-0 items-center gap-2 overflow-hidden text-[0.72rem] leading-tight text-mist/74">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
      <span className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
        {item.productId ? (
          <button
            type="button"
            onClick={() => onOpenProduct(item.productId as EventProductId)}
            data-interaction-hint
            className="interaction-hint inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-neon/24 bg-neon/10 px-2 py-0.5 align-baseline font-heading text-pearl transition-colors hover:border-neon/48 hover:bg-neon/16 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/70"
          >
            <span className="truncate">{item.title}</span>
            <span className="shrink-0 rounded-full border border-neon/20 px-1.5 py-0.5 text-[10px] leading-none text-neon/90">
              {copy.photo}
            </span>
          </button>
        ) : (
          <strong className="shrink-0 font-heading text-pearl">
            {item.title}
          </strong>
        )}
        {body ? (
          <>
            <span className="shrink-0 text-mist/56">｜</span>
            <span className="min-w-0 truncate">{body}</span>
          </>
        ) : null}
      </span>
    </div>
  )
}

function EventProductPhotoModal({
  selectedProductId,
  locale,
  onClose,
}: {
  selectedProductId: EventProductId | null
  locale: SupportedLocale
  onClose: () => void
}) {
  if (!selectedProductId || typeof document === 'undefined') {
    return null
  }

  const product = getEventProductDetail(selectedProductId, locale)
  const copy = getCopy(locale).modal

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/82 p-0 backdrop-blur-sm md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[100dvh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl border-t border-pearl/15 bg-abyss p-4 shadow-2xl shadow-black/60 md:max-h-[92vh] md:rounded-3xl md:border"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-heading text-[10px] uppercase tracking-[0.24em] text-neon/80">
              PRODUCT
            </p>
            <h2 className="mt-2 font-heading text-2xl font-black leading-tight text-pearl">
              {product.title}
            </h2>
            <p className="mt-1 text-sm text-mist/64">{product.body}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-interaction-hint
            className="interaction-hint flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pearl/15 bg-black/35 font-heading text-lg font-black text-pearl transition-colors hover:bg-black/55"
            aria-label={copy.close}
          >
            ×
          </button>
        </div>
        <img
          src={product.image}
          alt={product.alt}
          className="mt-4 h-auto max-h-[72dvh] w-full rounded-2xl border border-pearl/10 bg-black/30 object-contain"
        />
      </motion.div>
    </motion.div>,
    document.body,
  )
}

function EventTicketCard({
  ticket,
  variant,
  availability,
  hasLiveData,
  locale,
  preferences,
  onPreferenceChange,
  onOpenInfo,
  onOpenProduct,
  onPurchase,
}: {
  ticket: EventTicket
  variant: EventPassVariant
  availability: SessionAvailability
  hasLiveData: boolean
  locale: SupportedLocale
  preferences: EventServicePreferences
  onPreferenceChange: (
    key: keyof EventServicePreferences,
    value: boolean,
  ) => void
  onOpenInfo: (ticket: EventTicket) => void
  onOpenProduct: (productId: EventProductId) => void
  onPurchase: (ticket: EventTicket, variant: EventPassVariant) => void
}) {
  const copy = getCopy(locale)
  const remainingLabel = getRemainingLabel(availability, hasLiveData, locale)
  const price = getEventTicketPrice(
    ticket,
    availability,
    variant,
  )
  const disabled = hasLiveData && availability.remaining <= 0
  const nearbyAreaLabel = getNearbyAreaLabel(ticket.course.venueId, locale)
  const coachProfile = findCoachProfile(ticket.course.coach)
  const coachLabel = getEventCoachDisplayLabel(
    coachProfile,
    getCoachDisplayName(ticket.course.coach),
    locale,
  )
  const coachInitial = coachLabel.slice(0, 1).toUpperCase()
  const coachPreviewTags = getEventCoachPreviewTags(
    coachProfile,
    locale,
  )
  const courseName = getCourseDisplayName(ticket.course, locale)
  const coursePhoto = getEventCoursePhoto(ticket.course)
  const variantTitle = getEventPassVariantTitle(variant, locale)
  const passHighlights = getEventPassHighlights(variant, locale)

  return (
    <article
      aria-label={`${variantTitle}，${ticket.dateLabel} ${ticket.timeLabel}，${ticket.venueLabel}`}
      className="relative flex h-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-pearl/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(0,0,0,0.34))] shadow-[0_18px_52px_rgba(0,0,0,0.24)]"
    >
      <div className="relative shrink-0 border-b border-pearl/10 bg-[radial-gradient(circle_at_18%_18%,rgba(245,98,45,0.18),transparent_34%),linear-gradient(135deg,rgba(0,0,0,0.94),rgba(12,12,12,0.72))] p-2.5">
        <div className="relative z-10">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
              <span className="truncate rounded-full border border-pearl/15 bg-black/20 px-2.5 py-1 font-heading text-[0.68rem] text-pearl">
                {ticket.venueLabel}
              </span>
              {nearbyAreaLabel ? (
                <span className="truncate rounded-full border border-neon/20 bg-neon/10 px-2.5 py-1 font-heading text-[0.68rem] text-neon">
                  {nearbyAreaLabel}
                </span>
              ) : null}
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-full border border-neon/25 bg-neon/10 px-2.5 py-1 text-[0.68rem] font-heading text-neon">
              {remainingLabel}
            </span>
          </div>

          <div className="mt-2 min-w-0">
            <h3 className="whitespace-nowrap font-heading text-[1.18rem] font-black leading-none text-pearl">
              {variantTitle}
            </h3>
            <p className="mt-1 whitespace-nowrap font-heading text-[0.82rem] text-mist/84">
              {ticket.dateLabel}｜{ticket.timeLabel}
            </p>

            <EventCoursePhotoPreview photo={coursePhoto} locale={locale} />

            <button
              type="button"
              onClick={() => onOpenInfo(ticket)}
              data-interaction-hint
              className="coach-avatar-trigger interaction-hint mt-2 flex w-full min-w-0 items-center gap-2 rounded-xl border border-pearl/10 bg-black/22 p-1.5 text-left transition-colors hover:border-neon/28 hover:bg-neon/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/70"
              aria-label={`${copy.tickets.view} ${coachLabel} ${copy.tickets.coachSuffix} ${courseName}`}
            >
              {coachProfile ? (
                <img
                  src={coachProfile.photo}
                  alt={coachProfile.displayName}
                  draggable={false}
                  loading="lazy"
                  className="h-9 w-9 shrink-0 rounded-full border border-neon/30 object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pearl/10 bg-pearl/8 font-heading text-base font-black text-mist">
                  {coachInitial}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.82rem] font-heading font-semibold leading-tight text-pearl">
                  {courseName}
                </span>
                <span className="mt-0.5 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
                  <span className="shrink-0 font-heading text-[0.68rem] font-semibold text-neon/85">
                    {coachLabel} {copy.tickets.coachSuffix}
                  </span>
                  {coachPreviewTags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="hidden shrink-0 whitespace-nowrap rounded-full border border-pearl/10 bg-pearl/5 px-1.5 py-0.5 text-[9px] leading-snug text-mist/72 sm:inline-flex"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-neon/20 px-2 py-1 font-heading text-[10px] text-neon/80">
                {copy.tickets.view}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-1 border-b border-pearl/10 px-3 py-2">
        {passHighlights.map((item) => (
          <EventPassHighlightRow
            key={item.title}
            item={item}
            locale={locale}
            onOpenProduct={onOpenProduct}
          />
        ))}
      </div>

      {variant.showPreferences ? (
        <div className="shrink-0 border-b border-pearl/10 px-3 py-2">
          <EventPreferenceControls
            locale={locale}
            preferences={preferences}
            onPreferenceChange={onPreferenceChange}
          />
        </div>
      ) : null}

      <div className="shrink-0 px-3 pb-3 pt-2">
        <Button
          size="lg"
          className="w-full py-3"
          disabled={disabled}
          onClick={() => onPurchase(ticket, variant)}
          data-cta="event-ticket-purchase"
          data-ticket={ticket.id}
        >
          <AutoFitButtonLabel>
            {disabled
              ? copy.tickets.soldOut
              : getEventPurchaseLabel(price, locale)}
          </AutoFitButtonLabel>
        </Button>
      </div>
    </article>
  )
}

function EventPreferenceControls({
  locale,
  preferences,
  onPreferenceChange,
}: {
  locale: SupportedLocale
  preferences: EventServicePreferences
  onPreferenceChange: (
    key: keyof EventServicePreferences,
    value: boolean,
  ) => void
}) {
  const copy = getCopy(locale).preferences
  const options = [
    {
      id: 'handWrapAssist' as const,
      ...copy.handWrapAssist,
    },
    {
      id: 'quietMode' as const,
      ...copy.quietMode,
    },
  ]

  return (
    <div className="min-w-0 max-w-full">
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((option) => {
          const selected = preferences[option.id]

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onPreferenceChange(option.id, !selected)}
              className={`interaction-hint min-w-0 rounded-lg border px-2 py-1.5 text-left transition-colors ${
                selected
                  ? 'border-neon/30 bg-neon/10'
                  : 'border-pearl/10 bg-black/16 hover:border-pearl/20'
              }`}
            >
              <span className="grid min-w-0 gap-1">
                <span className="min-w-0">
                  <span className="block truncate font-heading text-[0.78rem] leading-tight text-pearl">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-mist/56">
                    {option.body}
                  </span>
                </span>
                <span
                  className={`w-fit rounded-full border px-1.5 py-0.5 font-heading text-[0.62rem] leading-none ${
                    selected
                      ? 'border-neon/30 text-neon'
                      : 'border-pearl/15 text-mist/50'
                  }`}
                >
                  {selected ? copy.selected : copy.optional}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FreeTrialTicketCard({
  ticket,
  availability,
  hasLiveData,
  locale,
  freeTrialStatus,
  onOpenInfo,
  onReserve,
  onPaidFallback,
}: {
  ticket: EventTicket
  availability: SessionAvailability
  hasLiveData: boolean
  locale: SupportedLocale
  freeTrialStatus: FreeTrialStatusState
  onOpenInfo: (ticket: EventTicket) => void
  onReserve: (ticket: EventTicket) => void
  onPaidFallback: (ticket: EventTicket) => void
}) {
  const used = freeTrialStatus === 'used'
  const statusUnavailable = freeTrialStatus === 'unavailable'
  const copy = getCopy(locale)
  const remainingLabel = getRemainingLabel(availability, hasLiveData, locale)
  const disabled = hasLiveData && availability.remaining <= 0
  const nearbyAreaLabel = getNearbyAreaLabel(ticket.course.venueId, locale)
  const coachProfile = findCoachProfile(ticket.course.coach)
  const coachLabel = getEventCoachDisplayLabel(
    coachProfile,
    getCoachDisplayName(ticket.course.coach),
    locale,
  )
  const coachInitial = coachLabel.slice(0, 1).toUpperCase()
  const coachPreviewTags = getEventCoachPreviewTags(coachProfile, locale)
  const courseName = getCourseDisplayName(ticket.course, locale)
  const coursePhoto = getEventCoursePhoto(ticket.course)

  return (
    <article
      aria-label={`${copy.tickets.freeTrialTitle}，${ticket.dateLabel} ${ticket.timeLabel}，${ticket.venueLabel}`}
      className="relative flex h-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-pearl/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(0,0,0,0.34))] shadow-[0_18px_52px_rgba(0,0,0,0.24)]"
    >
      <div className="relative shrink-0 border-b border-pearl/10 bg-[radial-gradient(circle_at_18%_18%,rgba(245,98,45,0.18),transparent_34%),linear-gradient(135deg,rgba(0,0,0,0.94),rgba(12,12,12,0.72))] p-3.5">
        <div className="relative z-10">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              <span className="rounded-full border border-pearl/15 bg-black/20 px-3 py-1.5 font-heading text-xs text-pearl">
                {ticket.venueLabel}
              </span>
              {nearbyAreaLabel ? (
                <span className="rounded-full border border-neon/20 bg-neon/10 px-3 py-1.5 font-heading text-xs text-neon">
                  {nearbyAreaLabel}
                </span>
              ) : null}
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-full border border-neon/25 bg-neon/10 px-3 py-1 text-xs font-heading text-neon">
              {used
                ? copy.tickets.freeTrialUsedBadge
                : copy.tickets.freeTrialFirstTimeBadge}
            </span>
          </div>

          <div className="mt-3 min-w-0">
            <h3 className="whitespace-nowrap font-heading text-[1.06rem] font-black leading-tight text-pearl">
              {used ? copy.tickets.paidFallbackTitle : copy.tickets.freeTrialTitle}
            </h3>
            <p className="mt-1.5 font-heading text-sm text-mist/84">
              {ticket.dateLabel}｜{ticket.timeLabel}
            </p>
            <p className="mt-1 font-heading text-xs text-neon/80">
              {remainingLabel}
            </p>

            <EventCoursePhotoPreview photo={coursePhoto} locale={locale} />

            <button
              type="button"
              onClick={() => onOpenInfo(ticket)}
              data-interaction-hint
              className="coach-avatar-trigger interaction-hint mt-2.5 flex w-full min-w-0 items-center gap-2 rounded-xl border border-pearl/10 bg-black/22 p-1.5 text-left transition-colors hover:border-neon/28 hover:bg-neon/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/70"
              aria-label={`${copy.tickets.view} ${coachLabel} ${copy.tickets.coachSuffix} ${courseName}`}
            >
              {coachProfile ? (
                <img
                  src={coachProfile.photo}
                  alt={coachProfile.displayName}
                  draggable={false}
                  loading="lazy"
                  className="h-10 w-10 shrink-0 rounded-full border border-neon/30 object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pearl/10 bg-pearl/8 font-heading text-base font-black text-mist">
                  {coachInitial}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-heading font-semibold leading-snug text-pearl">
                  {courseName}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="font-heading text-xs font-semibold text-neon/85">
                    {coachLabel} {copy.tickets.coachSuffix}
                  </span>
                  {coachPreviewTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-pearl/10 bg-pearl/5 px-2 py-0.5 text-[10px] leading-snug text-mist/72"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-neon/20 px-2 py-1 font-heading text-[10px] text-neon/80">
                {copy.tickets.view}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-b border-pearl/10 px-4 py-3">
        <p className="grid grid-cols-[0.45rem_minmax(0,1fr)] gap-2 break-words text-xs leading-relaxed text-mist/74">
          <span className="mt-[0.43rem] h-1.5 w-1.5 rounded-full bg-neon" />
          <span>
            <strong className="break-words font-heading text-pearl">
              {copy.passHighlights.standardFlow.title}
            </strong>
            <span className="text-mist/56">｜</span>
            {copy.passHighlights.standardFlow.body}
          </span>
        </p>
        <p className="grid grid-cols-[0.45rem_minmax(0,1fr)] gap-2 break-words text-xs leading-relaxed text-mist/74">
          <span className="mt-[0.43rem] h-1.5 w-1.5 rounded-full bg-neon" />
          <span>
            <strong className="break-words font-heading text-pearl">
              {used ? copy.tickets.usedFirstTime : copy.tickets.freeTrialFirstTimeBadge}
            </strong>
            <span className="text-mist/56">｜</span>
            {used ? copy.tickets.usedFallback : copy.tickets.freeTrialLimit}
          </span>
        </p>
      </div>

      <div className="mt-auto px-4 pb-4 pt-3">
        <Button
          size="lg"
          className="w-full"
          disabled={disabled || freeTrialStatus === 'checking' || statusUnavailable}
          onClick={() => (used ? onPaidFallback(ticket) : onReserve(ticket))}
          data-cta={used ? 'event-free-trial-paid-fallback' : 'event-free-trial-reserve'}
          data-ticket={ticket.id}
        >
          <AutoFitButtonLabel>
            {disabled
              ? copy.tickets.soldOut
              : used
                ? copy.tickets.paidFallbackCta
                : freeTrialStatus === 'checking'
                  ? copy.tickets.checking
                  : statusUnavailable
                    ? copy.tickets.unavailable
                  : copy.tickets.freeTrialCta}
          </AutoFitButtonLabel>
        </Button>
      </div>
    </article>
  )
}

function EventPassPreview({
  actionLabel,
  onAction,
  locale,
}: {
  actionLabel: string
  onAction: () => void
  locale: SupportedLocale
}) {
  const copy = getCopy(locale).passPreview

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className="relative overflow-hidden rounded-2xl border border-blaze/25 bg-[radial-gradient(circle_at_18%_16%,rgba(245,98,45,0.24),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.44),rgba(0,0,0,0.24))] p-4 shadow-[0_18px_52px_rgba(0,0,0,0.24)]"
    >
      <div className="relative z-10">
        <p className="font-heading text-xs font-bold tracking-[0.2em] text-neon/80">
          {copy.eyebrow}
        </p>
        <h2 className="mt-4 font-heading text-[2.25rem] font-black leading-[0.98] text-pearl">
          {copy.title.split('\n').map((line, index) => (
            <span key={line}>
              {line}
              {index < copy.title.split('\n').length - 1 ? <br /> : null}
            </span>
          ))}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-mist/82">
          {copy.body}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {copy.items.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-pearl/10 bg-black/28 px-3 py-2"
            >
              <p className="font-heading text-xs text-pearl">{item}</p>
            </div>
          ))}
        </div>

        <Button
          size="lg"
          className="mt-6 w-full"
          onClick={onAction}
          data-cta="event-more-sessions"
        >
          {actionLabel}
        </Button>
      </div>
    </motion.article>
  )
}

function EventTicketDropSection({
  tickets,
  freeTrialTickets,
  freeTrialStatus,
  recommendation,
  showMoreSessions,
  moreSessionsActionLabel,
  locale,
  preferences,
  getAvailability,
  hasLiveData,
  onShowMoreSessions,
  onPreferenceChange,
  onOpenInfo,
  onOpenProduct,
  onPurchase,
  onFreeTrialReserve,
  onFreeTrialPaidFallback,
}: {
  tickets: EventTicket[]
  freeTrialTickets: EventTicket[]
  freeTrialStatus: FreeTrialStatusState
  recommendation: VenueRecommendation | null
  showMoreSessions: boolean
  moreSessionsActionLabel: string
  locale: SupportedLocale
  preferences: EventServicePreferences
  getAvailability: (sessionId: string) => SessionAvailability
  hasLiveData: boolean
  onShowMoreSessions: () => void
  onPreferenceChange: (
    key: keyof EventServicePreferences,
    value: boolean,
  ) => void
  onOpenInfo: (ticket: EventTicket) => void
  onOpenProduct: (productId: EventProductId) => void
  onPurchase: (ticket: EventTicket, variant: EventPassVariant) => void
  onFreeTrialReserve: (ticket: EventTicket) => void
  onFreeTrialPaidFallback: (ticket: EventTicket) => void
}) {
  const copy = getCopy(locale).tickets
  const venueTabs = useMemo(() => getEventVenueTabs(locale), [locale])
  const visibleTickets = useMemo(
    () =>
      sortEventTicketsByVenuePriority(
        tickets,
        recommendation,
        getAvailability,
        hasLiveData,
    ),
    [getAvailability, hasLiveData, recommendation, tickets],
  )
  const visibleVenueTickets = useMemo(
    () => [...visibleTickets, ...freeTrialTickets],
    [freeTrialTickets, visibleTickets],
  )
  const venueOptions = venueTabs.map((tab) => {
    const ticketCount =
      visibleTickets.filter((ticket) => ticket.course.venueId === tab.venueId)
        .length +
      freeTrialTickets.filter((ticket) => ticket.course.venueId === tab.venueId)
        .length
    return {
      ...tab,
      ticketCount,
    }
  })
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const selectedVenueHasTickets = selectedVenueId
    ? venueOptions.some(
        (option) => option.venueId === selectedVenueId && option.ticketCount > 0,
      )
    : false
  const activeVenueId = selectedVenueHasTickets ? selectedVenueId : null
  const activeVenueTickets = visibleTickets.filter(
    (ticket) => ticket.course.venueId === activeVenueId,
  )
  const activeVenueFreeTrialTickets = freeTrialTickets.filter(
    (ticket) => ticket.course.venueId === activeVenueId,
  )
  const sortVenueCardsByTime = <
    T extends { ticket: EventTicket; sortIndex: number },
  >(
    cards: T[],
  ) =>
    [...cards].sort((a, b) => {
      if (a.ticket.course.date !== b.ticket.course.date) {
        return a.ticket.course.date < b.ticket.course.date ? -1 : 1
      }
      if (a.ticket.course.startTime !== b.ticket.course.startTime) {
        return a.ticket.course.startTime < b.ticket.course.startTime ? -1 : 1
      }
      if (a.ticket.course.endTime !== b.ticket.course.endTime) {
        return a.ticket.course.endTime < b.ticket.course.endTime ? -1 : 1
      }
      if (a.ticket.id !== b.ticket.id) return a.ticket.id < b.ticket.id ? -1 : 1
      return a.sortIndex - b.sortIndex
    })
  const activeVenueGearCards = sortVenueCardsByTime(
    activeVenueTickets.map((ticket) => ({
      type: 'paid' as const,
      key: `${ticket.id}-fight-night-gear-pass`,
      ticket,
      variant: eventPassVariants.find(
        (variant) => variant.id === 'fight-night-gear-pass',
      ) ?? eventPassVariants[0],
      sortIndex: 0,
    })),
  )
  const activeVenuePassCards = sortVenueCardsByTime(
    activeVenueTickets.map((ticket) => ({
      type: 'paid' as const,
      key: `${ticket.id}-fight-night-pass`,
      ticket,
      variant: eventPassVariants.find(
        (variant) => variant.id === 'fight-night-pass',
      ) ?? eventPassVariants[0],
      sortIndex: 0,
    })),
  )
  const activeVenueFreeTrialCards = sortVenueCardsByTime(
    activeVenueFreeTrialTickets.map((ticket, index) => ({
      type: 'free-trial' as const,
      key: `${ticket.id}-free-trial`,
      ticket,
      sortIndex: index,
    })),
  )
  const activeVenueCardRows = [
    {
      id: 'gear',
      title: 'FIGHT NIGHT GEAR',
      cards: activeVenueGearCards,
    },
    {
      id: 'pass',
      title: 'FIGHT NIGHT',
      cards: activeVenuePassCards,
    },
    {
      id: 'free-trial',
      title: locale === 'en' ? 'FREE TRIAL THIS WEEK' : '本週免費課程',
      cards: activeVenueFreeTrialCards,
    },
  ].filter((row) => row.cards.length > 0)
  const activeVenueCardCount = activeVenueCardRows.reduce(
    (count, row) => count + row.cards.length,
    0,
  )
  const renderVenueCard = (
    card:
      | {
          type: 'paid'
          key: string
          ticket: EventTicket
          variant: EventPassVariant
          sortIndex: number
        }
      | {
          type: 'free-trial'
          key: string
          ticket: EventTicket
          sortIndex: number
        },
  ) => (
    <div
      key={card.key}
      className="flex min-w-[90%] max-w-[90%] shrink-0 snap-start flex-col"
    >
      {card.type === 'paid' ? (
        <EventTicketCard
          ticket={card.ticket}
          variant={card.variant}
          availability={getAvailability(card.ticket.sessionId)}
          hasLiveData={hasLiveData}
          locale={locale}
          preferences={preferences}
          onPreferenceChange={onPreferenceChange}
          onOpenInfo={onOpenInfo}
          onOpenProduct={onOpenProduct}
          onPurchase={onPurchase}
        />
      ) : (
        <FreeTrialTicketCard
          ticket={card.ticket}
          availability={getAvailability(card.ticket.sessionId)}
          hasLiveData={hasLiveData}
          locale={locale}
          freeTrialStatus={freeTrialStatus}
          onOpenInfo={onOpenInfo}
          onReserve={onFreeTrialReserve}
          onPaidFallback={onFreeTrialPaidFallback}
        />
      )}
    </div>
  )
  const activeVenueSessionCount = new Set(
    [...activeVenueTickets, ...activeVenueFreeTrialTickets].map(
      (ticket) => ticket.id,
    ),
  ).size
  const activeVenueLabel =
    venueOptions.find((tab) => tab.venueId === activeVenueId)?.label ??
    copy.currentVenue
  const getVenueCountLabel = (count: number) =>
    locale === 'en'
      ? `${count} session${count === 1 ? '' : 's'}`
      : `${count} 場`

  return (
    <SectionWrapper
      id="event-entry"
      className="min-w-0 scroll-mt-24 max-w-[430px] overflow-hidden px-4 sm:px-4"
      padding="py-8"
    >
      {visibleVenueTickets.length > 0 ? (
        <div className="grid min-w-0 gap-4">
          {!showMoreSessions ? (
            <EventPassPreview
              actionLabel={moreSessionsActionLabel}
              onAction={onShowMoreSessions}
              locale={locale}
            />
          ) : null}

          {showMoreSessions ? (
            <div id="event-more-sessions" className="min-w-0 max-w-full scroll-mt-24">
              <EventSectionHeading
                eyebrow={copy.sectionEyebrow}
                title={copy.sectionTitle}
              >
                {activeVenueId
                  ? copy.sectionSummary(activeVenueLabel, activeVenueSessionCount)
                  : copy.venueSelectPrompt}
              </EventSectionHeading>
              <div
                className={`mb-4 rounded-2xl border bg-black/25 p-3 ${
                  activeVenueId
                    ? 'border-pearl/10'
                    : 'venue-select-attention border-neon/35'
                }`}
                aria-label={copy.venueTabsLabel}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-heading text-xs font-bold tracking-[0.18em] text-neon/80">
                    {copy.venueTabsLabel}
                  </p>
                  <span className="shrink-0 rounded-full border border-pearl/10 px-2.5 py-1 font-heading text-[10px] text-mist/70">
                    {getVenueCountLabel(visibleVenueTickets.length)}
                  </span>
                </div>
                <div className="grid min-w-0 gap-2">
                  {venueOptions.map((tab) => {
                    const selected = tab.venueId === activeVenueId

                    return (
                      <button
                        key={tab.venueId}
                        type="button"
                        aria-pressed={selected}
                        disabled={tab.ticketCount === 0}
                        className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          selected
                            ? 'border-neon/45 bg-neon/12 text-pearl shadow-[0_14px_36px_rgba(155,255,101,0.08)]'
                            : 'border-pearl/10 bg-black/24 text-mist/72 hover:border-neon/24 hover:bg-neon/8'
                        }`}
                        onClick={() => setSelectedVenueId(tab.venueId)}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-heading text-base font-black text-pearl">
                            {tab.label}
                          </span>
                          <span className="mt-1 block truncate text-xs leading-snug text-mist/66">
                            {tab.nearbyAreaLabel}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 font-heading text-xs ${
                            selected
                              ? 'border-neon/35 bg-neon/10 text-neon'
                              : 'border-pearl/10 bg-pearl/5 text-mist/66'
                          }`}
                        >
                          {getVenueCountLabel(tab.ticketCount)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {!activeVenueId ? (
                <p className="rounded-xl border border-pearl/10 bg-black/25 px-4 py-4 text-sm leading-relaxed text-mist/68">
                  {copy.venueSelectPrompt}
                </p>
              ) : activeVenueCardCount > 0 ? (
                <div className="grid min-w-0 gap-6">
                  {activeVenueCardRows.map((row) => (
                    <div key={row.id} className="min-w-0">
                      <div className="mb-2 flex items-center justify-between gap-3 px-1">
                        <p className="truncate font-heading text-xs font-black tracking-[0.2em] text-neon/85">
                          {row.title}
                        </p>
                        <span className="shrink-0 rounded-full border border-pearl/10 px-2.5 py-1 font-heading text-[10px] text-mist/66">
                          {getVenueCountLabel(row.cards.length)}
                        </span>
                      </div>
                      <div
                        data-swipe-hint
                        className="ticket-card-carousel swipe-hint flex w-full max-w-full snap-x snap-mandatory gap-2 overflow-x-auto pb-4"
                        aria-label={`${activeVenueLabel} ${row.title}`}
                      >
                        {row.cards.map((card) => renderVenueCard(card))}
                      </div>
                      {row.cards.length > 1 ? (
                        <div
                          className="-mt-1 flex justify-center gap-1.5"
                          aria-hidden="true"
                        >
                          {row.cards.slice(0, 8).map((card, index) => (
                            <span
                              key={card.key}
                              className={`h-1.5 rounded-full ${
                                index === 0
                                  ? 'w-4 bg-neon'
                                  : 'w-1.5 bg-pearl/24'
                              }`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-pearl/10 bg-black/25 px-4 py-4 text-sm leading-relaxed text-mist/68">
                  {copy.noVenueSessions}
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="rounded-xl border border-pearl/10 bg-black/30 px-4 py-5 text-sm leading-relaxed text-mist/72">
          {copy.noSessions}
        </p>
      )}

    </SectionWrapper>
  )
}

function CheckoutModal({
  selectedTicket,
  selectedVariant,
  availability,
  locale,
  preferences,
  onClose,
}: {
  selectedTicket: EventTicket | null
  selectedVariant: EventPassVariant
  availability: SessionAvailability | null
  locale: SupportedLocale
  preferences: EventServicePreferences
  onClose: () => void
}) {
  const { track } = useTracking()
  const [form, setForm] = useState<BuyerContactForm>({
    name: '',
    phone: '',
    email: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!selectedTicket) return

    const lineContext = getLineRequestContext()
    const savedContact = getSavedBuyerContact(lineContext?.lineUserId)

    setForm({
      name: savedContact?.name || lineContext?.displayName || '',
      phone: savedContact?.phone || '',
      email: savedContact?.email || lineContext?.email || '',
    })
    setSubmitError('')
  }, [selectedTicket])

  if (!selectedTicket || !availability || typeof document === 'undefined') {
    return null
  }

  const displayPrice = getEventTicketPrice(
    selectedTicket,
    availability,
    selectedVariant,
  )
  const checkoutServicePreferences = selectedVariant.showPreferences
    ? preferences
    : null
  const copy = getCopy(locale).modal
  const variantTitle = getEventPassVariantTitle(selectedVariant, locale)

  const handleChange =
    (field: keyof BuyerContactForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    const lineContext = getLineRequestContext()
    if (!lineContext?.lineUserId) {
      setSubmitError(copy.checkoutLoginRequired)
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    saveBuyerContact(
      {
        lineUserId: lineContext.lineUserId,
        name: form.name,
        phone: form.phone,
        email: form.email,
      },
      lineContext.lineUserId,
    )

    try {
      const checkoutPrice = getEventTicketPrice(
        selectedTicket,
        availability,
        selectedVariant,
      )
      const initiateCheckoutEventId = createMetaEventId('initiate_checkout')

      const response = await fetch('/api/shopline/checkout-session', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          buyer: form,
          lineContext,
          course: selectedTicket.course,
          packageSize: 1,
          pricingMode: eventCoursePricingMode,
          eventPassVariant: selectedVariant.id,
          equipmentPackage: selectedVariant.equipmentPackage,
          priceDelta: selectedVariant.priceDelta,
          fixedAmount: selectedVariant.fixedAmount,
          includesGloves: selectedVariant.includesGloves,
          includesWraps: selectedVariant.includesWraps,
          quotedAmountValue: checkoutPrice.amount,
          quotedOriginalAmountValue: undefined,
          sessionIds: [selectedTicket.sessionId],
          seriesDates: [selectedTicket.course.date],
          sourcePath: getSourcePath(),
          tracking: {
            ...getCheckoutTrackingContext(),
            initiateCheckoutEventId,
            landingVariant,
            eventName,
            ticketId: selectedTicket.id,
            eventPassVariant: selectedVariant.id,
            equipmentPackage: selectedVariant.equipmentPackage,
            priceDelta: selectedVariant.priceDelta,
            fixedAmount: selectedVariant.fixedAmount,
            includesGloves: selectedVariant.includesGloves,
            includesWraps: selectedVariant.includesWraps,
            handWrapAssist:
              checkoutServicePreferences?.handWrapAssist ?? false,
            quietMode: checkoutServicePreferences?.quietMode ?? false,
            noMembershipSalesFlow: true,
          },
          servicePreferences: checkoutServicePreferences,
          client: getClientContext(),
        }),
      })

      const data = (await response.json().catch(() => null)) as
        | {
            referenceId?: string
            sessionUrl?: string
            reason?: string
            error?: string
          }
        | null

      if (!response.ok || !data?.sessionUrl) {
        throw new Error(
          data?.error || copy.checkoutError,
        )
      }

      track({
        event: 'shopline_checkout_submit',
        params: {
          source: landingVariant,
          reference_id: data.referenceId,
          course_id: selectedTicket.course.id,
          course_name: selectedTicket.course.name,
          category: selectedTicket.course.category,
          venue_id: selectedTicket.course.venueId,
          venue_name: selectedTicket.course.venueName,
          date: selectedTicket.course.date,
          start_time: selectedTicket.course.startTime,
          coach: selectedTicket.course.coach,
          coach_pricing_tier: checkoutPrice.pricingTier,
          package_size: 1,
          value: checkoutPrice.amount,
          original_value: checkoutPrice.offerApplied
            ? checkoutPrice.originalAmount
            : undefined,
          discount_code: undefined,
          discount_label: undefined,
          currency: 'TWD',
          remaining: availability.remaining,
          event_product: 'fight_night_entry_ticket_no_membership',
          event_pass_variant: selectedVariant.id,
          equipment_package: selectedVariant.equipmentPackage,
          event_id: initiateCheckoutEventId,
          pricing_mode: eventCoursePricingMode,
        },
        metaStandardEvent: 'InitiateCheckout',
        metaEventId: initiateCheckoutEventId,
        lineEventName: 'CheckoutSubmit',
      })

      window.location.href = data.sessionUrl
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : copy.checkoutError
      setSubmitError(message)
      track({
        event: 'shopline_checkout_error',
        params: {
          source: landingVariant,
          course_id: selectedTicket.course.id,
          session_id: selectedTicket.sessionId,
          error_message: message,
        },
      })
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-3 py-6 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-3xl border border-pearl/10 bg-obsidian p-5 shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-pearl/10 bg-pearl/5 px-3 py-2 text-sm font-bold text-pearl"
          aria-label={copy.close}
        >
          ×
        </button>

        <form onSubmit={handleSubmit}>
          <p className="font-heading text-xs text-neon/80">
            {copy.checkoutEyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-heading font-bold text-pearl">
            {copy.checkoutTitle}
          </h2>

          <div className="mt-5 rounded-2xl border border-neon/20 bg-neon/[0.04] p-4">
            <p className="font-heading font-bold text-pearl">
              {variantTitle}
            </p>
            <p className="mt-2 text-sm text-mist/70">
              {selectedTicket.venueLabel} · {selectedTicket.dateLabel}{' '}
              {selectedTicket.timeLabel}
            </p>
            <p className="mt-3 text-2xl font-heading font-bold text-neon">
              {displayPrice.label}
            </p>
            {displayPrice.compareAtLabel && (
              <p className="mt-1 text-xs text-mist/45">
                {copy.comparePrefix}{' '}
                <span className="line-through">
                  {displayPrice.compareAtLabel}
                </span>
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-mist/62">
              {copy.checkoutNote}
            </p>
            {selectedVariant.showPreferences && (
              <div className="mt-4 border-t border-pearl/10 pt-3">
                <p className="font-heading text-xs text-mist/55">
                  {getCopy(locale).preferences.heading}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferences.handWrapAssist && (
                    <span className="rounded-full border border-neon/20 bg-neon/10 px-3 py-1 text-xs text-neon">
                      {getCopy(locale).preferences.handWrapAssist.title}
                    </span>
                  )}
                  {preferences.quietMode && (
                    <span className="rounded-full border border-neon/20 bg-neon/10 px-3 py-1 text-xs text-neon">
                      {getCopy(locale).preferences.quietMode.title}
                    </span>
                  )}
                  {!preferences.handWrapAssist && !preferences.quietMode && (
                    <span className="rounded-full border border-pearl/15 bg-black/20 px-3 py-1 text-xs text-mist/58">
                      {copy.normalEntryAssist}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-heading text-pearl">{copy.name}</span>
              <input
                value={form.name}
                onChange={handleChange('name')}
                required
                autoComplete="name"
                className="mt-2 w-full rounded-xl border border-pearl/20 bg-black/35 px-4 py-3 text-pearl outline-none transition focus:border-neon/60"
                placeholder={copy.namePlaceholder}
              />
            </label>
            <label className="block">
              <span className="text-sm font-heading text-pearl">{copy.phone}</span>
              <input
                value={form.phone}
                onChange={handleChange('phone')}
                required
                inputMode="tel"
                autoComplete="tel"
                className="mt-2 w-full rounded-xl border border-pearl/20 bg-black/35 px-4 py-3 text-pearl outline-none transition focus:border-neon/60"
                placeholder="0912345678"
              />
            </label>
            <label className="block">
              <span className="text-sm font-heading text-pearl">Email</span>
              <input
                value={form.email}
                onChange={handleChange('email')}
                inputMode="email"
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-pearl/20 bg-black/35 px-4 py-3 text-pearl outline-none transition focus:border-neon/60"
                placeholder="name@example.com"
              />
            </label>
          </div>

          {submitError && (
            <p className="mt-4 rounded-xl border border-blaze/25 bg-blaze/10 px-4 py-3 text-sm leading-relaxed text-blaze">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="mt-6 w-full"
            data-cta="event-checkout-submit"
          >
            {isSubmitting ? copy.checkoutSubmitting : copy.checkoutSubmit}
          </Button>
          <p className="mt-3 text-center text-xs leading-relaxed text-mist/55">
            {copy.checkoutSaved}
          </p>
        </form>
      </motion.div>
    </div>,
    document.body,
  )
}

function FreeTrialReservationModal({
  selectedTicket,
  availability,
  locale,
  onClose,
  onReserved,
}: {
  selectedTicket: EventTicket | null
  availability: SessionAvailability | null
  locale: SupportedLocale
  onClose: () => void
  onReserved: () => void
}) {
  const { track } = useTracking()
  const [form, setForm] = useState<BuyerContactForm>({
    name: '',
    phone: '',
    email: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!selectedTicket) return

    const lineContext = getLineRequestContext()
    const savedContact = getSavedBuyerContact(lineContext?.lineUserId)

    setForm({
      name: savedContact?.name || lineContext?.displayName || '',
      phone: savedContact?.phone || '',
      email: savedContact?.email || lineContext?.email || '',
    })
    setSubmitError('')
  }, [selectedTicket])

  if (!selectedTicket || !availability || typeof document === 'undefined') {
    return null
  }

  const disabled = availability.remaining <= 0
  const copy = getCopy(locale).modal
  const courseName = getCourseDisplayName(selectedTicket.course, locale)
  const handleChange =
    (field: keyof BuyerContactForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting || disabled) return

    const lineContext = getLineRequestContext()
    if (!lineContext?.lineUserId) {
      setSubmitError(copy.freeTrialLoginRequired)
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    saveBuyerContact(
      {
        lineUserId: lineContext.lineUserId,
        name: form.name,
        phone: form.phone,
        email: form.email,
      },
      lineContext.lineUserId,
    )

    try {
      const scheduleEventId = createMetaEventId('schedule')
      const response = await fetch('/api/free-trial-reservation', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          buyer: form,
          lineContext,
          course: selectedTicket.course,
          sourcePath: getSourcePath(),
          tracking: {
            ...getCheckoutTrackingContext(),
            scheduleEventId,
            landingVariant,
            eventName,
            ticketId: selectedTicket.id,
            freeTrial: true,
            firstTimeOnly: true,
          },
          client: getClientContext(),
        }),
      })

      const data = (await response.json().catch(() => null)) as
        | {
            ok?: boolean
            alreadyReserved?: boolean
            error?: string
            referenceId?: string
          }
        | null

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || copy.freeTrialError)
      }

      track({
        event: data.alreadyReserved
          ? 'free_trial_reservation_already_exists'
          : 'free_trial_reservation_submit',
        params: {
          source: landingVariant,
          reference_id: data.referenceId,
          course_id: selectedTicket.course.id,
          course_name: selectedTicket.course.name,
          category: selectedTicket.course.category,
          venue_id: selectedTicket.course.venueId,
          venue_name: selectedTicket.course.venueName,
          date: selectedTicket.course.date,
          start_time: selectedTicket.course.startTime,
          coach: selectedTicket.course.coach,
          remaining: availability.remaining,
          first_time_only: true,
          event_id: scheduleEventId,
        },
        metaStandardEvent: 'Schedule',
        metaEventId: scheduleEventId,
        lineEventName: 'FreeTrialReserve',
      })

      onReserved()
      onClose()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : copy.freeTrialError
      setSubmitError(message)
      track({
        event: 'free_trial_reservation_error',
        params: {
          source: landingVariant,
          course_id: selectedTicket.course.id,
          session_id: selectedTicket.sessionId,
          error_message: message,
        },
      })
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-3 py-6 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-3xl border border-pearl/10 bg-obsidian p-5 shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-pearl/10 bg-pearl/5 px-3 py-2 text-sm font-bold text-pearl"
          aria-label={copy.close}
        >
          ×
        </button>

        <form onSubmit={handleSubmit}>
          <p className="font-heading text-xs text-neon/80">
            {copy.freeTrialEyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-heading font-bold text-pearl">
            {copy.freeTrialTitle}
          </h2>

          <div className="mt-5 rounded-2xl border border-neon/20 bg-neon/[0.04] p-4">
            <p className="font-heading font-bold text-pearl">
              {courseName}
            </p>
            <p className="mt-2 text-sm text-mist/70">
              {selectedTicket.venueLabel} · {selectedTicket.dateLabel}{' '}
              {selectedTicket.timeLabel}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-mist/62">
              {copy.freeTrialNote}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-heading text-pearl">{copy.name}</span>
              <input
                value={form.name}
                onChange={handleChange('name')}
                required
                autoComplete="name"
                className="mt-2 w-full rounded-xl border border-pearl/20 bg-black/35 px-4 py-3 text-pearl outline-none transition focus:border-neon/60"
                placeholder={copy.namePlaceholder}
              />
            </label>
            <label className="block">
              <span className="text-sm font-heading text-pearl">{copy.phone}</span>
              <input
                value={form.phone}
                onChange={handleChange('phone')}
                required
                inputMode="tel"
                autoComplete="tel"
                className="mt-2 w-full rounded-xl border border-pearl/20 bg-black/35 px-4 py-3 text-pearl outline-none transition focus:border-neon/60"
                placeholder="0912345678"
              />
            </label>
            <label className="block">
              <span className="text-sm font-heading text-pearl">Email</span>
              <input
                value={form.email}
                onChange={handleChange('email')}
                inputMode="email"
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-pearl/20 bg-black/35 px-4 py-3 text-pearl outline-none transition focus:border-neon/60"
                placeholder="name@example.com"
              />
            </label>
          </div>

          {submitError && (
            <p className="mt-4 rounded-xl border border-blaze/25 bg-blaze/10 px-4 py-3 text-sm leading-relaxed text-blaze">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || disabled}
            className="mt-6 w-full"
            data-cta="event-free-trial-submit"
          >
            {disabled
              ? getCopy(locale).tickets.soldOut
              : isSubmitting
                ? copy.freeTrialSubmitting
                : getCopy(locale).tickets.freeTrialCta}
          </Button>
        </form>
      </motion.div>
    </div>,
    document.body,
  )
}

export function FightNightEventPage() {
  const { locale, source: languageSource, setLocale } = useLocale()
  const copy = getCopy(locale)
  const tickets = useMemo(() => getPaidEventTickets(locale), [locale])
  const freeTrialTickets = useMemo(
    () => getWeeklyFreeTrialTickets(locale),
    [locale],
  )
  const faqItems = useMemo(() => copy.faq.items as FAQItem[], [copy.faq.items])
  const sessionIds = useMemo(
    () =>
      Array.from(
        new Set(
          [...tickets, ...freeTrialTickets].map((ticket) => ticket.sessionId),
        ),
      ),
    [freeTrialTickets, tickets],
  )
  const { getAvailability, hasLiveData } = useSessionAvailability(sessionIds)
  const { gateState, requestGateAccess, loginUrl, getLoginUrl } = useLiffGate()
  const { track, trackGateAccess } = useTracking()
  const [selectedTicket, setSelectedTicket] = useState<EventTicket | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<EventPassVariant>(
    defaultEventPassVariant,
  )
  const [selectedFreeTrialTicket, setSelectedFreeTrialTicket] =
    useState<EventTicket | null>(null)
  const [freeTrialStatusSnapshot, setFreeTrialStatusSnapshot] =
    useState<FreeTrialStatusSnapshot | null>(null)
  const [selectedInfoTicket, setSelectedInfoTicket] =
    useState<EventTicket | null>(null)
  const [selectedProductId, setSelectedProductId] =
    useState<EventProductId | null>(null)
  const [recommendation, setRecommendation] =
    useState<VenueRecommendation | null>(null)
  const showMoreSessions = true
  const [servicePreferences, setServicePreferences] =
    useState<EventServicePreferences>({
      handWrapAssist: true,
      quietMode: false,
    })
  const featuredTicket = tickets[0]
  const featuredAvailability = featuredTicket
    ? getAvailability(featuredTicket.sessionId)
    : null
  const featuredPrice =
    featuredTicket && featuredAvailability
      ? getEventTicketPrice(featuredTicket, featuredAvailability)
      : undefined
  const currentLineUserId =
    gateState.status === 'unlocked'
      ? getLineRequestContext()?.lineUserId ?? ''
      : ''
  const freeTrialStatus: FreeTrialStatusState =
    gateState.status !== 'unlocked'
      ? 'unknown'
      : freeTrialStatusSnapshot?.lineUserId === currentLineUserId
        ? freeTrialStatusSnapshot.status
        : 'checking'

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const loadLocationRecommendation = async () => {
      try {
        const response = await fetch('/api/location', {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) return

        const data =
          (await response.json()) as LocationRecommendationResponse
        const venueId = data.recommendation?.venueId
        if (!venueId || !(venueId in venueCoordinates) || cancelled) return

        setRecommendation({
          venueId,
          distanceKm: data.recommendation?.distanceKm,
          source: 'cloudflare',
        })
      } catch {
        // Keep the default next-event card if location cannot be inferred.
      }
    }

    void loadLocationRecommendation()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  useEffect(() => {
    track({
      event: 'event_page_view',
      params: {
        source: landingVariant,
        event_name: eventName,
        entry_ticket_flow: true,
        page_language: locale,
        language_source: languageSource,
      },
      metaStandardEvent: 'ViewContent',
      lineEventName: 'EventPageView',
    })
  }, [languageSource, locale, track])

  useEffect(() => {
    if (gateState.status !== 'unlocked') return
    const checkoutIntent = consumeEventCheckoutIntent()
    if (!checkoutIntent) return

    const targetTicket = [...tickets, ...freeTrialTickets].find(
      (ticket) => ticket.id === checkoutIntent.ticketId,
    )
    if (!targetTicket) return

    const revealId = window.setTimeout(() => {
      scrollToMoreSessions()
      setSelectedVariant(checkoutIntent.variant)
      setSelectedTicket(targetTicket)
    }, 0)

    return () => window.clearTimeout(revealId)
  }, [freeTrialTickets, gateState.status, tickets])

  useEffect(() => {
    if (gateState.status !== 'unlocked') return

    let active = true
    const lineContext = getLineRequestContext()
    const lineUserId = lineContext?.lineUserId ?? ''

    fetch('/api/free-trial-status', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        lineContext,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('free trial status unavailable')
        return response.json()
      })
      .then((data) => {
        if (!active) return
        setFreeTrialStatusSnapshot({
          lineUserId,
          status:
            data?.lineLoginRequired === true
              ? 'unavailable'
              : data?.alreadyReserved === true || data?.hasPurchased === true
                ? 'used'
                : 'available',
        })
      })
      .catch(() => {
        if (!active) return
        setFreeTrialStatusSnapshot({
          lineUserId,
          status: 'unavailable',
        })
      })

    return () => {
      active = false
    }
  }, [currentLineUserId, gateState.status])

  const updateServicePreference = (
    key: keyof EventServicePreferences,
    value: boolean,
  ) => {
    setServicePreferences((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const showMoreSessionsActionLabel = copy.tickets.showAll

  const handleShowMoreSessions = () => {
    track({
      event: 'event_more_sessions_click',
      params: {
        source: landingVariant,
        gate_status: gateState.status,
      },
    })

    scrollToMoreSessions()
  }

  const openCheckout = async (
    ticket?: EventTicket,
    variant: EventPassVariant = defaultEventPassVariant,
  ) => {
    const targetTicket = ticket ?? featuredTicket
    if (!targetTicket) return

    track({
      event: 'event_ticket_cta_click',
      params: {
        source: landingVariant,
        ticket_id: targetTicket.id,
        course_id: targetTicket.course.id,
        gate_status: gateState.status,
        event_product: 'fight_night_entry_ticket_no_membership',
        event_pass_variant: variant.id,
        equipment_package: variant.equipmentPackage,
        price_delta: variant.priceDelta,
        includes_gloves: variant.includesGloves,
        includes_wraps: variant.includesWraps,
        hand_wrap_assist: servicePreferences.handWrapAssist,
        quiet_mode: servicePreferences.quietMode,
      },
      metaStandardEvent: 'AddToCart',
      lineEventName: 'EventTicketClick',
    })

    if (gateState.status !== 'unlocked') {
      trackGateAccess('event_entry_ticket', gateState.status)
      const returnPath = buildEventCheckoutReturnPath(targetTicket, variant)
      const eventLoginUrl = getLoginUrl(returnPath) || loginUrl
      if (eventLoginUrl && ['loading', 'logged-out'].includes(gateState.status)) {
        window.location.href = eventLoginUrl
        return
      }

      const unlocked = await requestGateAccess()
      if (!unlocked) return
    }

    setSelectedVariant(variant)
    setSelectedTicket(targetTicket)
  }

  const openFreeTrialReservation = async (ticket: EventTicket) => {
    track({
      event: 'event_free_trial_cta_click',
      params: {
        source: landingVariant,
        ticket_id: ticket.id,
        course_id: ticket.course.id,
        gate_status: gateState.status,
        first_time_only: true,
        free_trial_status: freeTrialStatus,
      },
      metaStandardEvent: 'AddToCart',
      lineEventName: 'FreeTrialClick',
    })

    if (gateState.status !== 'unlocked') {
      trackGateAccess('event_free_trial', gateState.status)
      const eventLoginUrl = getLoginUrl() || loginUrl
      if (eventLoginUrl && ['loading', 'logged-out'].includes(gateState.status)) {
        window.location.href = eventLoginUrl
        return
      }

      const unlocked = await requestGateAccess()
      if (!unlocked) return
    }

    if (freeTrialStatus === 'used') {
      void openCheckout(ticket, singleClassPaidVariant)
      return
    }

    setSelectedFreeTrialTicket(ticket)
  }

  const openFreeTrialPaidFallback = async (ticket: EventTicket) => {
    await openCheckout(ticket, singleClassPaidVariant)
  }

  const structuredData = featuredTicket
    ? {
        '@type': 'Event',
        name: locale === 'en' ? `${eventName} Entry Pass` : `${eventName} 入場票`,
        description: copy.eventDescription,
        startDate: `${featuredTicket.course.date}T${featuredTicket.course.startTime}:00+08:00`,
        endDate: `${featuredTicket.course.date}T${featuredTicket.course.endTime}:00+08:00`,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        image: [eventHeroEmotion],
        location: {
          '@type': 'Place',
          name: featuredTicket.venueLabel,
        },
        offers: {
          '@type': 'Offer',
          price: String(featuredPrice?.amount ?? ''),
          priceCurrency: 'TWD',
          availability: 'https://schema.org/InStock',
        },
      }
    : undefined

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-abyss text-pearl">
      <Seo
        title={copy.seo.title}
        description={copy.eventDescription}
        canonicalPath="/"
        keywords={copy.seo.keywords}
        image={eventHeroEmotion}
        structuredData={structuredData}
      />
      <Header />
      <div className="mx-auto min-h-screen w-full max-w-[430px] shadow-[0_0_90px_rgba(0,0,0,0.45)]">
        <main>
          <EventHeroSection
            onPrimaryAction={() => scrollToId('event-entry')}
            locale={locale}
            onLocaleChange={(nextLocale) => {
              setLocale(nextLocale)
              track({
                event: 'language_switch',
                params: {
                  source: landingVariant,
                  page_language: nextLocale,
                  previous_language: locale,
                },
              })
            }}
          />
          <EventStandalonePhotoSection
            id="event-group-photo"
            src={eventGroupEnergy}
            alt={copy.photoAlts.group}
          />
          <EventReframeSection locale={locale} />
          <EventStandalonePhotoSection
            id="event-impact-photo"
            src={eventBagImpact}
            alt={copy.photoAlts.impact}
          />
          <EventProofSection locale={locale} />
          <EventSafetySection locale={locale} />
          <EventTicketDropSection
            tickets={tickets}
            freeTrialTickets={freeTrialTickets}
            freeTrialStatus={freeTrialStatus}
            recommendation={recommendation}
            showMoreSessions={showMoreSessions}
            moreSessionsActionLabel={showMoreSessionsActionLabel}
            locale={locale}
            preferences={servicePreferences}
            getAvailability={getAvailability}
            hasLiveData={hasLiveData}
            onShowMoreSessions={() => {
              void handleShowMoreSessions()
            }}
            onPreferenceChange={updateServicePreference}
            onOpenInfo={setSelectedInfoTicket}
            onOpenProduct={setSelectedProductId}
            onPurchase={openCheckout}
            onFreeTrialReserve={(ticket) => {
              void openFreeTrialReservation(ticket)
            }}
            onFreeTrialPaidFallback={(ticket) => {
              void openFreeTrialPaidFallback(ticket)
            }}
          />
          <EventStandalonePhotoSection
            id="event-afterglow-photo"
            src={eventAfterglow}
            alt={copy.photoAlts.afterglow}
          />
          <EventFlowPreviewSection locale={locale} />
          <FAQSection
            id="event-faq"
            title={copy.faq.title}
            subtitle=""
            items={faqItems}
            compact
          />
        </main>
      </div>
      <Footer />
      <CheckoutModal
        selectedTicket={selectedTicket}
        selectedVariant={selectedVariant}
        availability={
          selectedTicket ? getAvailability(selectedTicket.sessionId) : null
        }
        locale={locale}
        preferences={servicePreferences}
        onClose={() => {
          setSelectedTicket(null)
          setSelectedVariant(defaultEventPassVariant)
        }}
      />
      <FreeTrialReservationModal
        selectedTicket={selectedFreeTrialTicket}
        availability={
          selectedFreeTrialTicket
            ? getAvailability(selectedFreeTrialTicket.sessionId)
            : null
        }
        locale={locale}
        onClose={() => setSelectedFreeTrialTicket(null)}
        onReserved={() =>
          setFreeTrialStatusSnapshot({
            lineUserId: currentLineUserId,
            status: 'used',
          })
        }
      />
      <EventProductPhotoModal
        selectedProductId={selectedProductId}
        locale={locale}
        onClose={() => setSelectedProductId(null)}
      />
      <EventTicketInfoModal
        selectedTicket={selectedInfoTicket}
        availability={
          selectedInfoTicket
            ? getAvailability(selectedInfoTicket.sessionId)
            : null
        }
        hasLiveData={hasLiveData}
        locale={locale}
        onClose={() => setSelectedInfoTicket(null)}
      />
    </div>
  )
}
