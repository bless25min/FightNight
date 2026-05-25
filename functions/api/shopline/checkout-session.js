import { getShoplineConfigForVenue } from './config.js'
import {
  ONLINE_BOOKING_START_OFFSET_DAYS,
  weeklyCourses,
} from '../../../src/data/weeklySchedule.ts'

const DEFAULT_CAPACITY = 6
const CURRENCY = 'TWD'
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

const coachPricingByTier = {
  'foreign-fighter': {
    fightNight: 1280,
    bootCamp: {
      2: 2200,
      4: 3800,
    },
  },
  'domestic-teacher': {
    fightNight: 980,
    bootCamp: {
      2: 1800,
      4: 2800,
    },
  },
}

const foreignFighterNameKeywords = [
  'Andre',
  'Bruno',
  'Got',
  'Mario',
  'Rafael',
  'Ygor',
  'Alex Morales',
]

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...init.headers,
    },
  })
}

function normalizeCoachName(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/[—－–-]/g, '-')
    .trim()
}

function getCoachPricingTier(coachName) {
  const normalized = normalizeCoachName(coachName).toLowerCase()
  const isForeignFighter = foreignFighterNameKeywords.some((keyword) =>
    normalized.includes(normalizeCoachName(keyword).toLowerCase()),
  )

  return isForeignFighter ? 'foreign-fighter' : 'domestic-teacher'
}

function getPriceAmount(course, packageSize) {
  const tier = getCoachPricingTier(course.coach)
  const prices = coachPricingByTier[tier]

  if (course.category === 'FIGHT_NIGHT') {
    return {
      value: prices.fightNight,
      pricingTier: tier,
    }
  }

  if (course.category === 'BOOT_CAMP' && (packageSize === 2 || packageSize === 4)) {
    return {
      value: prices.bootCamp[packageSize],
      pricingTier: tier,
    }
  }

  throw new Error('Invalid course package')
}

function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getTodayLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getWeekdayLabel(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return WEEKDAY_LABELS[d.getDay()] || ''
}

function getCourseIdParts(courseId) {
  const normalized = String(courseId || '').trim()
  const match = normalized.match(/^(.*)-(\d{4}-\d{2}-\d{2})$/)
  if (!match) return { baseId: normalized, date: null }
  return { baseId: match[1], date: match[2] }
}

function isValidWeeklyOccurrence(baseDate, occurrenceDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurrenceDate)) return false
  if (occurrenceDate < baseDate) return false

  const start = new Date(`${baseDate}T00:00:00`)
  const target = new Date(`${occurrenceDate}T00:00:00`)
  const diffDays = Math.round((target.getTime() - start.getTime()) / 86400000)
  return diffDays % 7 === 0
}

function resolveCourseFromCatalog(submittedCourse) {
  const { baseId, date } = getCourseIdParts(submittedCourse?.id)
  const baseCourse = weeklyCourses.find((course) => course.id === baseId)
  if (!baseCourse) {
    throw new Error('Course is not available for online checkout')
  }

  const courseDate = date || baseCourse.date
  const bookableFromIso = addDays(getTodayLocal(), ONLINE_BOOKING_START_OFFSET_DAYS)
  if (!isValidWeeklyOccurrence(baseCourse.date, courseDate) || courseDate < bookableFromIso) {
    throw new Error('Course date is not available for online checkout')
  }

  if (date === baseCourse.date || !date) return baseCourse

  return {
    ...baseCourse,
    id: `${baseCourse.id}-${date}`,
    date,
    weekday: getWeekdayLabel(date),
  }
}

function getSessionInventoryId(course, date = course.date) {
  if (date === course.date) return course.id
  const dynamicDateSuffix = /-\d{4}-\d{2}-\d{2}$/
  const baseId = course.id.replace(dynamicDateSuffix, '')
  return `${baseId}-${date}`
}

function buildSessionIds(course, packageSize) {
  if (packageSize === 1) {
    return {
      sessionIds: [getSessionInventoryId(course)],
      seriesDates: [course.date],
    }
  }

  const seriesDates = Array.from({ length: packageSize }, (_, index) =>
    addDays(course.date, index * 7),
  )

  return {
    sessionIds: seriesDates.map((date) => getSessionInventoryId(course, date)),
    seriesDates,
  }
}

function getBootCampRoute(course, submittedRoute) {
  if (submittedRoute === 'BOXING' || submittedRoute === 'MUAY_THAI') {
    return submittedRoute
  }

  const name = String(course.name || '')
  if (name.includes('泰拳') || name.includes('踢拳')) return 'MUAY_THAI'
  if (name.includes('拳擊')) return 'BOXING'
  return null
}

function normalizePhone(phone) {
  const cleaned = String(phone || '').replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('0')) return `+886${cleaned.slice(1)}`
  return cleaned
}

function splitName(name) {
  const trimmed = String(name || '').trim()
  if (!trimmed) {
    return { firstName: 'Fight Night', lastName: 'Guest' }
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return { firstName: trimmed.slice(0, 32), lastName: '-' }
  }

  return {
    firstName: parts.slice(0, -1).join(' ').slice(0, 32),
    lastName: parts.at(-1).slice(0, 32),
  }
}

function trimText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function normalizeLineContext(value) {
  if (!value || typeof value !== 'object') return null

  const lineUserId = trimText(value.lineUserId || value.userId, 120)
  if (!lineUserId) return null

  return {
    lineUserId,
    displayName: trimText(value.displayName, 200) || null,
    pictureUrl: trimText(value.pictureUrl, 1200) || null,
    isFriend: value.isFriend === true || value.friendFlag === true,
  }
}

async function fetchLineProfile(accessToken) {
  const response = await fetch('https://api.line.me/v2/profile', {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('LINE profile verification failed')
  }

  return response.json()
}

async function resolveLineContext(value) {
  const submittedContext = normalizeLineContext(value)
  const accessToken = trimText(value?.accessToken, 2000)
  if (!accessToken) return submittedContext

  try {
    const profile = await fetchLineProfile(accessToken)
    const lineUserId = trimText(profile?.userId, 120)
    if (!lineUserId) return submittedContext

    return {
      lineUserId,
      displayName: trimText(profile?.displayName, 200) || submittedContext?.displayName || null,
      pictureUrl: trimText(profile?.pictureUrl, 1200) || submittedContext?.pictureUrl || null,
      isFriend: submittedContext?.isFriend === true,
    }
  } catch {
    return submittedContext
  }
}

function normalizeClientInfo(client, request) {
  const sourceIp =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for') ||
    '127.0.0.1'

  return cleanObject({
    ip: trimText(sourceIp, 32) || '127.0.0.1',
    screenWidth: trimText(client?.screenWidth, 16),
    screenHeight: trimText(client?.screenHeight, 16),
    javaEnabled: trimText(client?.javaEnabled, 16),
    timeZoneOffset: trimText(client?.timeZoneOffset, 16),
    transactionWebSite: trimText(client?.transactionWebSite, 512),
    userAgent: trimText(client?.userAgent, 128),
    language: trimText(client?.language, 32),
    colorDepth: trimText(client?.colorDepth, 16),
    accept: trimText(request.headers.get('accept') || client?.accept, 128),
  })
}

function randomHex(bytes = 8) {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function createReferenceId() {
  return `FN${Date.now().toString(36).toUpperCase()}${randomHex(5).toUpperCase()}`.slice(0, 32)
}

function parsePaymentMethods(env) {
  const raw = String(
    env.SHOPLINE_PAYMENT_METHODS || 'CreditCard,ApplePay,LinePay',
  ).trim()

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function cleanObject(value) {
  if (Array.isArray(value)) {
    const cleaned = value.map(cleanObject).filter((entry) => entry !== undefined)
    return cleaned.length ? cleaned : undefined
  }
  if (value && typeof value === 'object') {
    const cleanedEntries = Object.entries(value)
      .map(([key, entryValue]) => [key, cleanObject(entryValue)])
      .filter(
        ([, entryValue]) =>
          entryValue !== undefined && entryValue !== null && entryValue !== '',
      )

    return cleanedEntries.length ? Object.fromEntries(cleanedEntries) : undefined
  }
  return value
}

async function ensureTables(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS session_inventory (
      session_id TEXT PRIMARY KEY,
      capacity INTEGER NOT NULL DEFAULT 6,
      sold INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      CHECK (capacity >= 0),
      CHECK (sold >= 0),
      CHECK (sold <= capacity)
    )`,
  ).run()
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS course_orders (
      reference_id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      shopline_session_id TEXT,
      shopline_trade_order_id TEXT,
      event_id TEXT,
      course_id TEXT NOT NULL,
      course_name TEXT NOT NULL,
      category TEXT NOT NULL,
      venue_id TEXT NOT NULL,
      venue_name TEXT NOT NULL,
      coach TEXT NOT NULL,
      coach_pricing_tier TEXT NOT NULL,
      route TEXT,
      package_size INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      amount_value INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'TWD',
      session_ids_json TEXT NOT NULL,
      series_dates_json TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      buyer_phone TEXT NOT NULL,
      buyer_email TEXT,
      line_user_id TEXT,
      line_display_name TEXT,
      line_picture_url TEXT,
      line_is_friend INTEGER,
      line_context_json TEXT,
      source_path TEXT,
      return_url TEXT NOT NULL,
      shopline_session_url TEXT,
      raw_request_json TEXT,
      raw_session_json TEXT,
      raw_webhook_json TEXT,
      meta_purchase_event_id TEXT,
      meta_purchase_sent_at TEXT,
      meta_capi_status TEXT,
      meta_capi_response_json TEXT,
      meta_capi_error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      paid_at TEXT
    )`,
  ).run()
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_course_orders_status
     ON course_orders (status, updated_at)`,
  ).run()
  await ensureOrderTrackingColumns(env)
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_course_orders_line_user
     ON course_orders (line_user_id, updated_at)`,
  ).run()
}

async function ensureOrderTrackingColumns(env) {
  const columns = [
    ['meta_purchase_event_id', 'TEXT'],
    ['meta_purchase_sent_at', 'TEXT'],
    ['meta_capi_status', 'TEXT'],
    ['meta_capi_response_json', 'TEXT'],
    ['meta_capi_error', 'TEXT'],
    ['line_user_id', 'TEXT'],
    ['line_display_name', 'TEXT'],
    ['line_picture_url', 'TEXT'],
    ['line_is_friend', 'INTEGER'],
    ['line_context_json', 'TEXT'],
  ]

  for (const [name, type] of columns) {
    try {
      await env.DB.prepare(
        `ALTER TABLE course_orders ADD COLUMN ${name} ${type}`,
      ).run()
    } catch (error) {
      if (!(error instanceof Error) || !/duplicate column/i.test(error.message)) {
        throw error
      }
    }
  }
}

async function upsertLineCustomerFromCheckout(env, lineContext) {
  if (!lineContext?.lineUserId) return

  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS line_customers (
        line_user_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        picture_url TEXT,
        status_message TEXT,
        is_friend INTEGER NOT NULL DEFAULT 0,
        access_count INTEGER NOT NULL DEFAULT 1,
        raw_profile_json TEXT,
        first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_customers_last_seen
       ON line_customers (last_seen_at)`,
    ),
  ])

  await env.DB.prepare(
    `INSERT INTO line_customers (
      line_user_id, display_name, picture_url, status_message, is_friend,
      access_count, raw_profile_json, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, NULL, ?, 1, ?, datetime('now'), datetime('now'))
    ON CONFLICT(line_user_id) DO UPDATE SET
      display_name = COALESCE(excluded.display_name, line_customers.display_name),
      picture_url = COALESCE(excluded.picture_url, line_customers.picture_url),
      is_friend = excluded.is_friend,
      raw_profile_json = COALESCE(excluded.raw_profile_json, line_customers.raw_profile_json),
      last_seen_at = datetime('now')`,
  )
    .bind(
      lineContext.lineUserId,
      lineContext.displayName || 'LINE user',
      lineContext.pictureUrl,
      lineContext.isFriend ? 1 : 0,
      JSON.stringify(lineContext),
    )
    .run()
}

async function ensureInventoryRows(env, sessionIds) {
  for (const sessionId of sessionIds) {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO session_inventory
       (session_id, capacity, sold, updated_at)
       VALUES (?, ?, 0, datetime('now'))`,
    )
      .bind(sessionId, DEFAULT_CAPACITY)
      .run()
  }
}

async function getAvailability(env, sessionIds) {
  const placeholders = sessionIds.map(() => '?').join(',')
  const { results } = await env.DB.prepare(
    `SELECT session_id, capacity, sold
     FROM session_inventory
     WHERE session_id IN (${placeholders})`,
  )
    .bind(...sessionIds)
    .all()

  const rowsById = new Map((results || []).map((row) => [row.session_id, row]))
  return sessionIds.map((sessionId) => {
    const row = rowsById.get(sessionId)
    const capacity = Math.max(0, Number(row?.capacity ?? DEFAULT_CAPACITY))
    const sold = Math.max(0, Number(row?.sold ?? 0))
    return {
      sessionId,
      capacity,
      sold,
      remaining: Math.max(0, capacity - sold),
    }
  })
}

function assertCourse(course) {
  if (!course || typeof course !== 'object') {
    throw new Error('Missing course')
  }
  const required = ['id', 'category', 'venueId', 'venueName', 'name', 'coach', 'date', 'startTime', 'endTime']
  for (const key of required) {
    if (!String(course[key] || '').trim()) throw new Error(`Missing course.${key}`)
  }
  if (!['FIGHT_NIGHT', 'BOOT_CAMP'].includes(course.category)) {
    throw new Error('Invalid course category')
  }
}

function buildShoplinePayload({
  referenceId,
  body,
  buyer,
  course,
  packageSize,
  route,
  seriesDates,
  amountValue,
  returnUrl,
  productUrl,
  env,
  request,
}) {
  const amount = {
    value: amountValue * 100,
    currency: CURRENCY,
  }
  const personalInfo = {
    ...splitName(buyer.name),
    phone: buyer.phone,
    email: buyer.email,
  }
  const shippingAddress = {
    countryCode: 'TW',
    street: `${course.venueName} 現場課程`,
  }
  const productName =
    course.category === 'BOOT_CAMP'
      ? `Boot Camp ${packageSize}堂｜${course.name}`
      : `Fight Night Pass｜${course.name}`

  return cleanObject({
    referenceId,
    mode: 'regular',
    language: env.SHOPLINE_LANGUAGE,
    amount,
    expireTime: Number(env.SHOPLINE_SESSION_EXPIRE_MINUTES || 60),
    returnUrl,
    allowPaymentMethodList: parsePaymentMethods(env),
    paymentMethodOptions: {
      CreditCard: {
        installmentCounts: String(env.SHOPLINE_CREDIT_CARD_INSTALLMENTS || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      },
    },
    order: {
      products: [
        {
          amount,
          quantity: 1,
          id: `${course.id}-${packageSize}`.slice(0, 64),
          name: productName.slice(0, 120),
        },
      ],
      shipping: {
        personalInfo,
        address: shippingAddress,
        shippingMethod: '現場報到',
        carrier: 'UFCGYM TAIWAN',
      },
    },
    customer: {
      referenceCustomerId: `${referenceId}-${buyer.phone}`.slice(0, 32),
      personalInfo,
    },
    client: normalizeClientInfo(body.client, request),
    billing: {
      personalInfo,
      address: shippingAddress,
    },
    additionalData: {
      courseId: course.id,
      packageSize,
      route,
      seriesDates: seriesDates.join(','),
      productUrl,
    },
  })
}

async function createShoplineSession(env, payload, shoplineConfig) {
  const apiBaseUrl =
    env.SHOPLINE_API_BASE_URL || 'https://api.shoplinepayments.com'
  const requestId = `RQ${Date.now().toString(36).toUpperCase()}${randomHex(4).toUpperCase()}`.slice(0, 32)
  const headers = {
    'content-type': 'application/json',
    merchantId: shoplineConfig.merchantId,
    apiKey: shoplineConfig.apiKey,
    requestId,
  }

  const apiVersion = env.SHOPLINE_API_VERSION || 'V1.2'
  if (apiVersion) {
    headers.apiVersion = apiVersion
  }

  const response = await fetch(
    `${apiBaseUrl.replace(/\/$/, '')}/api/v1/trade/sessions/create`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    },
  )
  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.sessionUrl) {
    const code = data?.code || data?.errCode || data?.errorCode || data?.status
    const message =
      data?.msg ||
      data?.message ||
      data?.error ||
      'SHOPLINE session create failed'
    const details = code ? `${message} (${code})` : message
    const error = new Error(details)
    error.shoplineStatus = response.status
    error.shoplineResponse = data
    throw error
  }

  return data
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)

  try {
    const course = resolveCourseFromCatalog(body?.course)
    assertCourse(course)
    const shoplineConfig = getShoplineConfigForVenue(env, course.venueId)

    if (!shoplineConfig.merchantId || !shoplineConfig.apiKey) {
      return json(
        {
          error: `Missing SHOPLINE payment configuration for ${course.venueId}`,
        },
        { status: 503 },
      )
    }

    const packageSize = Math.max(1, Math.min(4, Number(body?.packageSize || 1)))
    if (course.category === 'FIGHT_NIGHT' && packageSize !== 1) {
      throw new Error('Fight Night can only be purchased as one session')
    }
    if (course.category === 'BOOT_CAMP' && ![2, 4].includes(packageSize)) {
      throw new Error('Boot Camp must be purchased as 2 or 4 sessions')
    }

    const buyer = {
      name: String(body?.buyer?.name || '').trim(),
      phone: normalizePhone(body?.buyer?.phone),
      email: String(body?.buyer?.email || '').trim(),
    }
    if (!buyer.name || buyer.phone.length < 8) {
      throw new Error('Missing buyer contact')
    }

    await ensureTables(env)
    const lineContext = await resolveLineContext(body?.lineContext)
    await upsertLineCustomerFromCheckout(env, lineContext)

    const referenceId = createReferenceId()
    const { value: amountValue, pricingTier } = getPriceAmount(course, packageSize)
    const { sessionIds, seriesDates } = buildSessionIds(course, packageSize)
    const availability = await getAvailability(env, sessionIds)
    if (availability.some((record) => record.remaining <= 0)) {
      return json(
        {
          error: 'Selected session is sold out',
          availability,
        },
        { status: 409 },
      )
    }

    const url = new URL(request.url)
    const returnUrl = `${url.origin}/payment/success?referenceId=${encodeURIComponent(referenceId)}`
    const productUrl = `${url.origin}${body?.sourcePath || '/offers'}`
    const route = getBootCampRoute(course, body?.route)
    const shoplinePayload = buildShoplinePayload({
      referenceId,
      body,
      buyer,
      course,
      packageSize,
      route,
      seriesDates,
      amountValue,
      returnUrl,
      productUrl,
      env,
      request,
    })
    const localOrderRequest = {
      shoplinePayload,
      lineContext,
      tracking:
        body?.tracking && typeof body.tracking === 'object' ? body.tracking : {},
      client: shoplinePayload.client,
    }

    await env.DB.prepare(
      `INSERT INTO course_orders (
        reference_id, status, event_id, course_id, course_name, category,
        venue_id, venue_name, coach, coach_pricing_tier, route, package_size,
        quantity, amount_value, currency, session_ids_json, series_dates_json,
        buyer_name, buyer_phone, buyer_email, line_user_id, line_display_name,
        line_picture_url, line_is_friend, line_context_json, source_path,
        return_url, raw_request_json
      ) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        referenceId,
        `purchase.${referenceId}`,
        course.id,
        course.name,
        course.category,
        course.venueId,
        course.venueName,
        course.coach,
        pricingTier,
        route,
        packageSize,
        amountValue,
        CURRENCY,
        JSON.stringify(sessionIds),
        JSON.stringify(seriesDates),
        buyer.name,
        buyer.phone,
        buyer.email || null,
        lineContext?.lineUserId || null,
        lineContext?.displayName || null,
        lineContext?.pictureUrl || null,
        lineContext ? (lineContext.isFriend ? 1 : 0) : null,
        lineContext ? JSON.stringify(lineContext) : null,
        body?.sourcePath || null,
        returnUrl,
        JSON.stringify(localOrderRequest),
      )
      .run()

    await ensureInventoryRows(env, sessionIds)

    let session
    try {
      session = await createShoplineSession(env, shoplinePayload, shoplineConfig)
    } catch (error) {
      await env.DB.prepare(
        `UPDATE course_orders
         SET status = 'session_failed',
             updated_at = datetime('now')
         WHERE reference_id = ?`,
      )
        .bind(referenceId)
        .run()
      throw error
    }

    await env.DB.prepare(
      `UPDATE course_orders
       SET shopline_session_id = ?,
           shopline_session_url = ?,
           raw_session_json = ?,
           updated_at = datetime('now')
       WHERE reference_id = ?`,
    )
      .bind(
        session.sessionId || null,
        session.sessionUrl,
        JSON.stringify(session),
        referenceId,
      )
      .run()

    return json({
      ok: true,
      referenceId,
      sessionId: session.sessionId,
      sessionUrl: session.sessionUrl,
    })
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'SHOPLINE checkout session failed',
        shoplineStatus: error?.shoplineStatus,
        shoplineResponse: error?.shoplineResponse,
      },
      { status: 400 },
    )
  }
}
