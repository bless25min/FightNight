import { getShoplineConfigForVenue } from './config.js'
import { notifyLinePaymentSuccess } from './line-notify.js'
import { sendMetaPurchaseEvent } from './meta-capi.js'

const DEFAULT_CAPACITY = 6
const LOCKED_PAID_STATUSES = [
  'paid',
  'payment_amount_mismatch',
  'paid_over_capacity',
  'refund_processing',
  'refunded',
]

export const RECONCILABLE_STATUSES = [
  'pending',
  'payment_processing',
  'session_failed',
]
const REFUND_RECONCILABLE_STATUSES = ['paid', 'refund_processing']

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

function unwrapResponseData(data) {
  return data?.data && typeof data.data === 'object' ? data.data : data
}

function getRefundDetails(data) {
  const body = unwrapResponseData(data)
  const paymentDetail = getPrimaryPaymentDetail(body)
  const lists = [
    body?.refundDetails,
    body?.refunds,
    body?.refundResponses,
    body?.refund_responses,
    body?.paymentData?.refundResponses,
    body?.payment_data?.refund_responses,
    paymentDetail?.refundDetails,
    paymentDetail?.refunds,
    paymentDetail?.refundResponses,
  ]

  return lists.flatMap((list) => (Array.isArray(list) ? list : []))
}

function getProviderAmountValue(data) {
  const body = unwrapResponseData(data)
  return Number(body?.amount?.value || body?.order?.amount?.value || 0)
}

function getProviderRefundAmountValue(data) {
  const body = unwrapResponseData(data)
  const paymentDetail = getPrimaryPaymentDetail(body)
  const directAmount = Number(
    body?.refundAmount?.value ||
      body?.refundedAmount?.value ||
      body?.totalRefundAmount?.value ||
      paymentDetail?.refundAmount?.value ||
      paymentDetail?.refundedAmount?.value ||
      0,
  )
  if (directAmount) return directAmount

  return getRefundDetails(body).reduce((total, refund) => {
    const normalized = normalizeStatus(refund?.status || refund?.refundStatus)
    const failed = ['FAILED', 'FAILURE', 'REJECTED', 'DECLINED'].some((token) =>
      normalized.includes(token),
    )
    if (failed) return total
    return total + Number(refund?.amount?.value || refund?.refundAmount?.value || 0)
  }, 0)
}

function hasRefundStatus(data) {
  const body = unwrapResponseData(data)
  const paymentDetail = getPrimaryPaymentDetail(body)
  const values = [
    body?.status,
    body?.refundStatus,
    body?.tradeStatus,
    body?.paymentStatus,
    paymentDetail?.status,
    paymentDetail?.refundStatus,
    paymentDetail?.tradeStatus,
    paymentDetail?.paymentStatus,
    ...getRefundDetails(body).flatMap((refund) => [
      refund?.status,
      refund?.refundStatus,
      refund?.tradeStatus,
      refund?.paymentStatus,
    ]),
  ]
  const refundTokens = ['REFUND', 'REFUNDED', 'REVERSED', 'VOIDED']
  const successTokens = ['SUCCEEDED', 'SUCCESS', 'COMPLETED', 'DONE', 'REFUNDED']
  const failedTokens = ['FAILED', 'FAILURE', 'REJECTED', 'DECLINED']
  const inProgressTokens = ['PENDING', 'PROCESSING', 'REFUNDING']

  return values.some((value) => {
    const normalized = normalizeStatus(value)
    if (!normalized) return false
    if (failedTokens.some((token) => normalized.includes(token))) return false
    if (
      inProgressTokens.some((token) => normalized.includes(token)) &&
      !successTokens.some((token) => normalized.includes(token))
    ) {
      return false
    }
    if (normalized === 'REFUNDED') return true
    return (
      refundTokens.some((token) => normalized.includes(token)) &&
      (successTokens.some((token) => normalized.includes(token)) ||
        !normalized.includes('PENDING'))
    )
  })
}

function hasPartialRefundStatus(data) {
  const body = unwrapResponseData(data)
  const paymentDetail = getPrimaryPaymentDetail(body)
  const values = [
    body?.status,
    body?.refundStatus,
    body?.tradeStatus,
    body?.paymentStatus,
    paymentDetail?.status,
    paymentDetail?.refundStatus,
    paymentDetail?.tradeStatus,
    paymentDetail?.paymentStatus,
    ...getRefundDetails(body).flatMap((refund) => [
      refund?.status,
      refund?.refundStatus,
      refund?.tradeStatus,
      refund?.paymentStatus,
    ]),
  ]

  return values.some((value) => {
    const normalized = normalizeStatus(value)
    return normalized.includes('PARTIAL') && normalized.includes('REFUND')
  })
}

function classifyProviderStatus(data, localStatus) {
  const body = unwrapResponseData(data)
  const sessionStatus = normalizeStatus(body?.status)
  const paymentDetail = getPrimaryPaymentDetail(body)
  const paymentStatus = normalizeStatus(paymentDetail?.status)
  const hasTradeOrder = Boolean(paymentDetail?.tradeOrderId)
  const hasSuccessTime = Boolean(paymentDetail?.paymentSuccessTime)
  const paidTokens = ['SUCCEEDED', 'SUCCESS', 'PAID', 'CAPTURED', 'SETTLED']
  const failedTokens = ['FAILED', 'FAILURE', 'DECLINED', 'REJECTED']
  const cancelledTokens = ['CANCELLED', 'CANCELED', 'CANCEL']
  const refundAmountValue = getProviderRefundAmountValue(data)

  if (hasRefundStatus(data)) {
    return hasPartialRefundStatus(data)
      ? 'provider_partially_refunded'
      : 'provider_refunded'
  }

  if (
    paidTokens.includes(sessionStatus) ||
    paidTokens.includes(paymentStatus) ||
    (hasTradeOrder && hasSuccessTime)
  ) {
    return localStatus === 'paid'
      ? 'provider_paid_synced'
      : 'provider_paid_webhook_missing'
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
    if (localStatus === 'paid' || localStatus === 'refund_processing') {
      return 'provider_paid_cancelled'
    }
    return 'provider_payment_cancelled'
  }
  if (sessionStatus === 'CREATED' || sessionStatus === 'PENDING') {
    return 'provider_not_paid'
  }

  return 'provider_unknown'
}

function providerTerminalStatus(provider) {
  if (provider?.diagnosis === 'provider_session_expired') return 'expired'
  if (provider?.diagnosis === 'provider_payment_failed') return 'failed'
  if (provider?.diagnosis === 'provider_payment_cancelled') return 'cancelled'
  return null
}

async function queryShoplinePayment(env, order, tradeOrderId) {
  if (!tradeOrderId) return null

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
  const response = await fetch(`${apiBaseUrl}/api/v1/trade/payment/get`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      merchantId: shoplineConfig.merchantId,
      apiKey: shoplineConfig.apiKey,
      requestId: createRequestId(),
    },
    body: JSON.stringify({ tradeOrderId }),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok || !data || data.code) {
    return {
      ok: false,
      diagnosis: 'provider_payment_query_failed',
      httpStatus: response.status,
      code: data?.code || null,
      message: data?.msg || data?.message || null,
      checkedAt: new Date().toISOString(),
    }
  }

  const body = unwrapResponseData(data)
  const paymentDetail = getPrimaryPaymentDetail(body)
  return {
    ok: true,
    diagnosis: classifyProviderStatus(body, order.status),
    amountValue: getProviderAmountValue(body),
    refundAmountValue: getProviderRefundAmountValue(body),
    status: body?.status || null,
    refundStatus: body?.refundStatus || null,
    paymentStatus: paymentDetail?.status || body?.paymentStatus || null,
    tradeOrderId: body?.tradeOrderId || paymentDetail?.tradeOrderId || tradeOrderId,
    paymentSuccessTime:
      body?.paymentSuccessTime || paymentDetail?.paymentSuccessTime || null,
    refundDetailsCount: getRefundDetails(body).length,
    checkedAt: new Date().toISOString(),
  }
}

function mergeSessionAndPaymentProvider(sessionProvider, paymentProvider) {
  if (!paymentProvider) return sessionProvider
  if (!sessionProvider?.ok) return { ...paymentProvider, paymentQuery: paymentProvider }

  const paymentDiagnosis = paymentProvider.diagnosis
  const shouldPreferPayment =
    paymentDiagnosis === 'provider_refunded' ||
    paymentDiagnosis === 'provider_partially_refunded' ||
    paymentDiagnosis === 'provider_paid_cancelled'

  return {
    ...sessionProvider,
    diagnosis: shouldPreferPayment ? paymentDiagnosis : sessionProvider.diagnosis,
    refundAmountValue:
      paymentProvider.refundAmountValue || sessionProvider.refundAmountValue,
    tradeOrderId: paymentProvider.tradeOrderId || sessionProvider.tradeOrderId,
    paymentQuery: paymentProvider,
  }
}

export async function queryShoplineSession(env, order) {
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
  const sessionProvider = {
    ok: true,
    diagnosis: classifyProviderStatus(data, order.status),
    amountValue: getProviderAmountValue(data),
    refundAmountValue: getProviderRefundAmountValue(data),
    sessionStatus: data.status || null,
    paymentStatus: paymentDetail?.status || null,
    paymentMethod: paymentDetail?.paymentMethod || null,
    tradeOrderId: paymentDetail?.tradeOrderId || null,
    paymentSuccessTime: paymentDetail?.paymentSuccessTime || null,
    checkedAt: new Date().toISOString(),
  }
  const paymentProvider = await queryShoplinePayment(
    env,
    order,
    sessionProvider.tradeOrderId || order.shopline_trade_order_id,
  )

  return mergeSessionAndPaymentProvider(sessionProvider, paymentProvider)
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

async function getOrderForMetaPurchase(env, referenceId) {
  return env.DB.prepare(
    `SELECT reference_id, status, event_id, course_id, course_name, category,
            package_size, quantity, amount_value, currency, buyer_phone,
            buyer_email, source_path, return_url, raw_request_json,
            meta_purchase_event_id, meta_purchase_sent_at, meta_capi_status
     FROM course_orders
     WHERE reference_id = ?
     LIMIT 1`,
  )
    .bind(referenceId)
    .first()
}

async function claimMetaPurchaseSend(env, referenceId) {
  const result = await env.DB.prepare(
    `UPDATE course_orders
     SET meta_capi_status = 'sending',
         meta_capi_error = NULL,
         updated_at = datetime('now')
     WHERE reference_id = ?
       AND status = 'paid'
       AND meta_purchase_sent_at IS NULL
       AND COALESCE(meta_capi_status, '') != 'sent'
       AND (
         COALESCE(meta_capi_status, '') != 'sending'
         OR datetime(updated_at) <= datetime('now', '-5 minutes')
       )`,
  )
    .bind(referenceId)
    .run()

  return Boolean(result.meta?.changes)
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

async function sendMetaPurchaseForPaidOrder(env, request, referenceId) {
  if (!request) return null

  const order = await getOrderForMetaPurchase(env, referenceId)
  if (!order || order.status !== 'paid') return null
  if (order.meta_purchase_sent_at || order.meta_capi_status === 'sent') {
    return { status: 'already_sent' }
  }

  const claimed = await claimMetaPurchaseSend(env, referenceId)
  if (!claimed) return { status: 'already_claimed' }

  try {
    const result = await sendMetaPurchaseEvent({ env, request, order })
    await recordMetaCapiResult(env, referenceId, result)
    return result
  } catch (error) {
    const result = {
      status: 'exception',
      eventId: order.event_id || `purchase.${referenceId}`,
      ok: false,
      skipped: false,
      error:
        error instanceof Error
          ? error.message
          : 'Meta CAPI purchase send failed',
    }
    await recordMetaCapiResult(env, referenceId, result)
    return result
  }
}

async function markProviderTerminalStatus(env, order, provider) {
  const nextStatus = providerTerminalStatus(provider)
  if (!nextStatus) return null

  const result = await env.DB.prepare(
    `UPDATE course_orders
     SET status = ?,
         shopline_trade_order_id = COALESCE(?, shopline_trade_order_id),
         updated_at = datetime('now')
     WHERE reference_id = ?
       AND status NOT IN (${LOCKED_PAID_STATUSES.map(() => '?').join(',')})`,
  )
    .bind(nextStatus, provider.tradeOrderId || null, order.reference_id, ...LOCKED_PAID_STATUSES)
    .run()

  return result.meta?.changes ? nextStatus : null
}

async function reconcileRefundedOrder(env, order, provider) {
  if (
    provider?.diagnosis !== 'provider_refunded' &&
    provider?.diagnosis !== 'provider_paid_cancelled'
  ) {
    return null
  }
  if (order.status === 'refunded') return null

  const expectedAmount = Number(order.amount_value || 0) * 100
  if (
    provider.refundAmountValue &&
    expectedAmount &&
    provider.refundAmountValue < expectedAmount
  ) {
    return null
  }

  const sessionIds = JSON.parse(order.session_ids_json || '[]')
  const quantity = Math.max(1, Math.min(6, Number(order.quantity || 1)))
  await ensureInventoryRows(env, sessionIds)

  const claim = await env.DB.prepare(
    `UPDATE course_orders
     SET status = 'refund_processing',
         shopline_trade_order_id = COALESCE(?, shopline_trade_order_id),
         updated_at = datetime('now')
     WHERE reference_id = ?
       AND status = 'paid'`,
  )
    .bind(provider.tradeOrderId || null, order.reference_id)
    .run()

  if (claim.meta?.changes) {
    await releasePaidSeats(env, sessionIds, quantity)
  }

  const result = await env.DB.prepare(
    `UPDATE course_orders
     SET status = 'refunded',
         shopline_trade_order_id = COALESCE(?, shopline_trade_order_id),
         updated_at = datetime('now')
     WHERE reference_id = ?
       AND status IN ('paid', 'refund_processing')`,
  )
    .bind(provider.tradeOrderId || null, order.reference_id)
    .run()

  return result.meta?.changes ? 'refunded' : null
}

export async function reconcileProviderOrder(env, order, provider, context = {}) {
  const refundedStatus = await reconcileRefundedOrder(env, order, provider)
  if (refundedStatus) return refundedStatus

  const terminalStatus = await markProviderTerminalStatus(env, order, provider)
  if (terminalStatus) return terminalStatus

  if (!provider || provider.diagnosis !== 'provider_paid_webhook_missing') {
    return null
  }

  const expectedAmount = Number(order.amount_value || 0) * 100
  if (provider.amountValue && provider.amountValue < expectedAmount) {
    const result = await env.DB.prepare(
      `UPDATE course_orders
       SET status = 'payment_amount_mismatch',
           shopline_trade_order_id = COALESCE(?, shopline_trade_order_id),
           updated_at = datetime('now')
       WHERE reference_id = ?
         AND status NOT IN (${LOCKED_PAID_STATUSES.map(() => '?').join(',')})`,
    )
      .bind(provider.tradeOrderId || null, order.reference_id, ...LOCKED_PAID_STATUSES)
      .run()
    return result.meta?.changes ? 'payment_amount_mismatch' : null
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

  if (nextStatus === 'paid') {
    await sendMetaPurchaseForPaidOrder(env, context.request, order.reference_id)
    await notifyLinePaymentSuccess(env, order.reference_id)
  }

  return nextStatus
}

export async function listReconciliationCandidates(env, options = {}) {
  const limit = Math.max(1, Math.min(100, Number(options.limit || 40)))
  const lookbackHours = Math.max(1, Math.min(168, Number(options.lookbackHours || 48)))
  const refundLookbackHours = Math.max(
    1,
    Math.min(2160, Number(options.refundLookbackHours || 720)),
  )
  const minAgeSeconds = Math.max(0, Math.min(3600, Number(options.minAgeSeconds || 90)))
  const pendingPlaceholders = RECONCILABLE_STATUSES.map(() => '?').join(',')
  const refundPlaceholders = REFUND_RECONCILABLE_STATUSES.map(() => '?').join(',')

  const rows = await env.DB.prepare(
    `SELECT reference_id, status, shopline_session_id, shopline_trade_order_id,
            course_name, category, venue_id, venue_name, amount_value, currency,
            session_ids_json, quantity, created_at, updated_at, paid_at
     FROM course_orders
     WHERE shopline_session_id IS NOT NULL
       AND (
         (
           status IN (${pendingPlaceholders})
           AND datetime(created_at) >= datetime('now', ?)
           AND datetime(created_at) <= datetime('now', ?)
         )
         OR (
           status IN (${refundPlaceholders})
           AND datetime(created_at) >= datetime('now', ?)
         )
       )
     ORDER BY CASE
                WHEN status IN (${pendingPlaceholders}) THEN 0
                ELSE 1
              END,
              datetime(COALESCE(updated_at, paid_at, created_at)) DESC
     LIMIT ?`,
  )
    .bind(
      ...RECONCILABLE_STATUSES,
      `-${lookbackHours} hours`,
      `-${minAgeSeconds} seconds`,
      ...REFUND_RECONCILABLE_STATUSES,
      `-${refundLookbackHours} hours`,
      ...RECONCILABLE_STATUSES,
      limit,
    )
    .all()

  return rows.results || []
}

export async function reconcilePendingOrders(env, options = {}, context = {}) {
  const candidates = await listReconciliationCandidates(env, options)
  const results = []

  for (const order of candidates) {
    const provider = await queryShoplineSession(env, order)
    const reconciledStatus = await reconcileProviderOrder(
      env,
      order,
      provider,
      context,
    )
    results.push({
      referenceId: order.reference_id,
      previousStatus: order.status,
      reconciledStatus,
      provider,
    })
  }

  return {
    checked: candidates.length,
    changed: results.filter((result) => result.reconciledStatus).length,
    results,
  }
}
