import {
  assertCourse,
  ensureTables,
  normalizePhone,
  resolveCourseFromCatalog,
  resolveLineContext,
  upsertLineCustomerFromCheckout,
} from './shopline/checkout-session.js'
import { sendMetaFunnelEvent } from './shopline/meta-capi.js'

const CURRENCY = 'TWD'
const VENUE_PASS_LEAD_STATUS = 'venue_pass_lead'

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

function createVenuePassLeadReferenceId() {
  return `VP${Date.now().toString(36).toUpperCase()}${randomHex(5).toUpperCase()}`.slice(0, 32)
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)

  try {
    const course = resolveCourseFromCatalog(body?.course)
    assertCourse(course)

    const buyer = {
      name: trimText(body?.buyer?.name, 120),
      phone: normalizePhone(body?.buyer?.phone),
      email: normalizeEmail(body?.buyer?.email),
    }
    if (!buyer.name) {
      throw new Error('請填寫姓名。')
    }
    if (!buyer.phone) {
      throw new Error('請填寫有效的手機號碼。')
    }

    await ensureTables(env)

    const lineContext = await resolveLineContext(body?.lineContext, env)
    if (lineContext?.lineUserId) {
      await upsertLineCustomerFromCheckout(env, lineContext)
    }

    const url = new URL(request.url)
    const referenceId = createVenuePassLeadReferenceId()
    const returnUrl = `${url.origin}${body?.sourcePath || '/'}`
    const localOrderRequest = {
      leadIntent: 'venue-pass',
      lineContext,
      tracking:
        body?.tracking && typeof body.tracking === 'object' ? body.tracking : {},
      client: body?.client && typeof body.client === 'object' ? body.client : {},
    }

    await env.DB.prepare(
      `INSERT INTO course_orders (
        reference_id, status, event_id, course_id, course_name, category,
        venue_id, venue_name, coach, coach_pricing_tier, route, package_size,
        quantity, original_amount_value, amount_value, discount_code,
        discount_label, discount_amount_value, currency, session_ids_json, series_dates_json,
        buyer_name, buyer_phone, buyer_email, line_user_id, line_display_name,
        line_picture_url, line_email, line_email_verified, line_is_friend, line_context_json, source_path,
        return_url, raw_request_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, 1, 0, 0, NULL, NULL, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        referenceId,
        VENUE_PASS_LEAD_STATUS,
        `venue_pass_lead.${referenceId}`,
        course.id,
        '場館七日通行',
        'VENUE_PASS',
        course.venueId,
        course.venueName,
        'venue-pass',
        'venue-pass',
        CURRENCY,
        JSON.stringify([]),
        JSON.stringify([]),
        buyer.name,
        buyer.phone,
        buyer.email,
        lineContext?.lineUserId || null,
        lineContext?.displayName || null,
        lineContext?.pictureUrl || null,
        lineContext?.email || null,
        lineContext ? (lineContext.emailVerified ? 1 : 0) : null,
        lineContext ? (lineContext.isFriend ? 1 : 0) : null,
        lineContext ? JSON.stringify(lineContext) : null,
        body?.sourcePath || null,
        returnUrl,
        JSON.stringify(localOrderRequest),
      )
      .run()

    const metaLeadEvent = sendMetaFunnelEvent({
      env,
      request,
      eventName: 'Lead',
      eventId:
        trimText(body?.tracking?.leadEventId, 160) ||
        trimText(body?.tracking?.scheduleEventId, 160) ||
        `lead.${referenceId}`,
      buyer,
      lineContext,
      tracking: localOrderRequest.tracking,
      client: localOrderRequest.client,
      customData: {
        currency: CURRENCY,
        value: 0,
        order_id: referenceId,
        content_name: '場館七日通行',
        content_category: 'VENUE_PASS',
        content_ids: ['venue-seven-day-pass'],
        contents: [
          {
            id: 'venue-seven-day-pass',
            quantity: 1,
            item_price: 0,
          },
        ],
        num_items: 1,
        venue_name: course.venueName,
        source_path: body?.sourcePath || null,
      },
    }).catch((error) => ({
      ok: false,
      status: 'failed',
      error:
        error instanceof Error ? error.message : 'Meta CAPI lead send failed',
    }))

    if (typeof waitUntil === 'function') {
      waitUntil(metaLeadEvent)
    } else {
      await metaLeadEvent
    }

    return json({
      ok: true,
      referenceId,
      status: VENUE_PASS_LEAD_STATUS,
      lead: {
        venueId: course.venueId,
        venueName: course.venueName,
      },
    })
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : '場館七日通行登記失敗，請稍後再試。',
      },
      { status: 400 },
    )
  }
}
