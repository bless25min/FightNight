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
  await env.DB.batch([
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_source_created
       ON tracking_events (source_channel, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_route_created
       ON tracking_events (route_path, created_at)`,
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

async function ensureOrderTrackingColumns(env) {
  const columns = [
    ['meta_purchase_event_id', 'TEXT'],
    ['meta_purchase_sent_at', 'TEXT'],
    ['meta_capi_status', 'TEXT'],
    ['meta_capi_response_json', 'TEXT'],
    ['meta_capi_error', 'TEXT'],
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
            paid_at, meta_purchase_event_id, meta_purchase_sent_at,
            meta_capi_status, meta_capi_error
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
            paid_at, meta_purchase_event_id, meta_purchase_sent_at,
            meta_capi_status, meta_capi_error
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

async function getTraffic(env) {
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
     WHERE created_at >= datetime('now', '-14 days')
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
     WHERE created_at >= datetime('now', '-14 days')
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
     WHERE created_at >= datetime('now', '-14 days')
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
     WHERE created_at >= datetime('now', '-14 days')
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
       AND created_at >= datetime('now', '-14 days')
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
     WHERE created_at >= datetime('now', '-14 days')
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
     WHERE created_at >= datetime('now', '-14 days')
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
     WHERE created_at >= datetime('now', '-14 days')
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
     WHERE created_at >= datetime('now', '-14 days')
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
     WHERE created_at >= datetime('now', '-14 days')
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

  if (resource === 'traffic') {
    return json({ ok: true, traffic: await getTraffic(env) })
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
