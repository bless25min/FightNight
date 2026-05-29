import {
  assertCourse,
  buildSessionIds,
  ensureInventoryRows,
  ensureTables,
  getAvailability,
  getBasePriceAmount,
  hasPurchasedOrderForLineUser,
  normalizePhone,
  resolveCourseFromCatalog,
  resolveLineContext,
  upsertLineCustomerFromCheckout,
} from './shopline/checkout-session.js'
import { notifyLineFreeTrialReservation } from './shopline/line-notify.js'

const CURRENCY = 'TWD'
const FREE_TRIAL_STATUS = 'free_reserved'
const EXISTING_FREE_TRIAL_STATUSES = ['free_reserved', 'free_attended']

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

function trimText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function normalizeEmail(value) {
  const email = trimText(value, 320).toLowerCase()
  if (!email) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

function randomHex(bytes = 8) {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function createFreeTrialReferenceId() {
  return `FR${Date.now().toString(36).toUpperCase()}${randomHex(5).toUpperCase()}`.slice(0, 32)
}

async function hasExistingFreeTrial(env, lineUserId) {
  if (!lineUserId) return false

  const placeholders = EXISTING_FREE_TRIAL_STATUSES.map(() => '?').join(',')
  const row = await env.DB.prepare(
    `SELECT reference_id
     FROM course_orders
     WHERE line_user_id = ?
       AND status IN (${placeholders})
     LIMIT 1`,
  )
    .bind(lineUserId, ...EXISTING_FREE_TRIAL_STATUSES)
    .first()

  return Boolean(row?.reference_id)
}

async function incrementReservedSeats(env, sessionIds, quantity) {
  const touched = []

  for (const sessionId of sessionIds) {
    const result = await env.DB.prepare(
      `UPDATE session_inventory
       SET sold = sold + ?, updated_at = datetime('now')
       WHERE session_id = ? AND sold + ? <= capacity`,
    )
      .bind(quantity, sessionId, quantity)
      .run()

    if (!result.meta?.changes) {
      await releaseReservedSeats(env, touched, quantity)
      return false
    }

    touched.push(sessionId)
  }

  return true
}

async function releaseReservedSeats(env, sessionIds, quantity) {
  for (const sessionId of sessionIds) {
    await env.DB.prepare(
      `UPDATE session_inventory
       SET sold = MAX(0, sold - ?), updated_at = datetime('now')
       WHERE session_id = ?`,
    )
      .bind(quantity, sessionId)
      .run()
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)

  try {
    const course = resolveCourseFromCatalog(body?.course)
    assertCourse(course)

    if (course.category !== 'FIGHT_NIGHT') {
      throw new Error('免費體驗僅開放 Fight Night 單堂課程。')
    }

    const buyer = {
      name: trimText(body?.buyer?.name, 120),
      phone: normalizePhone(body?.buyer?.phone),
      email: normalizeEmail(body?.buyer?.email),
    }
    if (!buyer.name) {
      throw new Error('請留下姓名。')
    }
    if (!buyer.phone) {
      throw new Error('請輸入有效的台灣手機號碼。')
    }

    await ensureTables(env)

    const lineContext = await resolveLineContext(body?.lineContext, env)
    if (!lineContext?.lineUserId) {
      return json(
        {
          error: '請先完成 LINE 登入後再免費預約。',
          reason: 'line_login_required',
        },
        { status: 401 },
      )
    }

    await upsertLineCustomerFromCheckout(env, lineContext)

    if (await hasPurchasedOrderForLineUser(env, lineContext.lineUserId)) {
      return json(
        {
          error: '這個 LINE 帳號已有付款紀錄，免費體驗保留給第一次線上預約的新朋友。',
          reason: 'already_purchased',
        },
        { status: 409 },
      )
    }

    if (await hasExistingFreeTrial(env, lineContext.lineUserId)) {
      return json(
        {
          error: '你已經保留一堂免費體驗，可以到 LINE 查看預約確認。',
          reason: 'free_trial_already_reserved',
        },
        { status: 409 },
      )
    }

    const { sessionIds, seriesDates } = buildSessionIds(course, 1)
    await ensureInventoryRows(env, sessionIds)

    const availability = await getAvailability(env, sessionIds)
    if (availability.some((record) => record.remaining <= 0)) {
      return json(
        {
          error: '這堂剛剛額滿了，請改選其他場次。',
          reason: 'sold_out',
          availability,
        },
        { status: 409 },
      )
    }

    const remaining = Math.min(...availability.map((record) => record.remaining))
    const basePrice = getBasePriceAmount(course, 1, remaining)
    const referenceId = createFreeTrialReferenceId()
    const quantity = 1

    const reserved = await incrementReservedSeats(env, sessionIds, quantity)
    if (!reserved) {
      return json(
        {
          error: '這堂剛剛額滿了，請改選其他場次。',
          reason: 'sold_out',
          availability: await getAvailability(env, sessionIds),
        },
        { status: 409 },
      )
    }

    const url = new URL(request.url)
    const returnUrl = `${url.origin}${body?.sourcePath || '/offers'}`
    const localOrderRequest = {
      freeTrial: true,
      lineContext,
      tracking:
        body?.tracking && typeof body.tracking === 'object' ? body.tracking : {},
      client: body?.client && typeof body.client === 'object' ? body.client : {},
    }

    try {
      await env.DB.prepare(
        `INSERT INTO course_orders (
          reference_id, status, event_id, course_id, course_name, category,
          venue_id, venue_name, coach, coach_pricing_tier, route, package_size,
          quantity, original_amount_value, amount_value, discount_code,
          discount_label, discount_amount_value, currency, session_ids_json, series_dates_json,
          buyer_name, buyer_phone, buyer_email, line_user_id, line_display_name,
          line_picture_url, line_email, line_email_verified, line_is_friend, line_context_json, source_path,
          return_url, raw_request_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, ?, ?, 0, NULL, NULL, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          referenceId,
          FREE_TRIAL_STATUS,
          `free_reservation.${referenceId}`,
          course.id,
          course.name,
          course.category,
          course.venueId,
          course.venueName,
          course.coach,
          basePrice.pricingTier,
          quantity,
          basePrice.value,
          CURRENCY,
          JSON.stringify(sessionIds),
          JSON.stringify(seriesDates),
          buyer.name,
          buyer.phone,
          buyer.email,
          lineContext.lineUserId,
          lineContext.displayName || null,
          lineContext.pictureUrl || null,
          lineContext.email || null,
          lineContext.emailVerified ? 1 : 0,
          lineContext.isFriend ? 1 : 0,
          JSON.stringify(lineContext),
          body?.sourcePath || null,
          returnUrl,
          JSON.stringify(localOrderRequest),
        )
        .run()
    } catch (error) {
      await releaseReservedSeats(env, sessionIds, quantity)
      throw error
    }

    const lineNotify = await notifyLineFreeTrialReservation(env, referenceId)

    return json({
      ok: true,
      referenceId,
      status: FREE_TRIAL_STATUS,
      lineNotify,
      reservation: {
        courseId: course.id,
        courseName: course.name,
        venueName: course.venueName,
        date: course.date,
        weekday: course.weekday,
        startTime: course.startTime,
        endTime: course.endTime,
        originalAmountValue: basePrice.value,
        currency: CURRENCY,
      },
    })
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : '免費預約建立失敗，請稍後再試。',
      },
      { status: 400 },
    )
  }
}
