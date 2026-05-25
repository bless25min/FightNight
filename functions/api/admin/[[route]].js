import { notifyLinePaymentSuccess } from '../shopline/line-notify.js'

const ATTENTION_STATUSES = [
  'payment_processing',
  'refund_processing',
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

function getLookbackDays(url, fallback = 7, max = 30) {
  const days = Number(url.searchParams.get('days') || fallback)
  if (!Number.isFinite(days)) return fallback
  return Math.max(1, Math.min(max, Math.floor(days)))
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

let customerTrackingEnsurePromise = null
let adminCoreEnsurePromise = null

async function ensureCustomerTrackingTablesOnce(env) {
  if (!customerTrackingEnsurePromise) {
    customerTrackingEnsurePromise = ensureCustomerTrackingTables(env).catch((error) => {
      customerTrackingEnsurePromise = null
      throw error
    })
  }

  return customerTrackingEnsurePromise
}

async function ensureAdminCoreTablesOnce(env) {
  if (!adminCoreEnsurePromise) {
    adminCoreEnsurePromise = ensureAdminCoreTables(env).catch((error) => {
      adminCoreEnsurePromise = null
      throw error
    })
  }

  return adminCoreEnsurePromise
}

async function ensureAdminCoreTables(env) {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS line_customers (
        line_user_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        picture_url TEXT,
        status_message TEXT,
        email TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        email_updated_at TEXT,
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
  await ensureLineCustomerColumns(env)
  await ensureOrderTrackingColumns(env)
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
        referrer_host TEXT,
        route_path TEXT,
        landing_path TEXT,
        first_landing_path TEXT,
        source_channel TEXT,
        first_source_channel TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_content TEXT,
        utm_term TEXT,
        click_id_type TEXT,
        click_id_value TEXT,
        device_type TEXT,
        browser_name TEXT,
        os_name TEXT,
        in_app_browser TEXT,
        browser_language TEXT,
        timezone TEXT,
        visitor_type TEXT,
        session_index INTEGER,
        viewport_width INTEGER,
        viewport_height INTEGER,
        screen_width INTEGER,
        screen_height INTEGER,
        duration_ms INTEGER,
        scroll_depth INTEGER,
        max_scroll_depth INTEGER,
        interaction_count INTEGER,
        is_bounce INTEGER,
        section_id TEXT,
        cta_id TEXT,
        target_text TEXT,
        cf_country TEXT,
        cf_region TEXT,
        cf_city TEXT,
        cf_continent TEXT,
        cf_timezone TEXT,
        cf_colo TEXT,
        cf_asn INTEGER,
        cf_as_organization TEXT,
        cf_ray TEXT,
        cf_http_protocol TEXT,
        cf_tls_version TEXT,
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
        email TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        email_updated_at TEXT,
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

  await ensureTrackingColumns(env)
  await ensureLineCustomerColumns(env)
  await env.DB.batch([
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_source_created
       ON tracking_events (source_channel, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_route_created
       ON tracking_events (route_path, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_session_created
       ON tracking_events (session_id, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_created_session
       ON tracking_events (created_at, session_id)`,
    ),
  ])
  await ensureOrderTrackingColumns(env)
}

async function ensureTrackingColumns(env) {
  const columns = [
    ['landing_path', 'TEXT'],
    ['first_landing_path', 'TEXT'],
    ['referrer_host', 'TEXT'],
    ['source_channel', 'TEXT'],
    ['first_source_channel', 'TEXT'],
    ['utm_source', 'TEXT'],
    ['utm_medium', 'TEXT'],
    ['utm_campaign', 'TEXT'],
    ['utm_content', 'TEXT'],
    ['utm_term', 'TEXT'],
    ['click_id_type', 'TEXT'],
    ['click_id_value', 'TEXT'],
    ['device_type', 'TEXT'],
    ['browser_name', 'TEXT'],
    ['os_name', 'TEXT'],
    ['in_app_browser', 'TEXT'],
    ['browser_language', 'TEXT'],
    ['timezone', 'TEXT'],
    ['visitor_type', 'TEXT'],
    ['session_index', 'INTEGER'],
    ['viewport_width', 'INTEGER'],
    ['viewport_height', 'INTEGER'],
    ['screen_width', 'INTEGER'],
    ['screen_height', 'INTEGER'],
    ['duration_ms', 'INTEGER'],
    ['scroll_depth', 'INTEGER'],
    ['max_scroll_depth', 'INTEGER'],
    ['interaction_count', 'INTEGER'],
    ['is_bounce', 'INTEGER'],
    ['section_id', 'TEXT'],
    ['cta_id', 'TEXT'],
    ['target_text', 'TEXT'],
    ['cf_country', 'TEXT'],
    ['cf_region', 'TEXT'],
    ['cf_city', 'TEXT'],
    ['cf_continent', 'TEXT'],
    ['cf_timezone', 'TEXT'],
    ['cf_colo', 'TEXT'],
    ['cf_asn', 'INTEGER'],
    ['cf_as_organization', 'TEXT'],
    ['cf_ray', 'TEXT'],
    ['cf_http_protocol', 'TEXT'],
    ['cf_tls_version', 'TEXT'],
  ]

  for (const [name, type] of columns) {
    try {
      await env.DB.prepare(
        `ALTER TABLE tracking_events ADD COLUMN ${name} ${type}`,
      ).run()
    } catch (error) {
      if (!(error instanceof Error) || !/duplicate column/i.test(error.message)) {
        throw error
      }
    }
  }
}

async function ensureLineCustomerColumns(env) {
  const columns = [
    ['email', 'TEXT'],
    ['email_verified', 'INTEGER NOT NULL DEFAULT 0'],
    ['email_updated_at', 'TEXT'],
  ]

  for (const [name, type] of columns) {
    try {
      await env.DB.prepare(
        `ALTER TABLE line_customers ADD COLUMN ${name} ${type}`,
      ).run()
    } catch (error) {
      if (
        error instanceof Error &&
        (/duplicate column/i.test(error.message) || /no such table/i.test(error.message))
      ) {
        continue
      }
      throw error
    }
  }
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
    ['line_email', 'TEXT'],
    ['line_email_verified', 'INTEGER'],
    ['line_is_friend', 'INTEGER'],
    ['line_context_json', 'TEXT'],
    ['line_payment_notify_status', 'TEXT'],
    ['line_payment_notify_attempted_at', 'TEXT'],
    ['line_payment_notified_at', 'TEXT'],
    ['line_payment_notify_response_json', 'TEXT'],
    ['line_payment_notify_error', 'TEXT'],
  ]

  for (const [name, type] of columns) {
    try {
      await env.DB.prepare(
        `ALTER TABLE course_orders ADD COLUMN ${name} ${type}`,
      ).run()
    } catch (error) {
      if (
        error instanceof Error &&
        (/duplicate column/i.test(error.message) || /no such table/i.test(error.message))
      ) {
        continue
      }
      throw error
    }
  }

  try {
    await env.DB.batch([
      env.DB.prepare(
        `CREATE INDEX IF NOT EXISTS idx_course_orders_line_user_updated
         ON course_orders (line_user_id, updated_at)`,
      ),
      env.DB.prepare(
        `CREATE INDEX IF NOT EXISTS idx_course_orders_line_user_paid
         ON course_orders (line_user_id, paid_at)`,
      ),
    ])
  } catch (error) {
    if (error instanceof Error && /no such table/i.test(error.message)) {
      return
    }
    throw error
  }
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
    lineUserId: row.line_user_id,
    lineDisplayName: row.line_display_name,
    linePictureUrl: row.line_picture_url,
    lineEmail: row.line_email || null,
    lineEmailVerified:
      row.line_email_verified == null ? null : Boolean(row.line_email_verified),
    lineIsFriend: row.line_is_friend == null ? null : Boolean(row.line_is_friend),
    linePaymentNotifyStatus: row.line_payment_notify_status,
    linePaymentNotifyAttemptedAt: row.line_payment_notify_attempted_at,
    linePaymentNotifiedAt: row.line_payment_notified_at,
    linePaymentNotifyError: row.line_payment_notify_error,
    sourcePath: row.source_path,
    metaPurchaseEventId: row.meta_purchase_event_id,
    metaPurchaseSentAt: row.meta_purchase_sent_at,
    metaCapiStatus: row.meta_capi_status,
    metaCapiError: row.meta_capi_error,
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
      `(reference_id LIKE ? OR buyer_name LIKE ? OR buyer_phone LIKE ? OR buyer_email LIKE ? OR course_name LIKE ? OR line_user_id LIKE ? OR line_display_name LIKE ? OR line_email LIKE ?)`,
    )
    const like = `%${query}%`
    bindings.push(like, like, like, like, like, like, like, like)
  }

  bindings.push(limit)

  const rows = await safeAll(
    env,
    `SELECT reference_id, status, shopline_session_id, shopline_trade_order_id,
            course_id, course_name, category, venue_id, venue_name, coach,
            coach_pricing_tier, route, package_size, quantity, amount_value,
            currency, session_ids_json, series_dates_json, buyer_name,
            buyer_phone, buyer_email, line_user_id, line_display_name,
            line_picture_url, line_email, line_email_verified,
            line_is_friend, source_path, created_at, updated_at,
            paid_at, meta_purchase_event_id, meta_purchase_sent_at,
            meta_capi_status, meta_capi_error, line_payment_notify_status,
            line_payment_notify_attempted_at, line_payment_notified_at,
            line_payment_notify_error
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
            buyer_phone, buyer_email, line_user_id, line_display_name,
            line_picture_url, line_email, line_email_verified,
            line_is_friend, source_path, created_at, updated_at,
            paid_at, meta_purchase_event_id, meta_purchase_sent_at,
            meta_capi_status, meta_capi_error, line_payment_notify_status,
            line_payment_notify_attempted_at, line_payment_notified_at,
            line_payment_notify_error
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
            currency, source_url, referrer, referrer_host, route_path, landing_path,
            first_landing_path,
            source_channel, first_source_channel, utm_source, utm_medium,
            utm_campaign, utm_content, utm_term, click_id_type, click_id_value,
            device_type, browser_name, os_name, in_app_browser,
            browser_language, timezone, visitor_type, session_index,
            viewport_width, viewport_height,
            screen_width, screen_height, duration_ms, scroll_depth,
            max_scroll_depth, interaction_count, is_bounce, section_id,
            cta_id, target_text, cf_country, cf_region, cf_city, cf_continent,
            cf_timezone, cf_colo, cf_asn, cf_as_organization, cf_ray,
            cf_http_protocol, cf_tls_version, payload_json, user_agent, created_at
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
    referrerHost: row.referrer_host,
    routePath: row.route_path,
    landingPath: row.landing_path,
    firstLandingPath: row.first_landing_path,
    sourceChannel: row.source_channel,
    firstSourceChannel: row.first_source_channel,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    utmContent: row.utm_content,
    utmTerm: row.utm_term,
    clickIdType: row.click_id_type,
    clickIdValue: row.click_id_value,
    deviceType: row.device_type,
    browserName: row.browser_name,
    osName: row.os_name,
    inAppBrowser: row.in_app_browser,
    browserLanguage: row.browser_language,
    timezone: row.timezone,
    visitorType: row.visitor_type,
    sessionIndex: row.session_index,
    viewportWidth: row.viewport_width,
    viewportHeight: row.viewport_height,
    screenWidth: row.screen_width,
    screenHeight: row.screen_height,
    durationMs: row.duration_ms,
    scrollDepth: row.scroll_depth,
    maxScrollDepth: row.max_scroll_depth,
    interactionCount: row.interaction_count,
    isBounce: Boolean(row.is_bounce),
    sectionId: row.section_id,
    ctaId: row.cta_id,
    targetText: row.target_text,
    country: row.cf_country,
    region: row.cf_region,
    city: row.cf_city,
    continent: row.cf_continent,
    cfTimezone: row.cf_timezone,
    colo: row.cf_colo,
    cfAsn: row.cf_asn,
    cfAsOrganization: row.cf_as_organization,
    cfRay: row.cf_ray,
    cfHttpProtocol: row.cf_http_protocol,
    cfTlsVersion: row.cf_tls_version,
    payload: parseJson(row.payload_json, {}),
    userAgent: row.user_agent,
    createdAt: row.created_at,
  }))
}

function normalizeLineCustomer(row) {
  return {
    lineUserId: row.line_user_id,
    displayName: row.display_name,
    pictureUrl: row.picture_url,
    statusMessage: row.status_message,
    email: row.email || null,
    emailVerified: row.email_verified == null ? null : Boolean(row.email_verified),
    isFriend: Boolean(row.is_friend),
    accessCount: toNumber(row.access_count),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    totalOrders: toNumber(row.total_orders),
    paidOrders: toNumber(row.paid_orders),
    pendingOrders: toNumber(row.pending_orders),
    paidRevenue: toNumber(row.paid_revenue),
    latestOrderReferenceId: row.latest_order_reference_id || null,
    latestOrderStatus: row.latest_order_status || null,
    latestOrderCourseName: row.latest_order_course_name || null,
    latestOrderAmountValue:
      row.latest_order_amount_value == null
        ? null
        : toNumber(row.latest_order_amount_value),
    latestOrderPaidAt: row.latest_order_paid_at || null,
    latestOrderCreatedAt: row.latest_order_created_at || null,
    buyerName: row.buyer_name || null,
    buyerPhone: row.buyer_phone || null,
    buyerEmail: row.buyer_email || null,
    latestOrderLineEmail: row.latest_order_line_email || null,
    latestOrderLineEmailVerified:
      row.latest_order_line_email_verified == null
        ? null
        : Boolean(row.latest_order_line_email_verified),
  }
}

async function listLineCustomers(env, url) {
  const limit = getLimit(url, 80, 200)
  const compact = url.searchParams.get('compact') === '1'
  const hasOrdersTable = Boolean(
    await safeFirst(
      env,
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = 'course_orders'`,
    ),
  )

  if (!hasOrdersTable) {
    const rows = await safeAll(
      env,
      `SELECT line_user_id, display_name, picture_url, status_message,
              email, email_verified, is_friend, access_count, first_seen_at, last_seen_at,
              0 AS total_orders, 0 AS paid_orders, 0 AS pending_orders,
              0 AS paid_revenue
       FROM line_customers
       ORDER BY datetime(last_seen_at) DESC
       LIMIT ?`,
      [limit],
    )

    return rows.map(normalizeLineCustomer)
  }

  if (compact) {
    if (url.searchParams.get('minimal') === '1') {
      const rows = await safeAll(
        env,
        `SELECT line_user_id, display_name, picture_url, status_message,
                email, email_verified, is_friend, access_count, first_seen_at, last_seen_at,
                0 AS total_orders, 0 AS paid_orders, 0 AS pending_orders,
                0 AS paid_revenue
         FROM line_customers
         ORDER BY datetime(last_seen_at) DESC
         LIMIT ?`,
        [limit],
      )

      return rows.map(normalizeLineCustomer)
    }

    const rows = await safeAll(
      env,
      `WITH order_stats AS (
         SELECT line_user_id,
                COUNT(*) AS total_orders,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
                COALESCE(SUM(CASE WHEN status IN ('pending', 'payment_processing', 'session_failed') THEN 1 ELSE 0 END), 0) AS pending_orders,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS paid_revenue
         FROM course_orders
         WHERE line_user_id IS NOT NULL AND line_user_id != ''
         GROUP BY line_user_id
       )
       SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.status_message,
              lc.email, lc.email_verified, lc.is_friend, lc.access_count,
              lc.first_seen_at, lc.last_seen_at,
              COALESCE(os.total_orders, 0) AS total_orders,
              COALESCE(os.paid_orders, 0) AS paid_orders,
              COALESCE(os.pending_orders, 0) AS pending_orders,
              COALESCE(os.paid_revenue, 0) AS paid_revenue
       FROM line_customers lc
       LEFT JOIN order_stats os ON os.line_user_id = lc.line_user_id
       ORDER BY datetime(lc.last_seen_at) DESC
       LIMIT ?`,
      [limit],
    )

    return rows.map(normalizeLineCustomer)
  }

  const rows = await safeAll(
    env,
    `WITH order_ranked AS (
     SELECT co.line_user_id, co.reference_id, co.status, co.course_name,
            co.amount_value, co.paid_at, co.created_at, co.updated_at,
              co.buyer_name, co.buyer_phone, co.buyer_email,
              co.line_email, co.line_email_verified,
              ROW_NUMBER() OVER (
                PARTITION BY co.line_user_id
                ORDER BY datetime(COALESCE(co.paid_at, co.updated_at, co.created_at)) DESC,
                         co.reference_id DESC
              ) AS rn
       FROM course_orders co
       WHERE co.line_user_id IS NOT NULL AND co.line_user_id != ''
     ),
     order_stats AS (
       SELECT line_user_id,
              COUNT(*) AS total_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
              COALESCE(SUM(CASE WHEN status IN ('pending', 'payment_processing', 'session_failed') THEN 1 ELSE 0 END), 0) AS pending_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS paid_revenue
       FROM order_ranked
       GROUP BY line_user_id
     )
     SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.status_message,
            lc.email, lc.email_verified, lc.is_friend, lc.access_count,
            lc.first_seen_at, lc.last_seen_at,
            COALESCE(os.total_orders, 0) AS total_orders,
            COALESCE(os.paid_orders, 0) AS paid_orders,
            COALESCE(os.pending_orders, 0) AS pending_orders,
            COALESCE(os.paid_revenue, 0) AS paid_revenue,
            latest.reference_id AS latest_order_reference_id,
            latest.status AS latest_order_status,
            latest.course_name AS latest_order_course_name,
            latest.amount_value AS latest_order_amount_value,
            latest.paid_at AS latest_order_paid_at,
            latest.created_at AS latest_order_created_at,
            latest.buyer_name AS buyer_name,
            latest.buyer_phone AS buyer_phone,
            latest.buyer_email AS buyer_email,
            latest.line_email AS latest_order_line_email,
            latest.line_email_verified AS latest_order_line_email_verified
     FROM line_customers lc
     LEFT JOIN order_stats os ON os.line_user_id = lc.line_user_id
     LEFT JOIN order_ranked latest
       ON latest.line_user_id = lc.line_user_id AND latest.rn = 1
     ORDER BY datetime(lc.last_seen_at) DESC
     LIMIT ?`,
    [limit],
  )

  return rows.map(normalizeLineCustomer)
}

async function getLineCustomer(env, lineUserId) {
  const customer = await safeFirst(
    env,
    `SELECT line_user_id, display_name, picture_url, status_message,
            email, email_verified, is_friend, access_count, first_seen_at, last_seen_at
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
    email: customer.email || null,
    emailVerified:
      customer.email_verified == null ? null : Boolean(customer.email_verified),
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

async function getTraffic(env, url) {
  const lookbackDays = getLookbackDays(url, 7, 30)
  const lookbackSql = `-${lookbackDays} days`

  const sourceRows = await safeAll(
    env,
    `SELECT COALESCE(source_channel, 'direct') AS source_channel,
            COUNT(DISTINCT session_id) AS sessions,
            COUNT(DISTINCT anonymous_id) AS visitors,
            COUNT(DISTINCT CASE WHEN visitor_type = 'new' THEN session_id ELSE NULL END) AS new_sessions,
            COUNT(DISTINCT CASE WHEN visitor_type = 'returning' THEN session_id ELSE NULL END) AS returning_sessions,
            COALESCE(SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END), 0) AS page_views,
            COALESCE(SUM(CASE WHEN event_name IN ('ui_click', 'hero_cta_click', 'ticket_cta_click', 'plan_cta_click', 'course_purchase_click', 'shopline_checkout_submit', 'line_cta_click', 'gate_access_click') THEN 1 ELSE 0 END), 0) AS actions,
            COALESCE(SUM(CASE WHEN event_name IN ('course_purchase_click', 'shopline_checkout_submit') THEN 1 ELSE 0 END), 0) AS checkout_intents,
            COALESCE(SUM(CASE WHEN event_name = 'page_exit' AND is_bounce = 1 THEN 1 ELSE 0 END), 0) AS bounces,
            COALESCE(SUM(CASE WHEN event_name = 'page_exit' THEN 1 ELSE 0 END), 0) AS exits,
            ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN duration_ms END)) AS avg_duration_ms,
            ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
     FROM tracking_events
     WHERE created_at >= datetime('now', '${lookbackSql}')
     GROUP BY COALESCE(source_channel, 'direct')
     ORDER BY sessions DESC
     LIMIT 12`,
  )

  const campaignRows = await safeAll(
    env,
    `SELECT COALESCE(utm_source, '(none)') AS utm_source,
            COALESCE(utm_medium, '(none)') AS utm_medium,
            COALESCE(utm_campaign, '(none)') AS utm_campaign,
            COALESCE(click_id_type, '') AS click_id_type,
            COUNT(DISTINCT session_id) AS sessions,
            COALESCE(SUM(CASE WHEN event_name IN ('course_purchase_click', 'shopline_checkout_submit') THEN 1 ELSE 0 END), 0) AS checkout_intents,
            COALESCE(SUM(CASE WHEN event_name IN ('ui_click', 'hero_cta_click', 'ticket_cta_click', 'plan_cta_click', 'line_cta_click') THEN 1 ELSE 0 END), 0) AS actions
     FROM tracking_events
     WHERE created_at >= datetime('now', '${lookbackSql}')
       AND (
         utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL
         OR click_id_type IS NOT NULL
       )
     GROUP BY COALESCE(utm_source, '(none)'), COALESCE(utm_medium, '(none)'),
              COALESCE(utm_campaign, '(none)'), COALESCE(click_id_type, '')
     ORDER BY sessions DESC
     LIMIT 20`,
  )

  const pageRows = await safeAll(
    env,
    `SELECT COALESCE(route_path, '(unknown)') AS route_path,
            COUNT(DISTINCT session_id) AS sessions,
            COALESCE(SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END), 0) AS page_views,
            COALESCE(SUM(CASE WHEN event_name IN ('course_purchase_click', 'shopline_checkout_submit') THEN 1 ELSE 0 END), 0) AS checkout_intents,
            COALESCE(SUM(CASE WHEN event_name IN ('ui_click', 'hero_cta_click', 'ticket_cta_click', 'plan_cta_click', 'line_cta_click') THEN 1 ELSE 0 END), 0) AS actions,
            COALESCE(SUM(CASE WHEN event_name = 'page_exit' THEN 1 ELSE 0 END), 0) AS exits,
            COALESCE(SUM(CASE WHEN event_name = 'page_exit' AND is_bounce = 1 THEN 1 ELSE 0 END), 0) AS bounces,
            ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN duration_ms END)) AS avg_duration_ms,
            ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
     FROM tracking_events
     WHERE created_at >= datetime('now', '${lookbackSql}')
     GROUP BY COALESCE(route_path, '(unknown)')
     ORDER BY sessions DESC
     LIMIT 30`,
  )

  const sectionRows = await safeAll(
    env,
    `SELECT section_id,
            COALESCE(SUM(CASE WHEN event_name = 'section_view' THEN 1 ELSE 0 END), 0) AS views,
            COUNT(DISTINCT CASE WHEN event_name = 'section_view' THEN session_id ELSE NULL END) AS sessions,
            COALESCE(SUM(CASE WHEN event_name = 'ui_click' THEN 1 ELSE 0 END), 0) AS clicks,
            MAX(created_at) AS last_at
     FROM tracking_events
     WHERE created_at >= datetime('now', '${lookbackSql}')
       AND section_id IS NOT NULL
     GROUP BY section_id
     ORDER BY views DESC, clicks DESC
     LIMIT 40`,
  )

  const exitRows = await safeAll(
    env,
    `SELECT COALESCE(route_path, '(unknown)') AS route_path,
            COUNT(*) AS exits,
            COALESCE(SUM(CASE WHEN is_bounce = 1 THEN 1 ELSE 0 END), 0) AS bounces,
            ROUND(AVG(duration_ms)) AS avg_duration_ms,
            ROUND(AVG(max_scroll_depth)) AS avg_scroll_depth,
            MAX(created_at) AS last_at
     FROM tracking_events
     WHERE event_name = 'page_exit'
       AND created_at >= datetime('now', '${lookbackSql}')
     GROUP BY COALESCE(route_path, '(unknown)')
     ORDER BY exits DESC
     LIMIT 20`,
  )

  const deviceRows = await safeAll(
    env,
    `SELECT COALESCE(device_type, 'unknown') AS device_type,
            COUNT(DISTINCT session_id) AS sessions,
            COALESCE(SUM(CASE WHEN event_name IN ('course_purchase_click', 'shopline_checkout_submit') THEN 1 ELSE 0 END), 0) AS checkout_intents,
            ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
     FROM tracking_events
     WHERE created_at >= datetime('now', '${lookbackSql}')
     GROUP BY COALESCE(device_type, 'unknown')
     ORDER BY sessions DESC`,
  )

  const browserRows = await safeAll(
    env,
    `SELECT COALESCE(browser_name, 'unknown') AS browser_name,
            COALESCE(os_name, 'unknown') AS os_name,
            COALESCE(in_app_browser, '') AS in_app_browser,
            COUNT(DISTINCT session_id) AS sessions,
            COALESCE(SUM(CASE WHEN event_name IN ('course_purchase_click', 'shopline_checkout_submit') THEN 1 ELSE 0 END), 0) AS checkout_intents,
            ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
     FROM tracking_events
     WHERE created_at >= datetime('now', '${lookbackSql}')
     GROUP BY COALESCE(browser_name, 'unknown'), COALESCE(os_name, 'unknown'), COALESCE(in_app_browser, '')
     ORDER BY sessions DESC
     LIMIT 20`,
  )

  const networkRows = await safeAll(
    env,
    `SELECT COALESCE(cf_as_organization, 'unknown') AS as_organization,
            COALESCE(cf_asn, 0) AS asn,
            COALESCE(cf_colo, '') AS colo,
            COUNT(DISTINCT session_id) AS sessions,
            COALESCE(SUM(CASE WHEN event_name IN ('course_purchase_click', 'shopline_checkout_submit') THEN 1 ELSE 0 END), 0) AS checkout_intents
     FROM tracking_events
     WHERE created_at >= datetime('now', '${lookbackSql}')
     GROUP BY COALESCE(cf_as_organization, 'unknown'), COALESCE(cf_asn, 0), COALESCE(cf_colo, '')
     ORDER BY sessions DESC
     LIMIT 20`,
  )

  const geographyRows = await safeAll(
    env,
    `SELECT COALESCE(cf_country, 'unknown') AS country,
            COALESCE(cf_region, '') AS region,
            COALESCE(cf_city, '') AS city,
            COUNT(DISTINCT session_id) AS sessions,
            COALESCE(SUM(CASE WHEN event_name IN ('course_purchase_click', 'shopline_checkout_submit') THEN 1 ELSE 0 END), 0) AS checkout_intents
     FROM tracking_events
     WHERE created_at >= datetime('now', '${lookbackSql}')
     GROUP BY COALESCE(cf_country, 'unknown'), COALESCE(cf_region, ''), COALESCE(cf_city, '')
     ORDER BY sessions DESC
     LIMIT 30`,
  )

  return {
    sources: sourceRows.map((row) => ({
      sourceChannel: row.source_channel,
      sessions: toNumber(row.sessions),
      visitors: toNumber(row.visitors),
      newSessions: toNumber(row.new_sessions),
      returningSessions: toNumber(row.returning_sessions),
      pageViews: toNumber(row.page_views),
      actions: toNumber(row.actions),
      checkoutIntents: toNumber(row.checkout_intents),
      exits: toNumber(row.exits),
      bounces: toNumber(row.bounces),
      avgDurationMs: toNumber(row.avg_duration_ms),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
    })),
    campaigns: campaignRows.map((row) => ({
      utmSource: row.utm_source,
      utmMedium: row.utm_medium,
      utmCampaign: row.utm_campaign,
      clickIdType: row.click_id_type,
      sessions: toNumber(row.sessions),
      actions: toNumber(row.actions),
      checkoutIntents: toNumber(row.checkout_intents),
    })),
    pages: pageRows.map((row) => ({
      routePath: row.route_path,
      sessions: toNumber(row.sessions),
      pageViews: toNumber(row.page_views),
      actions: toNumber(row.actions),
      checkoutIntents: toNumber(row.checkout_intents),
      exits: toNumber(row.exits),
      bounces: toNumber(row.bounces),
      avgDurationMs: toNumber(row.avg_duration_ms),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
    })),
    sections: sectionRows.map((row) => ({
      sectionId: row.section_id,
      views: toNumber(row.views),
      sessions: toNumber(row.sessions),
      clicks: toNumber(row.clicks),
      lastAt: row.last_at,
    })),
    exits: exitRows.map((row) => ({
      routePath: row.route_path,
      exits: toNumber(row.exits),
      bounces: toNumber(row.bounces),
      avgDurationMs: toNumber(row.avg_duration_ms),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
      lastAt: row.last_at,
    })),
    devices: deviceRows.map((row) => ({
      deviceType: row.device_type,
      sessions: toNumber(row.sessions),
      checkoutIntents: toNumber(row.checkout_intents),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
    })),
    browsers: browserRows.map((row) => ({
      browserName: row.browser_name,
      osName: row.os_name,
      inAppBrowser: row.in_app_browser,
      sessions: toNumber(row.sessions),
      checkoutIntents: toNumber(row.checkout_intents),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
    })),
    networks: networkRows.map((row) => ({
      asOrganization: row.as_organization,
      asn: toNumber(row.asn),
      colo: row.colo,
      sessions: toNumber(row.sessions),
      checkoutIntents: toNumber(row.checkout_intents),
    })),
    geography: geographyRows.map((row) => ({
      country: row.country,
      region: row.region,
      city: row.city,
      sessions: toNumber(row.sessions),
      checkoutIntents: toNumber(row.checkout_intents),
    })),
  }
}

async function listJourneys(env, url) {
  const limit = getLimit(url, 30, 80)
  const lookbackDays = getLookbackDays(url, 7, 30)
  const lookbackSql = `-${lookbackDays} days`
  const sessions = await safeAll(
    env,
    `SELECT session_id,
            MIN(anonymous_id) AS anonymous_id,
            MIN(created_at) AS started_at,
            MAX(created_at) AS last_at,
            COALESCE(MAX(source_channel), 'direct') AS source_channel,
            COALESCE(MAX(landing_path), '') AS landing_path,
            COALESCE(MAX(first_landing_path), '') AS first_landing_path,
            COALESCE(MAX(device_type), 'unknown') AS device_type,
            COALESCE(MAX(browser_name), 'unknown') AS browser_name,
            COALESCE(MAX(os_name), 'unknown') AS os_name,
            COALESCE(MAX(in_app_browser), '') AS in_app_browser,
            COALESCE(MAX(visitor_type), '') AS visitor_type,
            MAX(session_index) AS session_index,
            COALESCE(MAX(cf_country), '') AS country,
            COALESCE(MAX(cf_region), '') AS region,
            COALESCE(MAX(cf_city), '') AS city,
            COALESCE(MAX(cf_as_organization), '') AS as_organization,
            MAX(cf_asn) AS asn,
            COALESCE(MAX(cf_colo), '') AS colo,
            MAX(max_scroll_depth) AS max_scroll_depth,
            MAX(duration_ms) AS duration_ms,
            COUNT(*) AS event_count
     FROM tracking_events
     WHERE created_at >= datetime('now', '${lookbackSql}')
     GROUP BY session_id
     ORDER BY datetime(MAX(created_at)) DESC
     LIMIT ?`,
    [limit],
  )

  if (sessions.length === 0) return []

  const ids = sessions.map((session) => session.session_id)
  const placeholders = ids.map(() => '?').join(',')
  const events = await safeAll(
    env,
    `SELECT session_id, event_name, route_path, section_id, cta_id, target_text,
            scroll_depth, max_scroll_depth, duration_ms, is_bounce,
            source_channel, utm_source, utm_medium, utm_campaign, click_id_type,
            created_at
     FROM tracking_events
     WHERE session_id IN (${placeholders})
     ORDER BY datetime(created_at) ASC, id ASC`,
    ids,
  )
  const eventsBySession = new Map()

  for (const event of events) {
    const list = eventsBySession.get(event.session_id) || []
    list.push({
      eventName: event.event_name,
      routePath: event.route_path,
      sectionId: event.section_id,
      ctaId: event.cta_id,
      targetText: event.target_text,
      scrollDepth: event.scroll_depth,
      maxScrollDepth: event.max_scroll_depth,
      durationMs: event.duration_ms,
      isBounce: Boolean(event.is_bounce),
      sourceChannel: event.source_channel,
      utmSource: event.utm_source,
      utmMedium: event.utm_medium,
      utmCampaign: event.utm_campaign,
      clickIdType: event.click_id_type,
      createdAt: event.created_at,
    })
    eventsBySession.set(event.session_id, list)
  }

  return sessions.map((session) => ({
    sessionId: session.session_id,
    anonymousId: session.anonymous_id,
    startedAt: session.started_at,
    lastAt: session.last_at,
    sourceChannel: session.source_channel,
    landingPath: session.landing_path,
    firstLandingPath: session.first_landing_path,
    deviceType: session.device_type,
    browserName: session.browser_name,
    osName: session.os_name,
    inAppBrowser: session.in_app_browser,
    visitorType: session.visitor_type,
    sessionIndex: toNumber(session.session_index),
    country: session.country,
    region: session.region,
    city: session.city,
    asOrganization: session.as_organization,
    asn: toNumber(session.asn),
    colo: session.colo,
    maxScrollDepth: toNumber(session.max_scroll_depth),
    durationMs: toNumber(session.duration_ms),
    eventCount: toNumber(session.event_count),
    events: (eventsBySession.get(session.session_id) || []).slice(-60),
  }))
}

async function getSummary(env, url) {
  const light = url.searchParams.get('light') === '1'
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

  const eventBreakdown = light
    ? []
    : await safeAll(
        env,
        `SELECT event_name, COUNT(*) AS count, MAX(created_at) AS last_at
         FROM tracking_events
         WHERE created_at >= datetime('now', '-7 days')
         GROUP BY event_name
         ORDER BY count DESC
         LIMIT 20`,
      )

  const eventSummary = light
    ? {}
    : (await safeFirst(
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

async function linkOrderLineCustomer(env, referenceId, lineUserId) {
  const customer = await safeFirst(
    env,
    `SELECT line_user_id, display_name, picture_url, email, email_verified, is_friend
     FROM line_customers
     WHERE line_user_id = ?`,
    [lineUserId],
  )

  if (!customer) {
    return null
  }

  await env.DB.prepare(
    `UPDATE course_orders
     SET line_user_id = ?,
         line_display_name = ?,
         line_picture_url = ?,
         line_email = ?,
         line_email_verified = ?,
         line_is_friend = ?,
         line_context_json = ?,
         updated_at = datetime('now')
     WHERE reference_id = ?`,
  )
    .bind(
      customer.line_user_id,
      customer.display_name,
      customer.picture_url || null,
      customer.email || null,
      customer.email_verified ? 1 : 0,
      customer.is_friend ? 1 : 0,
      JSON.stringify({
        lineUserId: customer.line_user_id,
        displayName: customer.display_name,
        pictureUrl: customer.picture_url || null,
        email: customer.email || null,
        emailVerified: Boolean(customer.email_verified),
        isFriend: Boolean(customer.is_friend),
        source: 'admin_manual_link',
      }),
      referenceId,
    )
    .run()

  const order = await getOrder(env, referenceId)
  if (order?.status === 'paid') {
    await notifyLinePaymentSuccess(env, referenceId)
  }

  return order
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const authError = assertAdmin(request, env)
  if (authError) return authError

  const { url, parts } = routeParts(request)
  const resource = parts[0] || 'summary'
  const id = parts[1] ? decodeURIComponent(parts[1]) : ''
  const needsFullTrackingEnsure =
    resource === 'traffic' ||
    resource === 'journeys' ||
    resource === 'events' ||
    (resource === 'summary' && url.searchParams.get('light') !== '1')

  if (needsFullTrackingEnsure) {
    await ensureCustomerTrackingTablesOnce(env)
  } else {
    await ensureAdminCoreTablesOnce(env)
  }

  if (resource === 'summary') {
    return json({ ok: true, summary: await getSummary(env, url) })
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

  if (resource === 'traffic') {
    return json({ ok: true, traffic: await getTraffic(env, url) })
  }

  if (resource === 'journeys') {
    return json({ ok: true, journeys: await listJourneys(env, url) })
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

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const authError = assertAdmin(request, env)
  if (authError) return authError

  const { parts } = routeParts(request)
  const resource = parts[0] || ''
  const id = parts[1] ? decodeURIComponent(parts[1]) : ''
  const action = parts[2] || ''

  await ensureAdminCoreTablesOnce(env)

  if (resource === 'orders' && id && action === 'link-line') {
    const body = await request.json().catch(() => null)
    const lineUserId = String(body?.lineUserId || '').trim()
    if (!lineUserId) {
      return json({ error: 'Missing lineUserId' }, { status: 400 })
    }

    const order = await linkOrderLineCustomer(env, id, lineUserId)
    return order
      ? json({ ok: true, order })
      : json({ error: 'Order or LINE customer not found' }, { status: 404 })
  }

  return json({ error: 'Not found' }, { status: 404 })
}
