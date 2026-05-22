import { getShoplineConfigForMerchant, getShoplineConfigs } from './config.js'

const DEFAULT_CAPACITY = 6

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
      source_path TEXT,
      return_url TEXT NOT NULL,
      shopline_session_url TEXT,
      raw_request_json TEXT,
      raw_session_json TEXT,
      raw_webhook_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      paid_at TEXT
    )`,
  ).run()
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

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const rawBody = await request.text()
  const verified = await verifyWebhook(request, rawBody, env)
  if (!verified) {
    return json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const referenceId = getReferenceId(event)
  if (!referenceId) {
    return json({ error: 'Missing reference id' }, { status: 400 })
  }

  await ensureTables(env)

  const order = await env.DB.prepare(
    `SELECT reference_id, status, amount_value, session_ids_json, quantity
     FROM course_orders
     WHERE reference_id = ?`,
  )
    .bind(referenceId)
    .first()

  if (!order) {
    return json({ error: 'Order not found' }, { status: 404 })
  }

  if (!isPaidEvent(event)) {
    const nextStatus = mapNonPaidStatus(event)
    if (nextStatus) {
      await markOrderStatus(env, referenceId, nextStatus, event, rawBody)
    }
    return json({ ok: true, status: nextStatus || order.status })
  }

  if (order.status === 'paid') {
    return json({ ok: true, status: 'paid' })
  }

  const paidAmount = getPaidAmountValue(event)
  if (paidAmount && paidAmount < Number(order.amount_value) * 100) {
    await markOrderStatus(env, referenceId, 'payment_amount_mismatch', event, rawBody)
    return json({ ok: true, status: 'payment_amount_mismatch' })
  }

  const sessionIds = JSON.parse(order.session_ids_json || '[]')
  const quantity = Math.max(1, Math.min(6, Number(order.quantity || 1)))
  await ensureInventoryRows(env, sessionIds)

  const seatsUpdated = await incrementPaidSeats(env, sessionIds, quantity)
  if (!seatsUpdated) {
    await markOrderStatus(env, referenceId, 'paid_over_capacity', event, rawBody)
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

  return json({ ok: true, status: 'paid' })
}
