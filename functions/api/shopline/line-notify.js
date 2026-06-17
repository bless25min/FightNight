import { weeklyCourses } from '../../../src/data/weeklySchedule.ts'

const LINE_PUSH_ENDPOINT = 'https://api.line.me/v2/bot/message/push'
const DEFAULT_PUBLIC_ORIGIN = 'https://booking.ufcgym.com.tw'

function trimText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function createLineMessageId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function formatMoney(value, currency = 'TWD') {
  const amount = Number(value || 0)
  if (currency !== 'TWD') return `${currency} ${amount.toLocaleString('en-US')}`
  return `NT$${amount.toLocaleString('en-US')}`
}

function formatDateLabel(iso) {
  const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return String(iso || '')
  return `${Number(match[2])}/${Number(match[3])}`
}

function formatTimeDigits(value) {
  const match = String(value || '').match(/^(\d{2})(\d{2})$/)
  if (!match) return ''
  return `${match[1]}:${match[2]}`
}

function getBaseCourseId(courseId) {
  return String(courseId || '').replace(/-\d{4}-\d{2}-\d{2}$/, '')
}

function getCourseTime(order) {
  const course = getCourseForOrder(order)
  if (course?.startTime) return course.startTime

  const courseId = String(order.course_id || '')
  const idTime = courseId.match(/^wc-[^-]+-\d{4}-(\d{4})-/)
  return formatTimeDigits(idTime?.[1])
}

function getVenueShortName(venueName) {
  const value = trimText(venueName, 80)
  return value
    .replace(/^UFCGYM\s*/i, '')
    .replace('旗艦館', '館')
    .trim()
}

function getOrderRequestSnapshot(order) {
  const raw = safeJsonParse(order.raw_request_json, {})
  return raw && typeof raw === 'object' ? raw : {}
}

function normalizeLineLocale(value) {
  const raw = String(value || '').trim().replace('_', '-').toLowerCase()
  if (raw.startsWith('en')) return 'en'
  return 'zh-TW'
}

function getOrderLocale(order) {
  const snapshot = getOrderRequestSnapshot(order)
  const candidates = [
    snapshot.tracking?.page_language,
    snapshot.tracking?.pageLanguage,
    snapshot.tracking?.selected_language,
    snapshot.client?.page_language,
    snapshot.client?.pageLanguage,
    snapshot.client?.language,
  ]
  const matched = candidates.find((value) => String(value || '').trim())
  return normalizeLineLocale(matched)
}

const lineCopy = {
  'zh-TW': {
    paidTitle: '已付款報名',
    paidBody: '請點擊下方按鈕確認報名，場館方會在聊天室接手安排。',
    paidButton: '確認報名',
    paidAlt: ({ venue, dateTime, courseName }) =>
      `已付款報名，請確認 ${venue} ${dateTime} ${courseName}`,
    freeTitle: '免費體驗已預約',
    freeBody: '這堂已為你保留。請點擊下方按鈕確認預約，場館方會在聊天室接手安排。',
    freeButton: '確認預約',
    freeAlt: ({ venue, dateTime, courseName }) =>
      `免費體驗已預約，請確認 ${venue} ${dateTime} ${courseName}`,
    freePackage: '首堂免費體驗',
    freeAmount: '免費',
    reservedTitle: '你已經保留過免費體驗',
    reservedBody:
      '不用再重填一次資料。原本的預約仍然保留，當天照 LINE 確認資訊到場即可。',
    reservedFootnote:
      '如果你想再選其他場次，可以回到活動頁查看目前開放的 UFC GYM 單堂體驗場次與方案。',
    reservedButton: '查看其他場次',
    reservedAlt: '你已經保留免費體驗，可以查看其他 UFC GYM 單堂體驗場次',
    labels: {
      venue: '場館',
      course: '課程',
      time: '時間',
      package: '方案',
      equipment: '裝備',
      preference: '偏好',
      amount: '金額',
      order: '訂單',
      reference: '編號',
      contact: '聯絡人',
      phone: '電話',
    },
    packages: {
      trainingPlan: (size) => `訓練方案 ${size} 堂`,
      trainingPlanSingle: '一般單堂體驗',
      singleSessionPass: '單堂體驗券',
      singleSessionGearPass: '單堂體驗裝備券',
      singleClassPaid: '一般單堂體驗',
    },
    equipment: {
      glovesAndWraps: '全新 UFC GYM 手綁帶＋拳擊手套',
      wraps: '新手包＋全新 UFC GYM 手綁帶',
      selfOrRental: '自備或現場租用裝備',
    },
    preferences: {
      handWrapAssist: '課前準備',
      quietMode: '安靜模式',
      separator: '、',
    },
  },
  en: {
    paidTitle: 'Paid booking confirmed',
    paidBody:
      'Tap below to confirm your booking. The venue team will continue the handoff in this LINE chat.',
    paidButton: 'Confirm booking',
    paidAlt: ({ venue, dateTime, courseName }) =>
      `Paid booking confirmed: ${venue} ${dateTime} ${courseName}`,
    freeTitle: 'Free trial reserved',
    freeBody:
      'Your spot has been held. Tap below to confirm the reservation, and the venue team will continue the handoff in this LINE chat.',
    freeButton: 'Confirm reservation',
    freeAlt: ({ venue, dateTime, courseName }) =>
      `Free trial reserved: ${venue} ${dateTime} ${courseName}`,
    freePackage: 'First-time free trial',
    freeAmount: 'Free',
    reservedTitle: 'You already have a free trial reserved',
    reservedBody:
      'No need to submit again. Your original reservation is still held; use the LINE confirmation details when you arrive.',
    reservedFootnote:
      'If you want to pick another session, return to the event page to see the currently available UFC GYM single-session experience sessions and passes.',
    reservedButton: 'View other sessions',
    reservedAlt:
      'You already have a free trial reserved. View other UFC GYM single-session experience sessions.',
    labels: {
      venue: 'Venue',
      course: 'Session',
      time: 'Time',
      package: 'Pass',
      equipment: 'Gear',
      preference: 'Preference',
      amount: 'Amount',
      order: 'Order',
      reference: 'Ref',
      contact: 'Contact',
      phone: 'Phone',
    },
    packages: {
      trainingPlan: (size) => `Training package ${size} sessions`,
      trainingPlanSingle: 'Single Class Experience',
      singleSessionPass: '單堂體驗券',
      singleSessionGearPass: '單堂體驗裝備券',
      singleClassPaid: 'Single Class Experience',
    },
    equipment: {
      glovesAndWraps: 'New UFC GYM hand wraps + boxing gloves',
      wraps: 'Starter kit + new UFC GYM hand wraps',
      selfOrRental: 'Bring your own gear or rent on site',
    },
    preferences: {
      handWrapAssist: 'Pre-class setup',
      quietMode: 'Quiet mode',
      separator: ', ',
    },
  },
}

function getLineCopy(locale) {
  return lineCopy[locale] ?? lineCopy['zh-TW']
}

function getCourseForOrder(order) {
  const courseId = String(order.course_id || '')
  const baseCourseId = getBaseCourseId(courseId)
  return weeklyCourses.find(
    (item) => item.id === courseId || item.id === baseCourseId,
  )
}

function getCourseName(order, locale) {
  const course = getCourseForOrder(order)
  return locale === 'en'
    ? trimText(course?.nameEn || order.course_name, 120)
    : trimText(order.course_name, 120)
}

function getVenueDisplayName(venueName, locale) {
  const shortName = getVenueShortName(venueName)
  if (locale !== 'en') return shortName

  const value = trimText(venueName, 80)
  const englishVenues = {
    敦南旗艦館: 'Dunnan Flagship',
    敦南館: 'Dunnan',
    內湖旗艦館: 'Neihu Signature',
    內湖館: 'Neihu',
    內科模範館: 'Neihu Tech Park',
    台中勤美旗艦館: 'Taichung CMP Flagship',
    台中勤美旗艦: 'Taichung CMP Flagship',
  }
  return englishVenues[value] || englishVenues[shortName] || shortName
}

function getEventPassVariant(order) {
  const snapshot = getOrderRequestSnapshot(order)
  return snapshot.eventPassVariant && typeof snapshot.eventPassVariant === 'object'
    ? snapshot.eventPassVariant
    : null
}

function getNormalizedEventPassVariantId(variant) {
  if (variant?.id === 'fight-night-pass') return 'single-session-pass'
  if (variant?.id === 'fight-night-gear-pass') {
    return 'single-session-gear-pass'
  }
  return variant?.id || ''
}

function normalizeOrderCategory(value) {
  if (value === 'TRAINING_PLAN' || value === 'BOOT_CAMP') {
    return 'TRAINING_PLAN'
  }
  if (value === 'SINGLE_SESSION' || value === 'FIGHT_NIGHT') {
    return 'SINGLE_SESSION'
  }
  return String(value || '')
}

function getEquipmentPackage(order) {
  const variant = getEventPassVariant(order)
  return variant?.equipmentPackage || null
}

function getPackageLabel(order, locale = 'zh-TW') {
  const copy = getLineCopy(locale)
  if (Number(order.package_size || 1) > 1) {
    return copy.packages.trainingPlan(order.package_size)
  }

  const variant = getEventPassVariant(order)
  const variantId = getNormalizedEventPassVariantId(variant)
  if (variantId === 'single-session-pass') return copy.packages.singleSessionPass
  if (variantId === 'single-session-gear-pass') {
    return copy.packages.singleSessionGearPass
  }
  if (variantId === 'single-class-paid') return copy.packages.singleClassPaid
  if (variant?.label && locale !== 'en') return trimText(variant.label, 80)

  if (normalizeOrderCategory(order.category) === 'TRAINING_PLAN') {
    return copy.packages.trainingPlanSingle
  }
  return copy.packages.singleSessionPass
}

function getEquipmentPackageLabel(order, locale = 'zh-TW') {
  const copy = getLineCopy(locale)
  const equipmentPackage = getEquipmentPackage(order)
  if (equipmentPackage === 'gloves-and-wraps') {
    return copy.equipment.glovesAndWraps
  }
  if (equipmentPackage === 'wraps') {
    return copy.equipment.wraps
  }
  if (equipmentPackage === 'self-or-rental') {
    return copy.equipment.selfOrRental
  }
  return ''
}

function getServicePreferenceLabel(order, locale = 'zh-TW') {
  const copy = getLineCopy(locale)
  const preferences = getOrderRequestSnapshot(order).servicePreferences
  if (!preferences || typeof preferences !== 'object') return ''

  const labels = []
  if (preferences.handWrapAssist) labels.push(copy.preferences.handWrapAssist)
  if (preferences.quietMode) labels.push(copy.preferences.quietMode)
  return labels.join(copy.preferences.separator)
}

function buildInfoRow(label, value) {
  return {
    type: 'box',
    layout: 'baseline',
    spacing: 'sm',
    contents: [
      { type: 'text', text: label, color: '#999999', size: 'sm', flex: 2 },
      {
        type: 'text',
        text: value || '-',
        color: '#111111',
        size: 'sm',
        flex: 5,
        wrap: true,
      },
    ],
  }
}

function getDateTimeLabel(order) {
  const dates = safeJsonParse(order.series_dates_json, [])
  const time = getCourseTime(order)
  return dates
    .map((date) => `${formatDateLabel(date)}${time ? ` ${time}` : ''}`)
    .filter(Boolean)
    .join('、')
}

function buildConfirmationText(order) {
  const locale = getOrderLocale(order)
  const copy = getLineCopy(locale)
  const labels = copy.labels
  const fieldSeparator = locale === 'en' ? ': ' : '：'
  const titleSeparator = locale === 'en' ? ' | ' : '｜'
  const venue = getVenueDisplayName(order.venue_name, locale)
  const dateTime = getDateTimeLabel(order)
  const courseName = getCourseName(order, locale)
  const packageLabel = getPackageLabel(order, locale)
  const amountLabel = formatMoney(order.amount_value, order.currency)
  const equipmentLabel = getEquipmentPackageLabel(order, locale)
  const preferenceLabel = getServicePreferenceLabel(order, locale)
  const lines = [
    `${copy.paidTitle}${titleSeparator}${venue}`,
    `${labels.course}${fieldSeparator}${courseName}`,
    `${labels.time}${fieldSeparator}${dateTime || '-'}`,
    `${labels.package}${fieldSeparator}${packageLabel}`,
  ]
  if (equipmentLabel) lines.push(`${labels.equipment}${fieldSeparator}${equipmentLabel}`)
  if (preferenceLabel) {
    lines.push(`${labels.preference}${fieldSeparator}${preferenceLabel}`)
  }
  lines.push(
    `${labels.amount}${fieldSeparator}${amountLabel}`,
    `${labels.order}${fieldSeparator}${order.reference_id}`,
    `${labels.contact}${fieldSeparator}${order.buyer_name || '-'}`,
    `${labels.phone}${fieldSeparator}${order.buyer_phone || '-'}`,
  )

  if (order.buyer_email) {
    lines.push(`Email${fieldSeparator}${order.buyer_email}`)
  }

  return lines.join('\n').slice(0, 300)
}

function buildReservationConfirmationCard(order) {
  const locale = getOrderLocale(order)
  const copy = getLineCopy(locale)
  const labels = copy.labels
  const venue = getVenueDisplayName(order.venue_name, locale)
  const dateTime = getDateTimeLabel(order)
  const courseName = getCourseName(order, locale)
  const packageLabel = getPackageLabel(order, locale)
  const equipmentLabel = getEquipmentPackageLabel(order, locale)
  const preferenceLabel = getServicePreferenceLabel(order, locale)
  const confirmationText = buildConfirmationText(order)
  const rows = [
    buildInfoRow(labels.venue, venue),
    buildInfoRow(labels.course, courseName),
    buildInfoRow(labels.time, dateTime || '-'),
    buildInfoRow(labels.package, packageLabel),
    equipmentLabel ? buildInfoRow(labels.equipment, equipmentLabel) : null,
    preferenceLabel ? buildInfoRow(labels.preference, preferenceLabel) : null,
    buildInfoRow(labels.amount, formatMoney(order.amount_value, order.currency)),
  ].filter(Boolean)

  return {
    type: 'flex',
    altText: copy.paidAlt({ venue, dateTime, courseName }),
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: copy.paidTitle,
            weight: 'bold',
            size: 'xl',
            color: '#111111',
          },
          {
            type: 'text',
            text: copy.paidBody,
            size: 'sm',
            color: '#666666',
            wrap: true,
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            margin: 'md',
            contents: rows,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#E3242B',
            action: {
              type: 'message',
              label: copy.paidButton,
              text: confirmationText,
            },
          },
        ],
      },
    },
  }
}

function buildFreeTrialConfirmationText(order) {
  const locale = getOrderLocale(order)
  const copy = getLineCopy(locale)
  const labels = copy.labels
  const fieldSeparator = locale === 'en' ? ': ' : '：'
  const titleSeparator = locale === 'en' ? ' | ' : '｜'
  const venue = getVenueDisplayName(order.venue_name, locale)
  const dateTime = getDateTimeLabel(order)
  const courseName = getCourseName(order, locale)
  const lines = [
    `${copy.freeTitle}${titleSeparator}${venue}${titleSeparator}${dateTime}`,
    `${labels.course}${fieldSeparator}${courseName}`,
    `${labels.contact}${fieldSeparator}${order.buyer_name || '-'}`,
    `${labels.phone}${fieldSeparator}${order.buyer_phone || '-'}`,
    `${labels.reference}${fieldSeparator}${order.reference_id}`,
  ]

  if (order.buyer_email) {
    lines.splice(4, 0, `Email${fieldSeparator}${order.buyer_email}`)
  }

  return lines.join('\n').slice(0, 300)
}

function buildFreeTrialConfirmationCard(order) {
  const locale = getOrderLocale(order)
  const copy = getLineCopy(locale)
  const labels = copy.labels
  const venue = getVenueDisplayName(order.venue_name, locale)
  const dateTime = getDateTimeLabel(order)
  const courseName = getCourseName(order, locale)
  const confirmationText = buildFreeTrialConfirmationText(order)

  return {
    type: 'flex',
    altText: copy.freeAlt({ venue, dateTime, courseName }),
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: copy.freeTitle,
            weight: 'bold',
            size: 'xl',
            color: '#111111',
          },
          {
            type: 'text',
            text: copy.freeBody,
            size: 'sm',
            color: '#666666',
            wrap: true,
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            margin: 'md',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: labels.venue, color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: venue, color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: labels.course, color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: courseName, color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: labels.time, color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: dateTime || '-', color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: labels.package, color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: copy.freePackage, color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: labels.amount, color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: copy.freeAmount, color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#E3242B',
            action: {
              type: 'message',
              label: copy.freeButton,
              text: confirmationText,
            },
          },
        ],
      },
    },
  }
}

function getPublicOrigin(env) {
  const configured =
    env.PUBLIC_SITE_URL ||
    env.SITE_ORIGIN ||
    env.PUBLIC_ORIGIN ||
    env.VITE_PUBLIC_SITE_URL

  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      // Fall through to the production origin.
    }
  }

  return DEFAULT_PUBLIC_ORIGIN
}

function buildSingleSessionEventSessionsUrl(env, referenceId, locale = 'zh-TW') {
  const url = new URL('/offers', getPublicOrigin(env))
  url.searchParams.set('from', 'line-auto')
  url.searchParams.set('utm_source', 'line')
  url.searchParams.set('utm_medium', 'auto')
  url.searchParams.set('utm_campaign', 'free_trial_already_reserved')
  if (locale === 'en') {
    url.searchParams.set('lang', 'en')
  }
  if (referenceId) {
    url.searchParams.set('reference_id', referenceId)
  }
  url.hash = 'event-more-sessions'
  return url.toString()
}

function buildFreeTrialAlreadyReservedOfferCard(order, targetUrl) {
  const locale = getOrderLocale(order)
  const copy = getLineCopy(locale)
  const labels = copy.labels
  const venue = getVenueDisplayName(order.venue_name, locale)
  const dateTime = getDateTimeLabel(order)

  return {
    type: 'flex',
    altText: copy.reservedAlt,
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: copy.reservedTitle,
            weight: 'bold',
            size: 'xl',
            color: '#111111',
            wrap: true,
          },
          {
            type: 'text',
            text: copy.reservedBody,
            size: 'sm',
            color: '#666666',
            wrap: true,
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            margin: 'md',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: labels.venue, color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: venue || '-', color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: labels.time, color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: dateTime || '-', color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: labels.reference, color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: order.reference_id, color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
            ],
          },
          {
            type: 'text',
            text: copy.reservedFootnote,
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'lg',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#E3242B',
            action: {
              type: 'uri',
              label: copy.reservedButton,
              uri: targetUrl,
            },
          },
        ],
      },
    },
  }
}

export async function ensureLineNotificationColumns(env) {
  const columns = [
    ['line_payment_notify_status', 'TEXT'],
    ['line_payment_notify_attempted_at', 'TEXT'],
    ['line_payment_notified_at', 'TEXT'],
    ['line_payment_notify_response_json', 'TEXT'],
    ['line_payment_notify_error', 'TEXT'],
  ]

  for (const [name, type] of columns) {
    try {
      await env.DB.prepare(
        `ALTER TABLE course_orders ADD COLUMN ${name} ${type}`,
      ).run()
    } catch (error) {
      if (
        error instanceof Error &&
        (/duplicate column/i.test(error.message) || /no such table/i.test(error.message))
      ) {
        continue
      }
      throw error
    }
  }
}

export async function ensureLineMessageSendsTable(env) {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS line_message_sends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT NOT NULL UNIQUE,
        line_user_id TEXT,
        reference_id TEXT,
        source TEXT NOT NULL,
        message_type TEXT NOT NULL,
        template_id TEXT,
        target_url TEXT,
        status TEXT NOT NULL DEFAULT 'sending',
        message_json TEXT,
        response_json TEXT,
        error TEXT,
        attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
        sent_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_message_sends_user
       ON line_message_sends (line_user_id, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_message_sends_reference
       ON line_message_sends (reference_id, message_type)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_message_sends_status
       ON line_message_sends (status, created_at)`,
    ),
  ])
}

async function insertLineMessageSend(
  env,
  {
    messageId,
    lineUserId,
    referenceId,
    source,
    messageType,
    templateId,
    targetUrl,
    message,
  },
) {
  await ensureLineMessageSendsTable(env)
  await env.DB.prepare(
    `INSERT INTO line_message_sends (
       message_id, line_user_id, reference_id, source, message_type,
       template_id, target_url, status, message_json, attempted_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'sending', ?, datetime('now'))`,
  )
    .bind(
      messageId,
      lineUserId || null,
      referenceId || null,
      source,
      messageType,
      templateId || null,
      targetUrl || null,
      message ? JSON.stringify(message).slice(0, 8000) : null,
    )
    .run()
}

async function updateLineMessageSend(env, messageId, result) {
  await env.DB.prepare(
    `UPDATE line_message_sends
     SET status = ?,
         response_json = ?,
         error = ?,
         sent_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE sent_at END,
         attempted_at = datetime('now')
     WHERE message_id = ?`,
  )
    .bind(
      trimText(result.status, 80),
      result.response ? JSON.stringify(result.response).slice(0, 8000) : null,
      result.error ? trimText(result.error, 1000) : null,
      result.status,
      messageId,
    )
    .run()
}

async function recordLineNotifyStatus(env, referenceId, result) {
  await env.DB.prepare(
    `UPDATE course_orders
     SET line_payment_notify_status = ?,
         line_payment_notify_attempted_at = datetime('now'),
         line_payment_notified_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE line_payment_notified_at END,
         line_payment_notify_response_json = ?,
         line_payment_notify_error = ?,
         updated_at = datetime('now')
     WHERE reference_id = ?`,
  )
    .bind(
      trimText(result.status, 80),
      result.status,
      result.response ? JSON.stringify(result.response).slice(0, 8000) : null,
      result.error ? trimText(result.error, 1000) : null,
      referenceId,
    )
    .run()
}

export async function notifyLinePaymentSuccess(env, referenceId, options = {}) {
  const force = options?.force === true
  if (!env.DB || !referenceId) {
    return { status: 'skipped_invalid_request' }
  }

  await ensureLineNotificationColumns(env)

  const order = await env.DB.prepare(
    `SELECT reference_id, status, course_id, course_name, category, venue_name,
            package_size, amount_value, currency, series_dates_json,
            buyer_name, buyer_phone, buyer_email, line_user_id,
            line_display_name, line_payment_notify_status,
            line_payment_notify_attempted_at, line_payment_notified_at,
            raw_request_json
     FROM course_orders
     WHERE reference_id = ?`,
  )
    .bind(referenceId)
    .first()

  if (!order || order.status !== 'paid') {
    return { status: 'skipped_not_paid' }
  }
  if (order.line_payment_notified_at && !force) {
    return { status: 'skipped_already_sent' }
  }
  if (!order.line_user_id) {
    const result = {
      status: 'skipped_no_line_user',
      error: 'Order has no linked LINE user',
    }
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    const result = {
      status: 'skipped_missing_token',
      error: 'Missing LINE_CHANNEL_ACCESS_TOKEN',
    }
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }

  const claim = force
    ? await env.DB.prepare(
        `UPDATE course_orders
         SET line_payment_notify_status = 'sending',
             line_payment_notify_attempted_at = datetime('now'),
             line_payment_notified_at = NULL,
             line_payment_notify_error = NULL,
             updated_at = datetime('now')
         WHERE reference_id = ?
           AND status = 'paid'
           AND line_user_id IS NOT NULL
           AND line_user_id != ''`,
      )
        .bind(referenceId)
        .run()
    : await env.DB.prepare(
        `UPDATE course_orders
         SET line_payment_notify_status = 'sending',
             line_payment_notify_attempted_at = datetime('now'),
             line_payment_notify_error = NULL,
             updated_at = datetime('now')
         WHERE reference_id = ?
           AND status = 'paid'
           AND line_user_id IS NOT NULL
           AND line_user_id != ''
           AND line_payment_notified_at IS NULL
           AND (
             line_payment_notify_status IS NULL
             OR line_payment_notify_status IN ('failed', 'skipped_missing_token', 'skipped_no_line_user')
             OR (
               line_payment_notify_status = 'sending'
               AND datetime(line_payment_notify_attempted_at) <= datetime('now', '-5 minutes')
             )
           )`,
      )
        .bind(referenceId)
        .run()

  if (!claim.meta?.changes) {
    return { status: 'skipped_in_progress_or_sent' }
  }

  const locale = getOrderLocale(order)
  const message = buildReservationConfirmationCard(order)
  const messageId = createLineMessageId('lms_paid')
  const templateId =
    locale === 'en' ? 'paid_confirmation_en' : 'paid_confirmation'

  await insertLineMessageSend(env, {
    messageId,
    lineUserId: order.line_user_id,
    referenceId,
    source: 'auto',
    messageType: 'paid_confirmation',
    templateId,
    targetUrl: null,
    message,
  })

  const payload = {
    to: order.line_user_id,
    messages: [message],
  }

  try {
    const response = await fetch(LINE_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      const result = {
        status: 'failed',
        response: responseBody,
        error: `LINE push failed with HTTP ${response.status}`,
      }
      await updateLineMessageSend(env, messageId, result)
      await recordLineNotifyStatus(env, referenceId, result)
      return result
    }

    const result = {
      status: 'sent',
      response: responseBody || { ok: true },
    }
    await updateLineMessageSend(env, messageId, result)
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  } catch (error) {
    const result = {
      status: 'failed',
      error:
        error instanceof Error
          ? error.message
        : 'LINE push request failed',
    }
    await updateLineMessageSend(env, messageId, result)
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }
}

export async function notifyLineFreeTrialAlreadyReservedOffer(env, referenceId) {
  if (!env.DB || !referenceId) {
    return { status: 'skipped_invalid_request' }
  }

  const order = await env.DB.prepare(
    `SELECT reference_id, status, course_id, course_name, venue_name,
            package_size, amount_value, currency, series_dates_json,
            buyer_name, buyer_phone, buyer_email, line_user_id,
            line_display_name, raw_request_json
     FROM course_orders
     WHERE reference_id = ?`,
  )
    .bind(referenceId)
    .first()

  if (!order || !['free_reserved', 'free_attended'].includes(String(order.status || ''))) {
    return { status: 'skipped_not_free_trial' }
  }
  if (!order.line_user_id) {
    return {
      status: 'skipped_no_line_user',
      error: 'Reservation has no linked LINE user',
    }
  }
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    return {
      status: 'skipped_missing_token',
      error: 'Missing LINE_CHANNEL_ACCESS_TOKEN',
    }
  }

  const locale = getOrderLocale(order)
  const targetUrl = buildSingleSessionEventSessionsUrl(env, referenceId, locale)
  const message = buildFreeTrialAlreadyReservedOfferCard(order, targetUrl)
  const messageId = createLineMessageId('lms_reserved_offer')
  const resultMeta = {
    messageType: 'free_trial_already_reserved_offer',
    templateId:
      locale === 'en'
        ? 'reserved_to_event_sessions_en'
        : 'reserved_to_event_sessions',
    targetUrl,
  }

  await insertLineMessageSend(env, {
    messageId,
    lineUserId: order.line_user_id,
    referenceId,
    source: 'auto',
    messageType: resultMeta.messageType,
    templateId: resultMeta.templateId,
    targetUrl,
    message,
  })

  const payload = {
    to: order.line_user_id,
    messages: [message],
  }

  try {
    const response = await fetch(LINE_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      const result = {
        ...resultMeta,
        status: 'failed',
        response: responseBody,
        error: `LINE push failed with HTTP ${response.status}`,
      }
      await updateLineMessageSend(env, messageId, result)
      return result
    }

    const result = {
      ...resultMeta,
      status: 'sent',
      response: responseBody || { ok: true },
    }
    await updateLineMessageSend(env, messageId, result)
    return result
  } catch (error) {
    const result = {
      ...resultMeta,
      status: 'failed',
      error:
        error instanceof Error
          ? error.message
          : 'LINE push request failed',
    }
    await updateLineMessageSend(env, messageId, result)
    return result
  }
}

export async function notifyLineFreeTrialReservation(env, referenceId, options = {}) {
  const force = options?.force === true
  if (!env.DB || !referenceId) {
    return { status: 'skipped_invalid_request' }
  }

  await ensureLineNotificationColumns(env)

  const order = await env.DB.prepare(
    `SELECT reference_id, status, course_id, course_name, venue_name,
            package_size, amount_value, currency, series_dates_json,
            buyer_name, buyer_phone, buyer_email, line_user_id,
            line_display_name, line_payment_notify_status,
            line_payment_notify_attempted_at, line_payment_notified_at,
            raw_request_json
     FROM course_orders
     WHERE reference_id = ?`,
  )
    .bind(referenceId)
    .first()

  if (!order || order.status !== 'free_reserved') {
    return { status: 'skipped_not_free_reserved' }
  }
  if (order.line_payment_notified_at && !force) {
    return { status: 'skipped_already_sent' }
  }
  if (!order.line_user_id) {
    const result = {
      status: 'skipped_no_line_user',
      error: 'Reservation has no linked LINE user',
    }
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    const result = {
      status: 'skipped_missing_token',
      error: 'Missing LINE_CHANNEL_ACCESS_TOKEN',
    }
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }

  const claim = force
    ? await env.DB.prepare(
        `UPDATE course_orders
         SET line_payment_notify_status = 'sending',
             line_payment_notify_attempted_at = datetime('now'),
             line_payment_notified_at = NULL,
             line_payment_notify_error = NULL,
             updated_at = datetime('now')
         WHERE reference_id = ?
           AND status = 'free_reserved'
           AND line_user_id IS NOT NULL
           AND line_user_id != ''`,
      )
        .bind(referenceId)
        .run()
    : await env.DB.prepare(
        `UPDATE course_orders
         SET line_payment_notify_status = 'sending',
             line_payment_notify_attempted_at = datetime('now'),
             line_payment_notify_error = NULL,
             updated_at = datetime('now')
         WHERE reference_id = ?
           AND status = 'free_reserved'
           AND line_user_id IS NOT NULL
           AND line_user_id != ''
           AND line_payment_notified_at IS NULL
           AND (
             line_payment_notify_status IS NULL
             OR line_payment_notify_status IN ('failed', 'skipped_missing_token', 'skipped_no_line_user')
             OR (
               line_payment_notify_status = 'sending'
               AND datetime(line_payment_notify_attempted_at) <= datetime('now', '-5 minutes')
             )
           )`,
      )
        .bind(referenceId)
        .run()

  if (!claim.meta?.changes) {
    return { status: 'skipped_in_progress_or_sent' }
  }

  const locale = getOrderLocale(order)
  const message = buildFreeTrialConfirmationCard(order)
  const messageId = createLineMessageId('lms_free')
  const templateId =
    locale === 'en' ? 'free_trial_confirmation_en' : 'free_trial_confirmation'

  await insertLineMessageSend(env, {
    messageId,
    lineUserId: order.line_user_id,
    referenceId,
    source: 'auto',
    messageType: 'free_trial_confirmation',
    templateId,
    targetUrl: null,
    message,
  })

  const payload = {
    to: order.line_user_id,
    messages: [message],
  }

  try {
    const response = await fetch(LINE_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      const result = {
        status: 'failed',
        response: responseBody,
        error: `LINE push failed with HTTP ${response.status}`,
      }
      await updateLineMessageSend(env, messageId, result)
      await recordLineNotifyStatus(env, referenceId, result)
      return result
    }

    const result = {
      status: 'sent',
      response: responseBody || { ok: true },
    }
    await updateLineMessageSend(env, messageId, result)
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  } catch (error) {
    const result = {
      status: 'failed',
      error:
        error instanceof Error
          ? error.message
        : 'LINE push request failed',
    }
    await updateLineMessageSend(env, messageId, result)
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }
}
