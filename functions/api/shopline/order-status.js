import {
  RECONCILABLE_STATUSES,
  queryShoplineSession,
  reconcileProviderOrder,
  sendMetaPurchaseForPaidOrder,
} from './reconcile.js'
import { notifyLinePaymentSuccess } from './line-notify.js'

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
            venue_id, shopline_session_id, shopline_trade_order_id,
            session_ids_json, quantity
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
    RECONCILABLE_STATUSES.includes(order.status) ||
    url.searchParams.get('sync') === '1'
  ) {
    provider = await queryShoplineSession(env, order)
    const reconciledStatus = await reconcileProviderOrder(env, order, provider, {
      request,
    })
    if (reconciledStatus) {
      order.status = reconciledStatus
      if (reconciledStatus === 'paid') order.paid_at = new Date().toISOString()
    }
  }

  if (order.status === 'paid') {
    await sendMetaPurchaseForPaidOrder(env, request, referenceId)
    await notifyLinePaymentSuccess(env, referenceId)
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
