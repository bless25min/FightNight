const ATTENTION_STATUSES = [
  'session_failed',
  'payment_amount_mismatch',
  'paid_over_capacity',
  'failed',
  'cancelled',
  'expired',
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

function getAdminToken(request) {
  const bearer = request.headers.get('authorization') || ''
  if (bearer.toLowerCase().startsWith('bearer ')) {
    return bearer.slice(7).trim()
  }

  return request.headers.get('x-admin-token') || ''
}

function assertAdmin(request, env) {
  if (!env.ADMIN_TOKEN) {
    return json({ error: 'Missing ADMIN_TOKEN' }, { status: 503 })
  }

  if (getAdminToken(request) !== env.ADMIN_TOKEN) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function getLimit(url, fallback = 50, max = 200) {
  const limit = Number(url.searchParams.get('limit') || fallback)
  if (!Number.isFinite(limit)) return fallback
  return Math.max(1, Math.min(max, Math.floor(limit)))
}

async function safeAll(env, sql, bindings = []) {
  try {
    const statement = env.DB.prepare(sql)
    const result =
      bindings.length > 0 ? await statement.bind(...bindings).all() : await statement.all()
    return result.results || []
  } catch (error) {
    if (error instanceof Error && /no such table/i.test(error.message)) {
      return []
    }
    throw error
  }
}

async function safeFirst(env, sql, bindings = []) {
  try {
    const statement = env.DB.prepare(sql)
    return bindings.length > 0
      ? await statement.bind(...bindings).first()
      : await statement.first()
  } catch (error) {
    if (error instanceof Error && /no such table/i.test(error.message)) {
      return null
    }
    throw error
  }
}

async function ensureCustomerTrackingTables(env) {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS tracking_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anonymous_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        event_id TEXT,
        event_value REAL,
        currency TEXT DEFAULT 'TWD',
        source_url TEXT,
        referrer TEXT,
        route_path TEXT,
        payload_json TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ),
    env.DB.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_tracking_events_event_id
       ON tracking_events (event_id)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at
       ON tracking_events (created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_name_created
       ON tracking_events (event_name, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_anonymous
       ON tracking_events (anonymous_id, created_at)`,
    ),
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
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS liff_access_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        line_user_id TEXT NOT NULL,
        placement TEXT,
        source_path TEXT,
        is_friend INTEGER NOT NULL DEFAULT 0,
        raw_profile_json TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (line_user_id) REFERENCES line_customers(line_user_id)
      )`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_liff_access_events_user
       ON liff_access_events (line_user_id, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_liff_access_events_created_at
       ON liff_access_events (created_at)`,
    ),
  ])
}

function normalizeOrder(row) {
  return {
    referenceId: row.reference_id,
    status: row.status,
    shoplineSessionId: row.shopline_session_id,
    shoplineTradeOrderId: row.shopline_trade_order_id,
    courseId: row.course_id,
    courseName: row.course_name,
    category: row.category,
    venueId: row.venue_id,
    venueName: row.venue_name,
    coach: row.coach,
    coachPricingTier: row.coach_pricing_tier,
    route: row.route,
    packageSize: toNumber(row.package_size),
    quantity: toNumber(row.quantity),
    amountValue: toNumber(row.amount_value),
    currency: row.currency || 'TWD',
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    buyerEmail: row.buyer_email,
    sourcePath: row.source_path,
    sessionIds: parseJson(row.session_ids_json, []),
    seriesDates: parseJson(row.series_dates_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    paidAt: row.paid_at,
  }
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

async function listOrders(env, url) {
  const limit = getLimit(url, 60, 200)
  const status = url.searchParams.get('status')
  const query = (url.searchParams.get('q') || '').trim()
  const where = []
  const bindings = []

  if (status && status !== 'all') {
    where.push('status = ?')
    bindings.push(status)
  }

  if (query) {
    where.push(
      `(reference_id LIKE ? OR buyer_name LIKE ? OR buyer_phone LIKE ? OR buyer_email LIKE ? OR course_name LIKE ?)`,
    )
    const like = `%${query}%`
    bindings.push(like, like, like, like, like)
  }

  bindings.push(limit)

  const rows = await safeAll(
    env,
    `SELECT reference_id, status, shopline_session_id, shopline_trade_order_id,
            course_id, course_name, category, venue_id, venue_name, coach,
            coach_pricing_tier, route, package_size, quantity, amount_value,
            currency, session_ids_json, series_dates_json, buyer_name,
            buyer_phone, buyer_email, source_path, created_at, updated_at,
            paid_at
     FROM course_orders
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY datetime(COALESCE(paid_at, updated_at, created_at)) DESC
     LIMIT ?`,
    bindings,
  )

  return rows.map(normalizeOrder)
}

async function getOrder(env, referenceId) {
  const row = await safeFirst(
    env,
    `SELECT reference_id, status, shopline_session_id, shopline_trade_order_id,
            course_id, course_name, category, venue_id, venue_name, coach,
            coach_pricing_tier, route, package_size, quantity, amount_value,
            currency, session_ids_json, series_dates_json, buyer_name,
            buyer_phone, buyer_email, source_path, created_at, updated_at,
            paid_at
     FROM course_orders
     WHERE reference_id = ?`,
    [referenceId],
  )

  return row ? normalizeOrder(row) : null
}

async function listInventory(env, url) {
  const limit = getLimit(url, 100, 300)
  const rows = await safeAll(
    env,
    `SELECT session_id, capacity, sold, updated_at,
            MAX(0, capacity - sold) AS remaining
     FROM session_inventory
     ORDER BY datetime(updated_at) DESC
     LIMIT ?`,
    [limit],
  )

  return rows.map((row) => ({
    sessionId: row.session_id,
    capacity: toNumber(row.capacity),
    sold: toNumber(row.sold),
    remaining: toNumber(row.remaining),
    updatedAt: row.updated_at,
  }))
}

async function listEvents(env, url) {
  const limit = getLimit(url, 100, 300)
  const eventName = url.searchParams.get('event')
  const where = []
  const bindings = []

  if (eventName && eventName !== 'all') {
    where.push('event_name = ?')
    bindings.push(eventName)
  }

  bindings.push(limit)

  const rows = await safeAll(
    env,
    `SELECT id, anonymous_id, session_id, event_name, event_id, event_value,
            currency, source_url, referrer, route_path, payload_json,
            user_agent, created_at
     FROM tracking_events
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY datetime(created_at) DESC
     LIMIT ?`,
    bindings,
  )

  return rows.map((row) => ({
    id: row.id,
    anonymousId: row.anonymous_id,
    sessionId: row.session_id,
    eventName: row.event_name,
    eventId: row.event_id,
    eventValue: row.event_value,
    currency: row.currency || 'TWD',
    sourceUrl: row.source_url,
    referrer: row.referrer,
    routePath: row.route_path,
    payload: parseJson(row.payload_json, {}),
    userAgent: row.user_agent,
    createdAt: row.created_at,
  }))
}

async function listLineCustomers(env, url) {
  const limit = getLimit(url, 80, 200)
  const rows = await safeAll(
    env,
    `SELECT line_user_id, display_name, picture_url, status_message,
            is_friend, access_count, first_seen_at, last_seen_at
     FROM line_customers
     ORDER BY datetime(last_seen_at) DESC
     LIMIT ?`,
    [limit],
  )

  return rows.map((row) => ({
    lineUserId: row.line_user_id,
    displayName: row.display_name,
    pictureUrl: row.picture_url,
    statusMessage: row.status_message,
    isFriend: Boolean(row.is_friend),
    accessCount: toNumber(row.access_count),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
  }))
}

async function getLineCustomer(env, lineUserId) {
  const customer = await safeFirst(
    env,
    `SELECT line_user_id, display_name, picture_url, status_message,
            is_friend, access_count, first_seen_at, last_seen_at
     FROM line_customers
     WHERE line_user_id = ?`,
    [lineUserId],
  )

  if (!customer) return null

  const events = await safeAll(
    env,
    `SELECT id, placement, source_path, is_friend, created_at
     FROM liff_access_events
     WHERE line_user_id = ?
     ORDER BY datetime(created_at) DESC
     LIMIT 100`,
    [lineUserId],
  )

  return {
    lineUserId: customer.line_user_id,
    displayName: customer.display_name,
    pictureUrl: customer.picture_url,
    statusMessage: customer.status_message,
    isFriend: Boolean(customer.is_friend),
    accessCount: toNumber(customer.access_count),
    firstSeenAt: customer.first_seen_at,
    lastSeenAt: customer.last_seen_at,
    accessEvents: events.map((event) => ({
      id: event.id,
      placement: event.placement,
      sourcePath: event.source_path,
      isFriend: Boolean(event.is_friend),
      createdAt: event.created_at,
    })),
  }
}

async function getSummary(env) {
  const orderSummary =
    (await safeFirst(
      env,
      `SELECT COUNT(*) AS total_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
              COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_orders,
              COALESCE(SUM(CASE WHEN status IN (${ATTENTION_STATUSES.map(() => '?').join(',')}) THEN 1 ELSE 0 END), 0) AS attention_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS paid_revenue
       FROM course_orders`,
      ATTENTION_STATUSES,
    )) || {}

  const statusBreakdown = await safeAll(
    env,
    `SELECT status, COUNT(*) AS count,
            COALESCE(SUM(amount_value), 0) AS amount
     FROM course_orders
     GROUP BY status
     ORDER BY count DESC`,
  )

  const eventBreakdown = await safeAll(
    env,
    `SELECT event_name, COUNT(*) AS count, MAX(created_at) AS last_at
     FROM tracking_events
     WHERE created_at >= datetime('now', '-7 days')
     GROUP BY event_name
     ORDER BY count DESC
     LIMIT 20`,
  )

  const eventSummary =
    (await safeFirst(
      env,
      `SELECT COUNT(*) AS total_events,
              COUNT(DISTINCT anonymous_id) AS anonymous_visitors,
              COUNT(DISTINCT session_id) AS sessions
       FROM tracking_events
       WHERE created_at >= datetime('now', '-7 days')`,
    )) || {}

  const lineSummary =
    (await safeFirst(
      env,
      `SELECT COUNT(*) AS total_line_customers,
              COALESCE(SUM(CASE WHEN is_friend = 1 THEN 1 ELSE 0 END), 0) AS friends
       FROM line_customers`,
    )) || {}

  const recentOrders = await listOrders(
    env,
    new URL('https://admin.local/?limit=10'),
  )
  const inventory = await listInventory(
    env,
    new URL('https://admin.local/?limit=12'),
  )

  return {
    orders: {
      total: toNumber(orderSummary.total_orders),
      paid: toNumber(orderSummary.paid_orders),
      pending: toNumber(orderSummary.pending_orders),
      attention: toNumber(orderSummary.attention_orders),
      paidRevenue: toNumber(orderSummary.paid_revenue),
    },
    statusBreakdown: statusBreakdown.map((row) => ({
      status: row.status,
      count: toNumber(row.count),
      amount: toNumber(row.amount),
    })),
    events: {
      total: toNumber(eventSummary.total_events),
      anonymousVisitors: toNumber(eventSummary.anonymous_visitors),
      sessions: toNumber(eventSummary.sessions),
      breakdown: eventBreakdown.map((row) => ({
        eventName: row.event_name,
        count: toNumber(row.count),
        lastAt: row.last_at,
      })),
    },
    line: {
      totalCustomers: toNumber(lineSummary.total_line_customers),
      friends: toNumber(lineSummary.friends),
    },
    recentOrders,
    inventory,
  }
}

function routeParts(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/admin\/?/, '')
  return {
    url,
    parts: path.split('/').filter(Boolean),
  }
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const authError = assertAdmin(request, env)
  if (authError) return authError

  await ensureCustomerTrackingTables(env)

  const { url, parts } = routeParts(request)
  const resource = parts[0] || 'summary'
  const id = parts[1] ? decodeURIComponent(parts[1]) : ''

  if (resource === 'summary') {
    return json({ ok: true, summary: await getSummary(env) })
  }

  if (resource === 'orders' && id) {
    const order = await getOrder(env, id)
    return order ? json({ ok: true, order }) : json({ error: 'Order not found' }, { status: 404 })
  }

  if (resource === 'orders') {
    return json({ ok: true, orders: await listOrders(env, url) })
  }

  if (resource === 'inventory') {
    return json({ ok: true, inventory: await listInventory(env, url) })
  }

  if (resource === 'events') {
    return json({ ok: true, events: await listEvents(env, url) })
  }

  if (resource === 'line-customers' && id) {
    const customer = await getLineCustomer(env, id)
    return customer
      ? json({ ok: true, customer })
      : json({ error: 'LINE customer not found' }, { status: 404 })
  }

  if (resource === 'line-customers') {
    return json({ ok: true, customers: await listLineCustomers(env, url) })
  }

  return json({ error: 'Not found' }, { status: 404 })
}
