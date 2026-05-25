import { getShoplineConfigForVenue } from './config.js'

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

function randomHex(bytes = 8) {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function createRequestId() {
  return `qs${Date.now().toString(36)}${randomHex(6)}`.slice(0, 32)
}

function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase()
}

function getPrimaryPaymentDetail(data) {
  return Array.isArray(data?.paymentDetails) && data.paymentDetails.length > 0
    ? data.paymentDetails[0]
    : null
}

function getProviderAmountValue(data) {
  return Number(data?.amount?.value || data?.order?.amount?.value || 0)
}

function classifyProviderStatus(data, localStatus) {
  const sessionStatus = normalizeStatus(data?.status)
  const paymentDetail = getPrimaryPaymentDetail(data)
  const paymentStatus = normalizeStatus(paymentDetail?.status)
  const hasTradeOrder = Boolean(paymentDetail?.tradeOrderId)
  const hasSuccessTime = Boolean(paymentDetail?.paymentSuccessTime)
  const paidTokens = ['SUCCEEDED', 'SUCCESS', 'PAID', 'CAPTURED', 'SETTLED']
  const failedTokens = ['FAILED', 'FAILURE', 'DECLINED', 'REJECTED']
  const cancelledTokens = ['CANCELLED', 'CANCELED', 'CANCEL']

  if (
    paidTokens.includes(sessionStatus) ||
    paidTokens.includes(paymentStatus) ||
    (hasTradeOrder && hasSuccessTime)
  ) {
    return localStatus === 'paid' ? 'provider_paid_synced' : 'provider_paid_webhook_missing'
  }

  if (sessionStatus === 'EXPIRED') return 'provider_session_expired'
  if (
    failedTokens.includes(sessionStatus) ||
    failedTokens.includes(paymentStatus)
  ) {
    return 'provider_payment_failed'
  }
  if (
    cancelledTokens.includes(sessionStatus) ||
    cancelledTokens.includes(paymentStatus)
  ) {
    return 'provider_payment_cancelled'
  }
  if (sessionStatus === 'CREATED' || sessionStatus === 'PENDING') {
    return 'provider_not_paid'
  }

  return 'provider_unknown'
}

async function queryShoplineSession(env, order) {
  if (!order.shopline_session_id) return null
  if (env.SHOPLINE_STATUS_QUERY_ENABLED === 'false') return null

  const shoplineConfig = getShoplineConfigForVenue(env, order.venue_id)
  if (!shoplineConfig.merchantId || !shoplineConfig.apiKey) {
    return {
      ok: false,
      diagnosis: 'provider_config_missing',
      checkedAt: new Date().toISOString(),
    }
  }

  const apiBaseUrl =
    env.SHOPLINE_API_BASE_URL || 'https://api.shoplinepayments.com'
  const response = await fetch(`${apiBaseUrl}/api/v1/trade/sessions/query`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      merchantId: shoplineConfig.merchantId,
      apiKey: shoplineConfig.apiKey,
      requestId: createRequestId(),
    },
    body: JSON.stringify({ sessionId: order.shopline_session_id }),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok || !data || data.code) {
    return {
      ok: false,
      diagnosis: 'provider_query_failed',
      httpStatus: response.status,
      code: data?.code || null,
      message: data?.msg || data?.message || null,
      checkedAt: new Date().toISOString(),
    }
  }

  const paymentDetail = getPrimaryPaymentDetail(data)
  return {
    ok: true,
    diagnosis: classifyProviderStatus(data, order.status),
    amountValue: getProviderAmountValue(data),
    sessionStatus: data.status || null,
    paymentStatus: paymentDetail?.status || null,
    paymentMethod: paymentDetail?.paymentMethod || null,
    tradeOrderId: paymentDetail?.tradeOrderId || null,
    paymentSuccessTime: paymentDetail?.paymentSuccessTime || null,
    checkedAt: new Date().toISOString(),
  }
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

async function reconcileProviderPaidOrder(env, order, provider) {
  if (!provider || provider.diagnosis !== 'provider_paid_webhook_missing') {
    return null
  }

  const expectedAmount = Number(order.amount_value || 0) * 100
  if (provider.amountValue && provider.amountValue < expectedAmount) {
    await env.DB.prepare(
      `UPDATE course_orders
       SET status = 'payment_amount_mismatch',
           shopline_trade_order_id = COALESCE(?, shopline_trade_order_id),
           updated_at = datetime('now')
       WHERE reference_id = ?
         AND status NOT IN (${LOCKED_PAID_STATUSES.map(() => '?').join(',')})`,
    )
      .bind(provider.tradeOrderId || null, order.reference_id, ...LOCKED_PAID_STATUSES)
      .run()
    return 'payment_amount_mismatch'
  }

  const claim = await env.DB.prepare(
    `UPDATE course_orders
     SET status = 'payment_processing',
         shopline_trade_order_id = COALESCE(?, shopline_trade_order_id),
         updated_at = datetime('now')
     WHERE reference_id = ?
       AND status NOT IN (${LOCKED_PAID_STATUSES.map(() => '?').join(',')})
       AND (
         status != 'payment_processing'
         OR datetime(updated_at) <= datetime('now', '-5 minutes')
       )`,
  )
    .bind(provider.tradeOrderId || null, order.reference_id, ...LOCKED_PAID_STATUSES)
    .run()

  if (!claim.meta?.changes) return null

  const sessionIds = JSON.parse(order.session_ids_json || '[]')
  const quantity = Math.max(1, Math.min(6, Number(order.quantity || 1)))
  await ensureInventoryRows(env, sessionIds)

  const seatsUpdated = await incrementPaidSeats(env, sessionIds, quantity)
  const nextStatus = seatsUpdated ? 'paid' : 'paid_over_capacity'

  await env.DB.prepare(
    `UPDATE course_orders
     SET status = ?,
         shopline_trade_order_id = COALESCE(?, shopline_trade_order_id),
         paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, datetime('now')) ELSE paid_at END,
         updated_at = datetime('now')
     WHERE reference_id = ?`,
  )
    .bind(nextStatus, provider.tradeOrderId || null, nextStatus, order.reference_id)
    .run()

  return nextStatus
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const url = new URL(request.url)
  const referenceId = url.searchParams.get('referenceId')
  if (!referenceId) {
    return json({ error: 'Missing referenceId' }, { status: 400 })
  }

  const order = await env.DB.prepare(
    `SELECT reference_id, status, course_name, category, venue_name, package_size,
            amount_value, currency, series_dates_json, created_at, paid_at,
            venue_id, shopline_session_id, session_ids_json, quantity
     FROM course_orders
     WHERE reference_id = ?`,
  )
    .bind(referenceId)
    .first()

  if (!order) {
    return json({ error: 'Order not found' }, { status: 404 })
  }

  let provider = null
  if (
    ['pending', 'payment_processing', 'session_failed'].includes(order.status) ||
    url.searchParams.get('sync') === '1'
  ) {
    provider = await queryShoplineSession(env, order)
    const reconciledStatus = await reconcileProviderPaidOrder(env, order, provider)
    if (reconciledStatus) {
      order.status = reconciledStatus
      if (reconciledStatus === 'paid') order.paid_at = new Date().toISOString()
    }
  }

  return json({
    order: {
      referenceId: order.reference_id,
      status: order.status,
      courseName: order.course_name,
      category: order.category,
      venueName: order.venue_name,
      packageSize: Number(order.package_size),
      amountValue: Number(order.amount_value),
      currency: order.currency,
      seriesDates: JSON.parse(order.series_dates_json || '[]'),
      createdAt: order.created_at,
      paidAt: order.paid_at,
    },
    provider,
  })
}
