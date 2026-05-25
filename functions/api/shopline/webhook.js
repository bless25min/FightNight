import { getShoplineConfigForMerchant, getShoplineConfigs } from './config.js'
import {
  ensureLineNotificationColumns,
  notifyLinePaymentSuccess,
} from './line-notify.js'
import { sendMetaPurchaseEvent } from './meta-capi.js'

const DEFAULT_CAPACITY = 6
const LOCKED_PAID_STATUSES = [
  'paid',
  'payment_amount_mismatch',
  'paid_over_capacity',
  'refund_processing',
  'refunded',
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

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

function timingSafeEqual(a, b) {
  const left = String(a || '').replace(/^sha256=/i, '').toLowerCase()
  const right = String(b || '').replace(/^sha256=/i, '').toLowerCase()
  if (left.length !== right.length) return false

  let mismatch = 0
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i)
  }
  return mismatch === 0
}

async function hmacSha256Hex(payload, secret) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return toHex(signature)
}

async function sha256Hex(payload) {
  const data = new TextEncoder().encode(String(payload || ''))
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(digest)
}

async function verifyWebhook(request, rawBody, env) {
  const timestamp = request.headers.get('timestamp')
  const sign = request.headers.get('sign')
  if (!timestamp || !sign) return false

  const toleranceMs = Number(env.SHOPLINE_WEBHOOK_TOLERANCE_MS || 15 * 60 * 1000)
  if (toleranceMs > 0) {
    const age = Math.abs(Date.now() - Number(timestamp))
    if (!Number.isFinite(age) || age > toleranceMs) return false
  }

  const merchantId = request.headers.get('merchantId')
  const merchantConfig = getShoplineConfigForMerchant(env, merchantId)
  const configs = merchantConfig ? [merchantConfig] : getShoplineConfigs(env)

  for (const config of configs) {
    if (!config.signKey) continue
    const expected = await hmacSha256Hex(`${timestamp}.${rawBody}`, config.signKey)
    if (timingSafeEqual(sign, expected)) return true
  }

  return false
}

async function ensureWebhookAttemptTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS shopline_webhook_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id TEXT,
      has_timestamp INTEGER NOT NULL DEFAULT 0,
      has_sign INTEGER NOT NULL DEFAULT 0,
      body_size INTEGER NOT NULL DEFAULT 0,
      body_sha256 TEXT,
      event_type TEXT,
      event_status TEXT,
      reference_id TEXT,
      session_id TEXT,
      trade_order_id TEXT,
      verification_status TEXT NOT NULL DEFAULT 'received',
      response_status INTEGER,
      error_code TEXT,
      processed_status TEXT,
      cf_ray TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  ).run()
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_shopline_webhook_attempts_created
     ON shopline_webhook_attempts (created_at)`,
  ).run()
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_shopline_webhook_attempts_reference
     ON shopline_webhook_attempts (reference_id, created_at)`,
  ).run()
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
      line_payment_notify_status TEXT,
      line_payment_notify_attempted_at TEXT,
      line_payment_notified_at TEXT,
      line_payment_notify_response_json TEXT,
      line_payment_notify_error TEXT,
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
  await ensureOrderTrackingColumns(env)
  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_course_orders_line_user
     ON course_orders (line_user_id, updated_at)`,
  ).run()
  await ensureLineNotificationColumns(env)
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

async function createWebhookAttempt(env, request, rawBody, event) {
  try {
    await ensureWebhookAttemptTable(env)
    const result = await env.DB.prepare(
      `INSERT INTO shopline_webhook_attempts (
        merchant_id, has_timestamp, has_sign, body_size, body_sha256,
        event_type, event_status, reference_id, session_id, trade_order_id,
        cf_ray, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        request.headers.get('merchantId') || null,
        request.headers.has('timestamp') ? 1 : 0,
        request.headers.has('sign') ? 1 : 0,
        new TextEncoder().encode(rawBody).byteLength,
        await sha256Hex(rawBody),
        event?.type || null,
        event?.data?.status || null,
        event ? getReferenceId(event) : null,
        event ? getSessionId(event) : null,
        event ? getTradeOrderId(event) : null,
        request.headers.get('cf-ray') || null,
        String(request.headers.get('user-agent') || '').slice(0, 500) || null,
      )
      .run()
    return result.meta?.last_row_id || null
  } catch {
    return null
  }
}

async function finishWebhookAttempt(
  env,
  attemptId,
  { verificationStatus, responseStatus, errorCode, processedStatus },
) {
  if (!attemptId) return
  try {
    await env.DB.prepare(
      `UPDATE shopline_webhook_attempts
       SET verification_status = COALESCE(?, verification_status),
           response_status = COALESCE(?, response_status),
           error_code = COALESCE(?, error_code),
           processed_status = COALESCE(?, processed_status),
           updated_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(
        verificationStatus || null,
        responseStatus || null,
        errorCode || null,
        processedStatus || null,
        attemptId,
      )
      .run()
  } catch {
    // Diagnostic writes should never block payment webhook handling.
  }
}

function getReferenceId(event) {
  const data = event?.data || {}
  return (
    data.referenceId ||
    data.referenceOrderId ||
    data.order?.referenceOrderId ||
    data.order?.referenceId ||
    null
  )
}

function getTradeOrderId(event) {
  const data = event?.data || {}
  return (
    data.tradeOrderId ||
    data.paymentDetails?.[0]?.tradeOrderId ||
    data.order?.tradeOrderId ||
    null
  )
}

function getSessionId(event) {
  return event?.data?.sessionId || null
}

function getPaidAmountValue(event) {
  const data = event?.data || {}
  return Number(
    data.amount?.value ||
      data.order?.amount?.value ||
      data.payment?.paidAmount?.value ||
      0,
  )
}

function isPaidEvent(event) {
  const status = String(event?.data?.status || '').toUpperCase()
  return event?.type === 'session.succeeded' || event?.type === 'trade.succeeded' || status === 'SUCCEEDED'
}

function isRefundSucceededEvent(event) {
  const type = String(event?.type || '').toLowerCase()
  const status = String(event?.data?.status || '').toUpperCase()
  return (
    type === 'refund.succeeded' ||
    type === 'trade.refund.succeeded' ||
    (type.includes('refund') && status === 'SUCCEEDED')
  )
}

function isPaidCancellationRefundEvent(event, order) {
  if (!['paid', 'refund_processing'].includes(order?.status)) return false

  const type = String(event?.type || '').toLowerCase()
  const status = String(event?.data?.status || '').toUpperCase()
  const refundLikeTypes = ['trade.cancelled', 'trade.canceled', 'trade.voided', 'trade.reversed']
  const refundLikeStatuses = ['CANCELLED', 'CANCELED', 'VOIDED', 'REVERSED', 'REFUNDED']

  return (
    refundLikeTypes.includes(type) ||
    type.includes('void') ||
    type.includes('reverse') ||
    refundLikeStatuses.includes(status)
  )
}

function getRefundAmountValue(event) {
  const data = event?.data || {}
  return Number(
    data.refundAmount?.value ||
      data.refundedAmount?.value ||
      data.totalRefundAmount?.value ||
      data.amount?.value ||
      0,
  )
}

function mapNonPaidStatus(event) {
  if (event?.type === 'session.expired' || event?.type === 'trade.expired') {
    return 'expired'
  }
  if (event?.type === 'trade.failed') return 'failed'
  if (event?.type === 'trade.cancelled') return 'cancelled'
  if (event?.type === 'session.pending' || event?.type === 'trade.processing') {
    return 'pending'
  }
  return null
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

async function markOrderStatus(env, referenceId, status, event, rawBody) {
  await env.DB.prepare(
    `UPDATE course_orders
     SET status = ?,
         shopline_session_id = COALESCE(?, shopline_session_id),
         shopline_trade_order_id = COALESCE(?, shopline_trade_order_id),
         raw_webhook_json = ?,
         updated_at = datetime('now')
     WHERE reference_id = ?`,
  )
    .bind(
      status,
      getSessionId(event),
      getTradeOrderId(event),
      rawBody,
      referenceId,
    )
    .run()
}

async function recordMetaCapiResult(env, referenceId, result) {
  const status = String(result?.status || 'unknown').slice(0, 40)
  const responseJson = result?.response
    ? JSON.stringify(result.response).slice(0, 8000)
    : null
  const error = result?.error ? String(result.error).slice(0, 1000) : null

  await env.DB.prepare(
    `UPDATE course_orders
     SET meta_purchase_event_id = COALESCE(?, meta_purchase_event_id),
         meta_purchase_sent_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE meta_purchase_sent_at END,
         meta_capi_status = ?,
         meta_capi_response_json = ?,
         meta_capi_error = ?,
         updated_at = datetime('now')
     WHERE reference_id = ?`,
  )
    .bind(
      result?.eventId || null,
      status,
      status,
      responseJson,
      error,
      referenceId,
    )
    .run()
}

async function markNonPaidStatus(env, referenceId, status, event, rawBody) {
  await env.DB.prepare(
    `UPDATE course_orders
     SET status = ?,
         shopline_session_id = COALESCE(?, shopline_session_id),
         shopline_trade_order_id = COALESCE(?, shopline_trade_order_id),
         raw_webhook_json = ?,
         updated_at = datetime('now')
     WHERE reference_id = ?
       AND status NOT IN ('paid', 'payment_processing', 'payment_amount_mismatch', 'paid_over_capacity', 'refund_processing', 'refunded')`,
  )
    .bind(
      status,
      getSessionId(event),
      getTradeOrderId(event),
      rawBody,
      referenceId,
    )
    .run()
}

async function claimOrderForPayment(env, referenceId, event, rawBody) {
  const result = await env.DB.prepare(
    `UPDATE course_orders
     SET status = 'payment_processing',
         shopline_session_id = COALESCE(?, shopline_session_id),
         shopline_trade_order_id = COALESCE(?, shopline_trade_order_id),
         raw_webhook_json = ?,
         updated_at = datetime('now')
     WHERE reference_id = ?
       AND status NOT IN ('paid', 'payment_amount_mismatch', 'paid_over_capacity', 'refund_processing', 'refunded')
       AND (
         status != 'payment_processing'
         OR datetime(updated_at) <= datetime('now', '-5 minutes')
       )`,
  )
    .bind(
      getSessionId(event),
      getTradeOrderId(event),
      rawBody,
      referenceId,
    )
    .run()

  return Boolean(result.meta?.changes)
}

async function claimOrderForRefund(env, referenceId, event, rawBody) {
  const result = await env.DB.prepare(
    `UPDATE course_orders
     SET status = 'refund_processing',
         shopline_session_id = COALESCE(?, shopline_session_id),
         shopline_trade_order_id = COALESCE(?, shopline_trade_order_id),
         raw_webhook_json = ?,
         updated_at = datetime('now')
     WHERE reference_id = ?
       AND status = 'paid'`,
  )
    .bind(
      getSessionId(event),
      getTradeOrderId(event),
      rawBody,
      referenceId,
    )
    .run()

  return Boolean(result.meta?.changes)
}

async function incrementPaidSeats(env, sessionIds, quantity) {
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
      for (const touchedSessionId of touched) {
        await env.DB.prepare(
          `UPDATE session_inventory
           SET sold = MAX(0, sold - ?), updated_at = datetime('now')
           WHERE session_id = ?`,
        )
          .bind(quantity, touchedSessionId)
          .run()
      }
      return false
    }

    touched.push(sessionId)
  }

  return true
}

async function releasePaidSeats(env, sessionIds, quantity) {
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

  const rawBody = await request.text()
  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    event = null
  }
  const attemptId = await createWebhookAttempt(env, request, rawBody, event)

  const verified = await verifyWebhook(request, rawBody, env)
  if (!verified) {
    await finishWebhookAttempt(env, attemptId, {
      verificationStatus: 'invalid_signature',
      responseStatus: 401,
      errorCode: 'invalid_signature',
    })
    return json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  if (!event) {
    await finishWebhookAttempt(env, attemptId, {
      verificationStatus: 'verified',
      responseStatus: 400,
      errorCode: 'invalid_json',
    })
    return json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const referenceId = getReferenceId(event)
  if (!referenceId) {
    await finishWebhookAttempt(env, attemptId, {
      verificationStatus: 'verified',
      responseStatus: 400,
      errorCode: 'missing_reference',
    })
    return json({ error: 'Missing reference id' }, { status: 400 })
  }

  await ensureTables(env)

  const order = await env.DB.prepare(
    `SELECT reference_id, status, event_id, course_id, course_name, category,
            venue_id, venue_name, package_size, quantity, amount_value, currency,
            session_ids_json, buyer_phone, buyer_email, source_path, return_url,
            raw_request_json
     FROM course_orders
     WHERE reference_id = ?`,
  )
    .bind(referenceId)
    .first()

  if (!order) {
    await finishWebhookAttempt(env, attemptId, {
      verificationStatus: 'verified',
      responseStatus: 404,
      errorCode: 'order_not_found',
    })
    return json({ error: 'Order not found' }, { status: 404 })
  }

  if (isRefundSucceededEvent(event) || isPaidCancellationRefundEvent(event, order)) {
    if (order.status === 'refunded') {
      await finishWebhookAttempt(env, attemptId, {
        verificationStatus: 'verified',
        responseStatus: 200,
        processedStatus: 'refunded',
      })
      return json({ ok: true, status: 'refunded' })
    }

    const refundAmount = getRefundAmountValue(event)
    const isFullRefund =
      !refundAmount || refundAmount >= Number(order.amount_value) * 100

    if (!isFullRefund) {
      await finishWebhookAttempt(env, attemptId, {
        verificationStatus: 'verified',
        responseStatus: 200,
        processedStatus: order.status,
        errorCode: 'partial_refund_ignored',
      })
      return json({ ok: true, status: order.status, refund: 'partial' })
    }

    const sessionIds = JSON.parse(order.session_ids_json || '[]')
    const quantity = Math.max(1, Math.min(6, Number(order.quantity || 1)))

    if (order.status === 'paid') {
      const claimed = await claimOrderForRefund(env, referenceId, event, rawBody)
      if (!claimed) {
        const currentOrder = await env.DB.prepare(
          `SELECT status
           FROM course_orders
           WHERE reference_id = ?`,
        )
          .bind(referenceId)
          .first()

        const status = currentOrder?.status || order.status
        await finishWebhookAttempt(env, attemptId, {
          verificationStatus: 'verified',
          responseStatus: 200,
          processedStatus: status,
        })
        return json({ ok: true, status })
      }

      await releasePaidSeats(env, sessionIds, quantity)
    }

    await markOrderStatus(env, referenceId, 'refunded', event, rawBody)
    await finishWebhookAttempt(env, attemptId, {
      verificationStatus: 'verified',
      responseStatus: 200,
      processedStatus: 'refunded',
    })
    return json({ ok: true, status: 'refunded' })
  }

  if (!isPaidEvent(event)) {
    if (
      LOCKED_PAID_STATUSES.includes(order.status) ||
      order.status === 'payment_processing'
    ) {
      if (order.status === 'paid') {
        await notifyLinePaymentSuccess(env, referenceId)
      }
      await finishWebhookAttempt(env, attemptId, {
        verificationStatus: 'verified',
        responseStatus: 200,
        processedStatus: order.status,
      })
      return json({ ok: true, status: order.status })
    }

    const nextStatus = mapNonPaidStatus(event)
    if (nextStatus) {
      await markNonPaidStatus(env, referenceId, nextStatus, event, rawBody)
    }
    await finishWebhookAttempt(env, attemptId, {
      verificationStatus: 'verified',
      responseStatus: 200,
      processedStatus: nextStatus || order.status,
    })
    return json({ ok: true, status: nextStatus || order.status })
  }

  if (LOCKED_PAID_STATUSES.includes(order.status)) {
    if (order.status === 'paid') {
      await notifyLinePaymentSuccess(env, referenceId)
    }
    await finishWebhookAttempt(env, attemptId, {
      verificationStatus: 'verified',
      responseStatus: 200,
      processedStatus: order.status,
    })
    return json({ ok: true, status: order.status })
  }

  const paidAmount = getPaidAmountValue(event)
  if (paidAmount && paidAmount < Number(order.amount_value) * 100) {
    await markOrderStatus(env, referenceId, 'payment_amount_mismatch', event, rawBody)
    await finishWebhookAttempt(env, attemptId, {
      verificationStatus: 'verified',
      responseStatus: 200,
      processedStatus: 'payment_amount_mismatch',
    })
    return json({ ok: true, status: 'payment_amount_mismatch' })
  }

  const claimed = await claimOrderForPayment(env, referenceId, event, rawBody)
  if (!claimed) {
    const currentOrder = await env.DB.prepare(
      `SELECT status
       FROM course_orders
       WHERE reference_id = ?`,
    )
      .bind(referenceId)
      .first()

    const status = currentOrder?.status || order.status
    await finishWebhookAttempt(env, attemptId, {
      verificationStatus: 'verified',
      responseStatus: 200,
      processedStatus: status,
    })
    return json({ ok: true, status })
  }

  const sessionIds = JSON.parse(order.session_ids_json || '[]')
  const quantity = Math.max(1, Math.min(6, Number(order.quantity || 1)))
  await ensureInventoryRows(env, sessionIds)

  const seatsUpdated = await incrementPaidSeats(env, sessionIds, quantity)
  if (!seatsUpdated) {
    await markOrderStatus(env, referenceId, 'paid_over_capacity', event, rawBody)
    await finishWebhookAttempt(env, attemptId, {
      verificationStatus: 'verified',
      responseStatus: 200,
      processedStatus: 'paid_over_capacity',
    })
    return json({ ok: true, status: 'paid_over_capacity' })
  }

  await env.DB.prepare(
    `UPDATE course_orders
     SET status = 'paid',
         shopline_session_id = COALESCE(?, shopline_session_id),
         shopline_trade_order_id = COALESCE(?, shopline_trade_order_id),
         raw_webhook_json = ?,
         paid_at = datetime('now'),
         updated_at = datetime('now')
     WHERE reference_id = ?`,
  )
    .bind(
      getSessionId(event),
      getTradeOrderId(event),
      rawBody,
      referenceId,
    )
    .run()

  try {
    const metaResult = await sendMetaPurchaseEvent({
      env,
      request,
      order: {
        ...order,
        status: 'paid',
      },
    })
    await recordMetaCapiResult(env, referenceId, metaResult)
  } catch (error) {
    await recordMetaCapiResult(env, referenceId, {
      status: 'exception',
      eventId: order.event_id || `purchase.${referenceId}`,
      ok: false,
      skipped: false,
      error:
        error instanceof Error
          ? error.message
          : 'Meta CAPI purchase send failed',
    })
  }

  await notifyLinePaymentSuccess(env, referenceId)

  await finishWebhookAttempt(env, attemptId, {
    verificationStatus: 'verified',
    responseStatus: 200,
    processedStatus: 'paid',
  })
  return json({ ok: true, status: 'paid' })
}
