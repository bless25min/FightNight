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
            amount_value, currency, series_dates_json, created_at, paid_at
     FROM course_orders
     WHERE reference_id = ?`,
  )
    .bind(referenceId)
    .first()

  if (!order) {
    return json({ error: 'Order not found' }, { status: 404 })
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
  })
}
