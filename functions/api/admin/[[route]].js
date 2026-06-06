import {
  ensureLineMessageSendsTable,
  notifyLineFreeTrialReservation,
  notifyLinePaymentSuccess,
} from '../shopline/line-notify.js'

const LINE_PUSH_ENDPOINT = 'https://api.line.me/v2/bot/message/push'
const DEFAULT_PUBLIC_ORIGIN = 'https://fightnight.25min.co'
const LINE_RECOVERY_BATCH_LIMIT = 50
const LINE_RECOVERY_TEMPLATE_VERSION = '2026-06-03-admin-story-carousel-v2'
const LINE_STORY_CARD_BLUE = '#073DAE'
const LINE_STORY_CARD_TEXT = '#253349'
const LINE_STORY_CARD_MUTED = '#65718A'
const LINE_STORY_CARD_BG = '#F7FBFF'

const LINE_RECOVERY_TEMPLATE_IDS = [
  'pending_checkout',
  'weekly_trial_invite',
  'reserved_to_first_purchase',
  'offer_viewed_unpaid',
  'course_reminder',
  'newcomer_entry',
]

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

const TRAFFIC_ACTION_EVENTS = [
  'ui_click',
  'hero_cta_click',
  'ticket_cta_click',
  'plan_cta_click',
  'line_cta_click',
  'gate_access_click',
  'ticket_schedule_gate_click',
  'ticket_schedule_preview_view',
  'offer_schedule_nav_click',
  'course_detail_open',
  'course_purchase_click',
  'shopline_checkout_submit',
  'shopline_checkout_error',
  'free_trial_reservation_click',
  'free_trial_contact_submit',
  'free_trial_extension_offer_view',
  'free_trial_bootcamp_bridge_click',
  'free_trial_add_on_category_select',
  'free_trial_add_on_view_click',
  'free_trial_keep_only_click',
  'free_trial_keep_only_confirm_click',
  'free_trial_reservation_submit',
  'free_trial_reservation_submit_before_checkout',
  'free_trial_reservation_error',
  'free_trial_reservation_already_exists',
  'bootcamp_hero_cta_click',
  'bootcamp_expectation_click',
  'bootcamp_expectation_booking_click',
  'bootcamp_route_select',
  'bootcamp_sticky_action_click',
  'bootcamp_sticky_secondary_click',
]

const CHECKOUT_INTENT_EVENTS = [
  'course_purchase_click',
  'shopline_checkout_submit',
]

const LEAD_INTENT_EVENTS = [
  'gate_access_click',
  'line_cta_click',
]

const TRAFFIC_ACTION_EVENT_SQL = TRAFFIC_ACTION_EVENTS.map(sqlString).join(', ')
const CHECKOUT_INTENT_EVENT_SQL = CHECKOUT_INTENT_EVENTS.map(sqlString).join(', ')
const LEAD_INTENT_EVENT_SQL = LEAD_INTENT_EVENTS.map(sqlString).join(', ')

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

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

function trimText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
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
  await ensureLineRecoveryTables(env)
  await ensureLineMessageSendsTable(env)
  await ensureLineMessageSendMetadataColumns(env)
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
    ['original_amount_value', 'INTEGER'],
    ['discount_code', 'TEXT'],
    ['discount_label', 'TEXT'],
    ['discount_amount_value', 'INTEGER NOT NULL DEFAULT 0'],
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

async function ensureLineRecoveryTables(env) {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS line_recovery_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recovery_id TEXT NOT NULL UNIQUE,
        line_user_id TEXT NOT NULL,
        batch_id TEXT,
        template_id TEXT NOT NULL,
        segment TEXT,
        target_url TEXT,
        status TEXT NOT NULL DEFAULT 'sending',
        message_json TEXT,
        response_json TEXT,
        error TEXT,
        blocker_reason TEXT,
        staff_note TEXT,
        template_version TEXT,
        attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
        sent_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (line_user_id) REFERENCES line_customers(line_user_id)
      )`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_recovery_messages_user
       ON line_recovery_messages (line_user_id, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_recovery_messages_status
       ON line_recovery_messages (status, created_at)`,
    ),
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS line_recovery_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT NOT NULL UNIQUE,
        template_id TEXT NOT NULL,
        segment TEXT,
        selected_count INTEGER NOT NULL DEFAULT 0,
        sendable_count INTEGER NOT NULL DEFAULT 0,
        blocked_count INTEGER NOT NULL DEFAULT 0,
        sent_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'created',
        staff_note TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        confirmed_at TEXT,
        completed_at TEXT
      )`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_recovery_batches_created
       ON line_recovery_batches (created_at)`,
    ),
  ])

  await addColumnsIfMissing(env, 'line_recovery_messages', [
    ['batch_id', 'TEXT'],
    ['segment', 'TEXT'],
    ['blocker_reason', 'TEXT'],
    ['staff_note', 'TEXT'],
    ['template_version', 'TEXT'],
  ])
}

async function addColumnsIfMissing(env, tableName, columns) {
  for (const [name, type] of columns) {
    try {
      await env.DB.prepare(
        `ALTER TABLE ${tableName} ADD COLUMN ${name} ${type}`,
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

async function ensureLineMessageSendMetadataColumns(env) {
  await addColumnsIfMissing(env, 'line_message_sends', [
    ['batch_id', 'TEXT'],
    ['segment', 'TEXT'],
    ['blocker_reason', 'TEXT'],
    ['staff_note', 'TEXT'],
    ['template_version', 'TEXT'],
  ])

  try {
    await env.DB.batch([
      env.DB.prepare(
        `CREATE INDEX IF NOT EXISTS idx_line_message_sends_batch
         ON line_message_sends (batch_id, created_at)`,
      ),
      env.DB.prepare(
        `CREATE INDEX IF NOT EXISTS idx_line_message_sends_segment
         ON line_message_sends (segment, created_at)`,
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
  const rawRequest = parseJson(row.raw_request_json, {})
  const eventPassVariant =
    rawRequest?.eventPassVariant && typeof rawRequest.eventPassVariant === 'object'
      ? rawRequest.eventPassVariant
      : null
  const servicePreferences =
    rawRequest?.servicePreferences && typeof rawRequest.servicePreferences === 'object'
      ? rawRequest.servicePreferences
      : null

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
    eventPassVariantId: eventPassVariant?.id || null,
    eventPassVariantLabel: eventPassVariant?.label || null,
    equipmentPackage: eventPassVariant?.equipmentPackage || null,
    servicePreferences,
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
            line_payment_notify_error, raw_request_json
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
            line_payment_notify_error, raw_request_json
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
  const customer = {
    ...row,
    paid_orders: toNumber(row.paid_orders),
    pending_orders: toNumber(row.pending_orders),
    free_reserved_orders: toNumber(row.free_reserved_orders),
    access_count: toNumber(row.access_count),
  }
  const suggestedTemplateId = chooseRecoveryTemplate(customer, 'auto')
  const recoverySegment = getRecoverySegment(customer)

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
    freeReservedOrders: toNumber(row.free_reserved_orders),
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
    latestRecoveryTemplateId: row.latest_recovery_template_id || null,
    latestRecoveryStatus: row.latest_recovery_status || null,
    latestRecoverySentAt: row.latest_recovery_sent_at || null,
    latestRecoveryAttemptedAt: row.latest_recovery_attempted_at || null,
    latestRecoveryError: row.latest_recovery_error || null,
    suggestedRecoveryTemplateId: suggestedTemplateId,
    recoverySegment,
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
      `WITH latest_recovery AS (
         SELECT line_user_id, template_id, status, sent_at, attempted_at, error,
                ROW_NUMBER() OVER (
                  PARTITION BY line_user_id
                  ORDER BY datetime(COALESCE(sent_at, attempted_at, created_at)) DESC, id DESC
                ) AS rn
         FROM line_recovery_messages
       )
       SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.status_message,
              lc.email, lc.email_verified, lc.is_friend, lc.access_count, lc.first_seen_at, lc.last_seen_at,
              0 AS total_orders, 0 AS paid_orders, 0 AS pending_orders,
              0 AS free_reserved_orders,
              0 AS paid_revenue,
              lr.template_id AS latest_recovery_template_id,
              lr.status AS latest_recovery_status,
              lr.sent_at AS latest_recovery_sent_at,
              lr.attempted_at AS latest_recovery_attempted_at,
              lr.error AS latest_recovery_error
       FROM line_customers lc
       LEFT JOIN latest_recovery lr ON lr.line_user_id = lc.line_user_id AND lr.rn = 1
       ORDER BY datetime(lc.last_seen_at) DESC
       LIMIT ?`,
      [limit],
    )

    return rows.map(normalizeLineCustomer)
  }

  if (compact) {
    if (url.searchParams.get('minimal') === '1') {
      const rows = await safeAll(
        env,
        `WITH latest_recovery AS (
           SELECT line_user_id, template_id, status, sent_at, attempted_at, error,
                  ROW_NUMBER() OVER (
                    PARTITION BY line_user_id
                    ORDER BY datetime(COALESCE(sent_at, attempted_at, created_at)) DESC, id DESC
                  ) AS rn
           FROM line_recovery_messages
         )
         SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.status_message,
                lc.email, lc.email_verified, lc.is_friend, lc.access_count, lc.first_seen_at, lc.last_seen_at,
                0 AS total_orders, 0 AS paid_orders, 0 AS pending_orders,
                0 AS free_reserved_orders,
                0 AS paid_revenue,
                lr.template_id AS latest_recovery_template_id,
                lr.status AS latest_recovery_status,
                lr.sent_at AS latest_recovery_sent_at,
                lr.attempted_at AS latest_recovery_attempted_at,
                lr.error AS latest_recovery_error
         FROM line_customers lc
         LEFT JOIN latest_recovery lr ON lr.line_user_id = lc.line_user_id AND lr.rn = 1
         ORDER BY datetime(lc.last_seen_at) DESC
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
                COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_reserved_orders,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS paid_revenue
         FROM course_orders
         WHERE line_user_id IS NOT NULL AND line_user_id != ''
         GROUP BY line_user_id
       ),
       latest_recovery AS (
         SELECT line_user_id, template_id, status, sent_at, attempted_at, error,
                ROW_NUMBER() OVER (
                  PARTITION BY line_user_id
                  ORDER BY datetime(COALESCE(sent_at, attempted_at, created_at)) DESC, id DESC
                ) AS rn
         FROM line_recovery_messages
       )
       SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.status_message,
              lc.email, lc.email_verified, lc.is_friend, lc.access_count,
              lc.first_seen_at, lc.last_seen_at,
              COALESCE(os.total_orders, 0) AS total_orders,
              COALESCE(os.paid_orders, 0) AS paid_orders,
              COALESCE(os.pending_orders, 0) AS pending_orders,
              COALESCE(os.free_reserved_orders, 0) AS free_reserved_orders,
              COALESCE(os.paid_revenue, 0) AS paid_revenue,
              lr.template_id AS latest_recovery_template_id,
              lr.status AS latest_recovery_status,
              lr.sent_at AS latest_recovery_sent_at,
              lr.attempted_at AS latest_recovery_attempted_at,
              lr.error AS latest_recovery_error
       FROM line_customers lc
       LEFT JOIN order_stats os ON os.line_user_id = lc.line_user_id
       LEFT JOIN latest_recovery lr ON lr.line_user_id = lc.line_user_id AND lr.rn = 1
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
            co.amount_value, co.shopline_session_url, co.source_path,
              co.paid_at, co.created_at, co.updated_at,
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
              COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_reserved_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS paid_revenue
       FROM order_ranked
       GROUP BY line_user_id
     ),
     latest_recovery AS (
       SELECT line_user_id, template_id, status, sent_at, attempted_at, error,
              ROW_NUMBER() OVER (
                PARTITION BY line_user_id
                ORDER BY datetime(COALESCE(sent_at, attempted_at, created_at)) DESC, id DESC
              ) AS rn
       FROM line_recovery_messages
     )
     SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.status_message,
            lc.email, lc.email_verified, lc.is_friend, lc.access_count,
            lc.first_seen_at, lc.last_seen_at,
            COALESCE(os.total_orders, 0) AS total_orders,
            COALESCE(os.paid_orders, 0) AS paid_orders,
            COALESCE(os.pending_orders, 0) AS pending_orders,
            COALESCE(os.free_reserved_orders, 0) AS free_reserved_orders,
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
            latest.line_email_verified AS latest_order_line_email_verified,
            lr.template_id AS latest_recovery_template_id,
            lr.status AS latest_recovery_status,
            lr.sent_at AS latest_recovery_sent_at,
            lr.attempted_at AS latest_recovery_attempted_at,
            lr.error AS latest_recovery_error
     FROM line_customers lc
     LEFT JOIN order_stats os ON os.line_user_id = lc.line_user_id
     LEFT JOIN order_ranked latest
       ON latest.line_user_id = lc.line_user_id AND latest.rn = 1
     LEFT JOIN latest_recovery lr ON lr.line_user_id = lc.line_user_id AND lr.rn = 1
     ORDER BY datetime(lc.last_seen_at) DESC
     LIMIT ?`,
    [limit],
  )

  return rows.map(normalizeLineCustomer)
}

function normalizeLineMessage(row) {
  const message = parseJson(row.message_json, null)
  const bodyContents =
    message?.contents?.type === 'carousel'
      ? message?.contents?.contents?.[0]?.body?.contents
      : message?.contents?.body?.contents
  const title =
    bodyContents?.find?.(
      (item) => item?.type === 'text' && item?.size === 'xl',
    )?.text || null

  return {
    messageId: row.message_id,
    lineUserId: row.line_user_id || null,
    displayName: row.display_name || null,
    pictureUrl: row.picture_url || null,
    buyerName: row.buyer_name || null,
    buyerPhone: row.buyer_phone || null,
    buyerEmail: row.buyer_email || null,
    referenceId: row.reference_id || null,
    courseName: row.course_name || null,
    source: row.source,
    messageType: row.message_type,
    templateId: row.template_id || null,
    targetUrl: row.target_url || null,
    status: row.status,
    batchId: row.batch_id || null,
    segment: row.segment || null,
    staffNote: row.staff_note || null,
    templateVersion: row.template_version || null,
    title,
    altText: message?.altText || null,
    error: row.error || null,
    attemptedAt: row.attempted_at || null,
    sentAt: row.sent_at || null,
    createdAt: row.created_at || null,
  }
}

async function listLineMessages(env, url) {
  const limit = getLimit(url, 80, 200)
  const rows = await safeAll(
    env,
    `WITH order_messages AS (
       SELECT 'legacy_' || co.reference_id || '_' ||
              CASE
                WHEN co.status = 'free_reserved' THEN 'free_trial_confirmation'
                ELSE 'paid_confirmation'
              END AS message_id,
              co.line_user_id,
              COALESCE(lc.display_name, co.line_display_name) AS display_name,
              COALESCE(lc.picture_url, co.line_picture_url) AS picture_url,
              co.buyer_name,
              co.buyer_phone,
              co.buyer_email,
              co.reference_id,
              co.course_name,
              'auto' AS source,
              CASE
                WHEN co.status = 'free_reserved' THEN 'free_trial_confirmation'
                ELSE 'paid_confirmation'
              END AS message_type,
              CASE
                WHEN co.status = 'free_reserved' THEN 'free_trial_confirmation'
                ELSE 'paid_confirmation'
              END AS template_id,
              NULL AS target_url,
              co.line_payment_notify_status AS status,
              NULL AS batch_id,
              NULL AS segment,
              NULL AS staff_note,
              NULL AS template_version,
              NULL AS message_json,
              co.line_payment_notify_response_json AS response_json,
              co.line_payment_notify_error AS error,
              co.line_payment_notify_attempted_at AS attempted_at,
              co.line_payment_notified_at AS sent_at,
              co.created_at
       FROM course_orders co
       LEFT JOIN line_customers lc ON lc.line_user_id = co.line_user_id
       WHERE co.line_payment_notify_status IS NOT NULL
         AND co.status IN ('paid', 'free_reserved')
         AND NOT EXISTS (
           SELECT 1
           FROM line_message_sends existing
           WHERE existing.reference_id = co.reference_id
             AND existing.message_type = CASE
               WHEN co.status = 'free_reserved' THEN 'free_trial_confirmation'
               ELSE 'paid_confirmation'
             END
         )
     ),
     recovery_messages AS (
       SELECT lrm.recovery_id AS message_id,
              lrm.line_user_id,
              lc.display_name,
              lc.picture_url,
              NULL AS buyer_name,
              NULL AS buyer_phone,
              NULL AS buyer_email,
              NULL AS reference_id,
              NULL AS course_name,
              'admin_manual' AS source,
              'manual_recovery' AS message_type,
              lrm.template_id,
              lrm.target_url,
              lrm.status,
              lrm.batch_id,
              lrm.segment,
              lrm.staff_note,
              lrm.template_version,
              lrm.message_json,
              lrm.response_json,
              lrm.error,
              lrm.attempted_at,
              lrm.sent_at,
              lrm.created_at
       FROM line_recovery_messages lrm
       LEFT JOIN line_customers lc ON lc.line_user_id = lrm.line_user_id
       WHERE NOT EXISTS (
         SELECT 1
         FROM line_message_sends existing
         WHERE existing.message_id = lrm.recovery_id
       )
     ),
     unified_messages AS (
       SELECT lms.message_id,
              lms.line_user_id,
              COALESCE(lc.display_name, co.line_display_name) AS display_name,
              COALESCE(lc.picture_url, co.line_picture_url) AS picture_url,
              co.buyer_name,
              co.buyer_phone,
              co.buyer_email,
              lms.reference_id,
              co.course_name,
              lms.source,
              lms.message_type,
              lms.template_id,
              lms.target_url,
              lms.status,
              lms.batch_id,
              lms.segment,
              lms.staff_note,
              lms.template_version,
              lms.message_json,
              lms.response_json,
              lms.error,
              lms.attempted_at,
              lms.sent_at,
              lms.created_at
       FROM line_message_sends lms
       LEFT JOIN line_customers lc ON lc.line_user_id = lms.line_user_id
       LEFT JOIN course_orders co ON co.reference_id = lms.reference_id
       UNION ALL
       SELECT * FROM order_messages
       UNION ALL
       SELECT * FROM recovery_messages
     )
     SELECT *
     FROM unified_messages
     ORDER BY datetime(COALESCE(sent_at, attempted_at, created_at)) DESC
     LIMIT ?`,
    [limit],
  )

  return rows.map(normalizeLineMessage)
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

  const [
    overviewRows,
    orderSummaryRows,
    dailyRows,
    orderDailyRows,
    sourceRows,
    campaignRows,
    pageRows,
    sectionRows,
    dropoffRows,
    exitRows,
    deviceRows,
    browserRows,
    networkRows,
    geographyRows,
    recentEventRows,
  ] = await Promise.all([
    safeAll(
      env,
      `SELECT COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN anonymous_id ELSE NULL END) AS visitors,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND COALESCE(first_source_channel, source_channel, '') = 'paid' THEN session_id ELSE NULL END) AS paid_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND click_id_type IS NOT NULL THEN session_id ELSE NULL END) AS click_id_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND (utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL) THEN session_id ELSE NULL END) AS utm_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'ticket_view' THEN session_id ELSE NULL END) AS ticket_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'free_trial_reservation_submit' THEN session_id ELSE NULL END) AS free_trial_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'course_purchase_click' THEN session_id ELSE NULL END) AS purchase_click_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'shopline_checkout_submit' THEN session_id ELSE NULL END) AS checkout_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'scroll_depth' AND COALESCE(scroll_depth, max_scroll_depth, 0) >= 50 THEN session_id ELSE NULL END) AS scroll_50_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_exit' THEN session_id ELSE NULL END) AS exit_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_exit' AND is_bounce = 1 THEN session_id ELSE NULL END) AS bounce_sessions
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')`,
    ),
    safeAll(
      env,
      `SELECT COUNT(*) AS orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
              COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS revenue
       FROM course_orders
       WHERE created_at >= datetime('now', '${lookbackSql}')`,
    ),
    safeAll(
      env,
      `SELECT date(datetime(created_at, '+8 hours')) AS day_tw,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND COALESCE(first_source_channel, source_channel, '') = 'paid' THEN session_id ELSE NULL END) AS paid_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND click_id_type IS NOT NULL THEN session_id ELSE NULL END) AS click_id_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND (utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL) THEN session_id ELSE NULL END) AS utm_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'ticket_view' THEN session_id ELSE NULL END) AS ticket_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'free_trial_reservation_submit' THEN session_id ELSE NULL END) AS free_trial_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'course_purchase_click' THEN session_id ELSE NULL END) AS purchase_click_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'shopline_checkout_submit' THEN session_id ELSE NULL END) AS checkout_sessions
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY day_tw
       ORDER BY day_tw DESC`,
    ),
    safeAll(
      env,
      `SELECT date(datetime(created_at, '+8 hours')) AS day_tw,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
              COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS revenue
       FROM course_orders
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY day_tw`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(source_channel, 'direct') AS source_channel,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN anonymous_id ELSE NULL END) AS visitors,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND visitor_type = 'new' THEN session_id ELSE NULL END) AS new_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND visitor_type = 'returning' THEN session_id ELSE NULL END) AS returning_sessions,
              COALESCE(SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END), 0) AS page_views,
              COUNT(DISTINCT CASE WHEN event_name = 'ticket_view' THEN session_id ELSE NULL END) AS ticket_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'free_trial_reservation_submit' THEN session_id ELSE NULL END) AS free_trial_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'course_purchase_click' THEN session_id ELSE NULL END) AS purchase_click_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${TRAFFIC_ACTION_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS actions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents,
              COALESCE(SUM(CASE WHEN event_name = 'page_exit' AND is_bounce = 1 THEN 1 ELSE 0 END), 0) AS bounces,
              COALESCE(SUM(CASE WHEN event_name = 'page_exit' THEN 1 ELSE 0 END), 0) AS exits,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN duration_ms END)) AS avg_duration_ms,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY COALESCE(source_channel, 'direct')
       ORDER BY sessions DESC
       LIMIT 12`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(utm_source, '(none)') AS utm_source,
              COALESCE(utm_medium, '(none)') AS utm_medium,
              COALESCE(utm_campaign, '(none)') AS utm_campaign,
              COALESCE(utm_content, '(none)') AS utm_content,
              COALESCE(utm_term, '(none)') AS utm_term,
              COALESCE(click_id_type, '') AS click_id_type,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND COALESCE(first_source_channel, source_channel, '') = 'paid' THEN session_id ELSE NULL END) AS paid_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'ticket_view' THEN session_id ELSE NULL END) AS ticket_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'free_trial_reservation_submit' THEN session_id ELSE NULL END) AS free_trial_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'course_purchase_click' THEN session_id ELSE NULL END) AS purchase_click_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'shopline_checkout_submit' THEN session_id ELSE NULL END) AS checkout_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents,
              COALESCE(SUM(CASE WHEN event_name IN (${TRAFFIC_ACTION_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS actions,
              MIN(datetime(created_at, '+8 hours')) AS first_seen_tw,
              MAX(datetime(created_at, '+8 hours')) AS last_seen_tw
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
         AND (
           utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL
           OR utm_content IS NOT NULL OR utm_term IS NOT NULL OR click_id_type IS NOT NULL
           OR COALESCE(first_source_channel, source_channel, '') = 'paid'
         )
       GROUP BY COALESCE(utm_source, '(none)'), COALESCE(utm_medium, '(none)'),
                COALESCE(utm_campaign, '(none)'), COALESCE(utm_content, '(none)'),
                COALESCE(utm_term, '(none)'), COALESCE(click_id_type, '')
       HAVING sessions > 0
       ORDER BY sessions DESC
       LIMIT 50`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(route_path, '(unknown)') AS route_path,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COALESCE(SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END), 0) AS page_views,
              COUNT(DISTINCT CASE WHEN event_name = 'ticket_view' THEN session_id ELSE NULL END) AS ticket_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'free_trial_reservation_submit' THEN session_id ELSE NULL END) AS free_trial_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents,
              COALESCE(SUM(CASE WHEN event_name IN (${TRAFFIC_ACTION_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS actions,
              COALESCE(SUM(CASE WHEN event_name = 'page_exit' THEN 1 ELSE 0 END), 0) AS exits,
              COALESCE(SUM(CASE WHEN event_name = 'page_exit' AND is_bounce = 1 THEN 1 ELSE 0 END), 0) AS bounces,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN duration_ms END)) AS avg_duration_ms,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY COALESCE(route_path, '(unknown)')
       HAVING sessions > 0 OR actions > 0
       ORDER BY sessions DESC
       LIMIT 30`,
    ),
    safeAll(
      env,
      `SELECT section_id,
              COALESCE(SUM(CASE WHEN event_name = 'section_view' THEN 1 ELSE 0 END), 0) AS views,
              COUNT(DISTINCT CASE WHEN event_name = 'section_view' THEN session_id ELSE NULL END) AS sessions,
              COALESCE(SUM(CASE WHEN event_name = 'ui_click' THEN 1 ELSE 0 END), 0) AS clicks,
              ROUND(AVG(CASE WHEN event_name = 'section_engagement' THEN duration_ms END)) AS avg_duration_ms,
              MAX(created_at) AS last_at
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
         AND section_id IS NOT NULL
       GROUP BY section_id
       ORDER BY views DESC, clicks DESC
       LIMIT 40`,
    ),
    safeAll(
      env,
      `WITH exits AS (
         SELECT session_id, route_path, duration_ms, max_scroll_depth, is_bounce, created_at
         FROM tracking_events
         WHERE event_name = 'page_exit'
           AND created_at >= datetime('now', '${lookbackSql}')
       ),
       ranked_sections AS (
         SELECT session_id, section_id, created_at,
                ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY datetime(created_at) DESC, id DESC) AS rn
         FROM tracking_events
         WHERE created_at >= datetime('now', '${lookbackSql}')
           AND section_id IS NOT NULL
       )
       SELECT COALESCE(ranked_sections.section_id, exits.route_path, '(unknown)') AS last_section,
              COUNT(*) AS dropoffs,
              COALESCE(SUM(CASE WHEN exits.is_bounce = 1 THEN 1 ELSE 0 END), 0) AS bounces,
              ROUND(AVG(exits.duration_ms)) AS avg_duration_ms,
              ROUND(AVG(exits.max_scroll_depth)) AS avg_scroll_depth,
              MAX(exits.created_at) AS last_at
       FROM exits
       LEFT JOIN ranked_sections
         ON ranked_sections.session_id = exits.session_id
        AND ranked_sections.rn = 1
       GROUP BY COALESCE(ranked_sections.section_id, exits.route_path, '(unknown)')
       ORDER BY dropoffs DESC, avg_scroll_depth ASC
       LIMIT 30`,
    ),
    safeAll(
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
    ),
    safeAll(
      env,
      `SELECT COALESCE(device_type, 'unknown') AS device_type,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY COALESCE(device_type, 'unknown')
       ORDER BY sessions DESC`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(browser_name, 'unknown') AS browser_name,
              COALESCE(os_name, 'unknown') AS os_name,
              COALESCE(in_app_browser, '') AS in_app_browser,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY COALESCE(browser_name, 'unknown'), COALESCE(os_name, 'unknown'), COALESCE(in_app_browser, '')
       ORDER BY sessions DESC
       LIMIT 20`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(cf_as_organization, 'unknown') AS as_organization,
              COALESCE(cf_asn, 0) AS asn,
              COALESCE(cf_colo, '') AS colo,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY COALESCE(cf_as_organization, 'unknown'), COALESCE(cf_asn, 0), COALESCE(cf_colo, '')
       ORDER BY sessions DESC
       LIMIT 20`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(cf_country, 'unknown') AS country,
              COALESCE(cf_region, '') AS region,
              COALESCE(cf_city, '') AS city,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN COALESCE(first_source_channel, source_channel, '') = 'paid' AND event_name = 'page_view' THEN session_id ELSE NULL END) AS paid_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY COALESCE(cf_country, 'unknown'), COALESCE(cf_region, ''), COALESCE(cf_city, '')
       ORDER BY sessions DESC
       LIMIT 30`,
    ),
    safeAll(
      env,
      `SELECT datetime(created_at, '+8 hours') AS created_tw,
              event_name, route_path, section_id, cta_id, target_text,
              duration_ms, scroll_depth, max_scroll_depth,
              source_channel, utm_campaign, utm_content,
              browser_name, in_app_browser, cf_city, cf_country
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
         AND (
           event_name IN (${TRAFFIC_ACTION_EVENT_SQL})
           OR event_name IN ('page_view', 'ticket_view', 'page_exit')
         )
       ORDER BY created_at DESC
       LIMIT 80`,
    ),
  ])

  const overview = overviewRows[0] || {}
  const orderSummary = orderSummaryRows[0] || {}
  const ordersByDay = new Map(orderDailyRows.map((row) => [row.day_tw, row]))

  return {
    overview: {
      sessions: toNumber(overview.sessions),
      visitors: toNumber(overview.visitors),
      paidSessions: toNumber(overview.paid_sessions),
      clickIdSessions: toNumber(overview.click_id_sessions),
      utmSessions: toNumber(overview.utm_sessions),
      ticketSessions: toNumber(overview.ticket_sessions),
      leadSessions: toNumber(overview.lead_sessions),
      freeTrialSessions: toNumber(overview.free_trial_sessions),
      purchaseClickSessions: toNumber(overview.purchase_click_sessions),
      checkoutSessions: toNumber(overview.checkout_sessions),
      scroll50Sessions: toNumber(overview.scroll_50_sessions),
      exitSessions: toNumber(overview.exit_sessions),
      bounceSessions: toNumber(overview.bounce_sessions),
      paidOrders: toNumber(orderSummary.paid_orders),
      freeOrders: toNumber(orderSummary.free_orders),
      revenue: toNumber(orderSummary.revenue),
    },
    daily: dailyRows.map((row) => {
      const orderRow = ordersByDay.get(row.day_tw) || {}
      return {
        day: row.day_tw,
        sessions: toNumber(row.sessions),
        paidSessions: toNumber(row.paid_sessions),
        clickIdSessions: toNumber(row.click_id_sessions),
        utmSessions: toNumber(row.utm_sessions),
        ticketSessions: toNumber(row.ticket_sessions),
        leadSessions: toNumber(row.lead_sessions),
        freeTrialSessions: toNumber(row.free_trial_sessions),
        purchaseClickSessions: toNumber(row.purchase_click_sessions),
        checkoutSessions: toNumber(row.checkout_sessions),
        paidOrders: toNumber(orderRow.paid_orders),
        freeOrders: toNumber(orderRow.free_orders),
        revenue: toNumber(orderRow.revenue),
      }
    }),
    sources: sourceRows.map((row) => ({
      sourceChannel: row.source_channel,
      sessions: toNumber(row.sessions),
      visitors: toNumber(row.visitors),
      newSessions: toNumber(row.new_sessions),
      returningSessions: toNumber(row.returning_sessions),
      pageViews: toNumber(row.page_views),
      ticketSessions: toNumber(row.ticket_sessions),
      leadSessions: toNumber(row.lead_sessions),
      freeTrialSessions: toNumber(row.free_trial_sessions),
      purchaseClickSessions: toNumber(row.purchase_click_sessions),
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
      utmContent: row.utm_content,
      utmTerm: row.utm_term,
      clickIdType: row.click_id_type,
      sessions: toNumber(row.sessions),
      paidSessions: toNumber(row.paid_sessions),
      ticketSessions: toNumber(row.ticket_sessions),
      leadSessions: toNumber(row.lead_sessions),
      freeTrialSessions: toNumber(row.free_trial_sessions),
      purchaseClickSessions: toNumber(row.purchase_click_sessions),
      checkoutSessions: toNumber(row.checkout_sessions),
      actions: toNumber(row.actions),
      checkoutIntents: toNumber(row.checkout_intents),
      firstSeenAt: row.first_seen_tw,
      lastSeenAt: row.last_seen_tw,
    })),
    pages: pageRows.map((row) => ({
      routePath: row.route_path,
      sessions: toNumber(row.sessions),
      pageViews: toNumber(row.page_views),
      ticketSessions: toNumber(row.ticket_sessions),
      leadSessions: toNumber(row.lead_sessions),
      freeTrialSessions: toNumber(row.free_trial_sessions),
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
      avgDurationMs: toNumber(row.avg_duration_ms),
      lastAt: row.last_at,
    })),
    dropoffs: dropoffRows.map((row) => ({
      lastSection: row.last_section,
      dropoffs: toNumber(row.dropoffs),
      bounces: toNumber(row.bounces),
      avgDurationMs: toNumber(row.avg_duration_ms),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
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
      leadSessions: toNumber(row.lead_sessions),
      checkoutIntents: toNumber(row.checkout_intents),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
    })),
    browsers: browserRows.map((row) => ({
      browserName: row.browser_name,
      osName: row.os_name,
      inAppBrowser: row.in_app_browser,
      sessions: toNumber(row.sessions),
      leadSessions: toNumber(row.lead_sessions),
      checkoutIntents: toNumber(row.checkout_intents),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
    })),
    networks: networkRows.map((row) => ({
      asOrganization: row.as_organization,
      asn: toNumber(row.asn),
      colo: row.colo,
      sessions: toNumber(row.sessions),
      leadSessions: toNumber(row.lead_sessions),
      checkoutIntents: toNumber(row.checkout_intents),
    })),
    geography: geographyRows.map((row) => ({
      country: row.country,
      region: row.region,
      city: row.city,
      sessions: toNumber(row.sessions),
      paidSessions: toNumber(row.paid_sessions),
      leadSessions: toNumber(row.lead_sessions),
      checkoutIntents: toNumber(row.checkout_intents),
    })),
    recentEvents: recentEventRows.map((row) => ({
      createdAt: row.created_tw,
      eventName: row.event_name,
      routePath: row.route_path,
      sectionId: row.section_id,
      ctaId: row.cta_id,
      targetText: row.target_text,
      durationMs: toNumber(row.duration_ms),
      scrollDepth: toNumber(row.scroll_depth),
      maxScrollDepth: toNumber(row.max_scroll_depth),
      sourceChannel: row.source_channel,
      utmCampaign: row.utm_campaign,
      utmContent: row.utm_content,
      browserName: row.browser_name,
      inAppBrowser: row.in_app_browser,
      city: row.cf_city,
      country: row.cf_country,
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
              COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_reserved_orders,
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
      freeReserved: toNumber(orderSummary.free_reserved_orders),
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
  if (order?.status === 'free_reserved') {
    await notifyLineFreeTrialReservation(env, referenceId)
  } else if (order?.status === 'paid') {
    await notifyLinePaymentSuccess(env, referenceId)
  }

  return order
}

async function resendOrderLineConfirmation(env, referenceId) {
  const order = await safeFirst(
    env,
    `SELECT reference_id, status, line_user_id
     FROM course_orders
     WHERE reference_id = ?`,
    [referenceId],
  )

  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' }
  }
  if (!order.line_user_id) {
    return {
      ok: false,
      status: 400,
      error: '訂單沒有綁定 LINE user，無法重送確認卡',
    }
  }

  let lineNotify
  if (order.status === 'free_reserved') {
    lineNotify = await notifyLineFreeTrialReservation(env, referenceId)
  } else if (order.status === 'paid') {
    lineNotify = await notifyLinePaymentSuccess(env, referenceId)
  } else {
    return {
      ok: false,
      status: 400,
      error: '只有免費體驗預約與已付款訂單可以重送 LINE 確認卡',
    }
  }

  return {
    ok: true,
    referenceId,
    lineNotify,
    order: await getOrder(env, referenceId),
  }
}

function createRecoveryId() {
  if (globalThis.crypto?.randomUUID) {
    return `lr_${globalThis.crypto.randomUUID()}`
  }
  return `lr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function createRecoveryBatchId() {
  if (globalThis.crypto?.randomUUID) {
    return `lrb_${globalThis.crypto.randomUUID()}`
  }
  return `lrb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function formatLineMoney(value, currency = 'TWD') {
  const amount = Number(value || 0)
  if (currency !== 'TWD') return `${currency} ${amount.toLocaleString('en-US')}`
  return `NT$${amount.toLocaleString('zh-TW')}`
}

function getPublicOrigin(env, request) {
  const configured =
    env.PUBLIC_SITE_URL ||
    env.SITE_ORIGIN ||
    env.PUBLIC_ORIGIN ||
    env.VITE_PUBLIC_SITE_URL

  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      // Fall back to the request origin below.
    }
  }

  try {
    return new URL(request.url).origin
  } catch {
    return DEFAULT_PUBLIC_ORIGIN
  }
}

function buildRecoveryTicketUrl(env, request, recoveryId, templateId) {
  const url = new URL('/', getPublicOrigin(env, request))
  url.searchParams.set('utm_source', 'line')
  url.searchParams.set('utm_medium', 'recovery')
  url.searchParams.set('utm_campaign', templateId)
  url.searchParams.set('recovery_id', recoveryId)
  url.hash = 'fight-night-pass'
  return url.toString()
}

function isPendingOrderStatus(status) {
  return ['pending', 'payment_processing', 'session_failed'].includes(
    String(status || ''),
  )
}

function getAllowedRecoveryTemplateId(requestedTemplateId) {
  return LINE_RECOVERY_TEMPLATE_IDS.includes(requestedTemplateId)
    ? requestedTemplateId
    : null
}

function getRecoverySegment(customer) {
  if (toNumber(customer?.paid_orders) > 0) return 'paid'
  if (toNumber(customer?.pending_orders) > 0) return 'checkout_started_unpaid'
  if (toNumber(customer?.free_reserved_orders) > 0) return 'free_reserved_unpaid'
  if (toNumber(customer?.total_orders) <= 0 && toNumber(customer?.access_count) > 1) {
    return 'multi_visit_unreserved'
  }
  if (toNumber(customer?.total_orders) <= 0) return 'line_friend_unreserved'
  return 'unpaid_unknown'
}

function chooseRecoveryTemplate(customer, requestedTemplateId) {
  const allowedTemplateId = getAllowedRecoveryTemplateId(requestedTemplateId)
  if (allowedTemplateId) return allowedTemplateId
  if (customer.latest_order_reference_id && isPendingOrderStatus(customer.latest_order_status)) {
    return 'pending_checkout'
  }
  if (toNumber(customer.free_reserved_orders) > 0 || customer.latest_order_status === 'free_reserved') {
    return 'reserved_to_first_purchase'
  }
  if (toNumber(customer.access_count) > 1) return 'course_reminder'
  return 'newcomer_entry'
}

function buildLineImageUrl(env, request, fileName) {
  return `${getPublicOrigin(env, request)}/line-recovery/${fileName}`
}

function buildRecoveryOfferUrl(env, request, recoveryId, templateId) {
  const url = new URL('/boot-camp', getPublicOrigin(env, request))
  url.searchParams.set('from', 'line-recovery')
  url.searchParams.set('utm_source', 'line')
  url.searchParams.set('utm_medium', 'recovery')
  url.searchParams.set('utm_campaign', templateId)
  url.searchParams.set('recovery_id', recoveryId)
  return url.toString()
}

function getRecoveryMessageCopy(customer, templateId) {
  const latestCourseName = trimText(customer.latest_order_course_name, 80)
  const latestAmount =
    customer.latest_order_amount_value == null
      ? ''
      : formatLineMoney(customer.latest_order_amount_value)

  const copyByTemplate = {
    pending_checkout: {
      eyebrow: 'PAYMENT PAUSED',
      title: '如果你剛剛停在付款前',
      body: latestCourseName
        ? `你剛剛選的「${latestCourseName}」還沒完成付款。`
        : '你剛剛建立的預約還沒完成付款。',
      meta: latestAmount ? `目前金額 ${latestAmount}` : '付款完成後才算正式保留',
      button: '完成這場預約',
      cards: [
        {
          eyebrow: 'PAYMENT PAUSED',
          title: '如果你剛剛停在付款前',
          paragraphs: [
            '你可能不是不想來，只是還在確認這是不是又一個要入會、要諮詢、要被推銷的健身房流程。',
            latestCourseName
              ? `你剛剛選的「${latestCourseName}」還沒完成付款。`
              : '你剛剛建立的預約還沒完成付款。',
            '這一場不用談方案。完成一次付款，就把這場 Fight Night 保留下來。',
          ],
          meta: latestAmount ? `目前金額 ${latestAmount}` : '付款完成後 LINE 會收到確認',
          button: '完成這場預約',
        },
        {
          image: 'flow-step-3.jpg',
          eyebrow: 'NO MEMBERSHIP',
          title: '不是入會前導',
          paragraphs: [
            'Fight Night 是一場已經編排好的夜晚體驗。',
            '你不用先承諾長期課程，也不需要在現場跟業務談方案。',
            '到場後跟著音樂、倒數、教練口令和全場節奏完成這 50 分鐘。',
          ],
          meta: '一次付款 · 一場完整體驗',
          button: '完成這場預約',
        },
        {
          image: 'collective-euphoria-card.jpg',
          eyebrow: 'CONFIRMATION',
          title: '付款後 LINE 會收到確認',
          paragraphs: [
            '完成付款後，確認卡會放在 LINE 裡。',
            '當天照卡片資訊到場就可以，不用再等人工確認，也不用重新填一次資料。',
          ],
          meta: '保留成功後再進場',
          button: '完成這場預約',
        },
      ],
    },
    weekly_trial_invite: {
      eyebrow: 'FREE TRIAL',
      title: '如果你其實不想去健身房',
      body: '不用入會，不用先懂拳擊或泰拳。先選一場能進場的時間，到現場跟著教練完成整段體驗。',
      meta: '新手可進 · 不對打 · LINE 內確認',
      button: '保留免費體驗',
      cards: [
        {
          eyebrow: 'FREE TRIAL',
          title: '如果你其實不想去健身房',
          paragraphs: [
            '很多人不是不知道該運動。',
            '是不想入會、不想被推銷，也覺得一般運動課很無聊。',
            'Fight Night 解決的是這件事：把一堂課變成一場有情緒、有節奏、有現場感的夜晚體驗。',
          ],
          meta: '先保留一場，不用先承諾長期課程',
          button: '保留免費體驗',
        },
        {
          image: 'hero-poster.jpg',
          eyebrow: 'FIGHT NIGHT',
          title: '你不是來被上課',
          paragraphs: [
            '你是進到一個已經排好的現場。',
            '音樂、倒數、拳套聲、教練口令和其他人的節奏，會把你帶進去。',
          ],
          meta: '50 分鐘教練帶領 · 新手可進',
          button: '選一場時間',
        },
        {
          image: 'flow-step-5.jpg',
          eyebrow: 'LINE CONFIRM',
          title: '保留後在 LINE 裡確認',
          paragraphs: [
            '留下資料並保留場次後，LINE 會收到免費體驗確認卡。',
            '預約先完成，再決定要不要看 618 首購優惠。',
          ],
          meta: '先確認預約，再看首購優惠',
          button: '保留免費體驗',
        },
      ],
    },
    reserved_to_first_purchase: {
      eyebrow: '618 OFFER',
      title: '你的免費體驗已經保留',
      body: '預約先算完成。接下來如果想把體驗變成固定訓練，可以先看 618 首購優惠。',
      meta: '確認預約後再看優惠，不會被推銷',
      button: '查看 618 首購',
      cards: [
        {
          eyebrow: 'RESERVED',
          title: '你的免費體驗已保留',
          paragraphs: [
            latestCourseName
              ? `「${latestCourseName}」已進入你的 LINE 預約流程。`
              : '你已完成免費體驗預約流程。',
            '當天照 LINE 確認資訊到場即可。',
            '接下來的優惠不是現場推銷，是你可以先在線上自己看的下一步。',
          ],
          meta: '預約已完成 · 不用再重填資料',
          button: '查看 618 首購',
        },
        {
          image: 'offers-hero-octagon-poster.jpg',
          eyebrow: 'FIRST PURCHASE',
          title: '想固定開始，再看首購優惠',
          paragraphs: [
            '如果你想把一次體驗接成固定訓練，可以先看 618 首購。',
            '不用在現場談方案，線上看懂再決定。',
          ],
          meta: 'Boot Camp 或 Fight Night 都可選',
          button: '看 618 方案',
        },
        {
          image: 'bootcamp-origin-poster.jpg',
          eyebrow: 'NEXT STEP',
          title: '把一次體驗接成下一步',
          paragraphs: [
            '如果你想更穩定進步，可以直接選 2 堂或 4 堂 Boot Camp。',
            '先把節奏建立起來，再決定要走多遠。',
          ],
          meta: '平易近人的付款流程',
          button: '查看方案',
        },
      ],
    },
    offer_viewed_unpaid: {
      eyebrow: '618 OFFER',
      title: '你看過的首購優惠還在',
      body: '如果你想把 Fight Night 變成固定開始的一步，可以回到 618 首購方案，直接完成付款。',
      meta: '不用入會 · 不用現場談方案',
      button: '回到 618 首購',
      cards: [
        {
          eyebrow: '618 OFFER',
          title: '如果你其實已經想開始',
          paragraphs: [
            '你可能已經看過 618 首購，只是還沒決定要不要付款。',
            '這裡不是入會合約，也不是現場諮詢。',
            '你只是在線上選一個開始的組合，完成付款後，LINE 收到確認。',
          ],
          meta: '首購限定優惠',
          button: '回到 618 首購',
        },
        {
          image: 'bootcamp-origin-poster.jpg',
          eyebrow: 'BOOT CAMP',
          title: '想更穩定，就選 Boot Camp',
          paragraphs: [
            '把拳擊或泰拳拆成更容易跟上的幾堂課。',
            '適合體驗後想繼續，但不想一次被推到長期方案的人。',
          ],
          meta: '2 堂或 4 堂可選',
          button: '查看方案',
        },
        {
          image: 'collective-euphoria-card.jpg',
          eyebrow: 'FIGHT NIGHT',
          title: '也可以繼續買單場體驗',
          paragraphs: [
            '如果你只想先保留下一場 Fight Night，也可以用單場方式進場。',
            '一次付款，一場完整體驗。',
          ],
          meta: '一次付款 · 一場完整體驗',
          button: '看可購買場次',
        },
      ],
    },
    course_reminder: {
      eyebrow: 'Fight Night',
      title: '如果你也一直卡在心裡',
      body: '如果你只是還在看，可以先從一場能跟上的 Fight Night 開始。不用入會，不會中途推銷。',
      meta: '50 分鐘教練帶領 · 新手可進',
      button: '看本週可預約',
      cards: [
        {
          eyebrow: 'FIGHT NIGHT',
          title: '如果你也一直卡在心裡',
          paragraphs: [
            '也許你不是沒興趣。',
            '你只是想到健身房，就想到入會、推銷、合約，或一堂很無聊的運動課。',
            '這件事不用自己猜到很煩。',
            '先讓一場 Fight Night 告訴你：運動也可以是一段情緒價值體驗。',
          ],
          meta: '不用入會 · 不被推銷',
          button: '看本週可預約',
        },
        {
          image: 'collective-euphoria-card.jpg',
          eyebrow: 'ATMOSPHERE',
          title: '你不用自己找動力',
          paragraphs: [
            '現場的音樂、倒數、教練口令和其他人的節奏會把你帶進去。',
            '你只需要跟上這一場。',
          ],
          meta: '不用自己找動力',
          button: '看本週可預約',
        },
        {
          image: 'train-different-poster.jpg',
          eyebrow: 'NO SALES',
          title: '不想入會，也可以買一場',
          paragraphs: [
            '不用諮詢，不用談合約。',
            '你只需要選時間，完成一次預約或付款。',
          ],
          meta: '單場體驗路徑',
          button: '選一場開始',
        },
      ],
    },
    newcomer_entry: {
      eyebrow: 'FIRST NIGHT',
      title: '這週先保留一場夜晚體驗',
      body: '你不用先有拳擊或泰拳基礎。先選一場 Fight Night，進場完成一段有節奏的體驗。',
      meta: '不用入會 · 不對打 · LINE 確認',
      button: '看 Fight Night 場次',
      cards: [
        {
          eyebrow: 'FIRST NIGHT',
          title: '這週先保留一場夜晚體驗',
          paragraphs: [
            '你不用先喜歡運動，也不用先決定入會。',
            '先把一場 Fight Night 保留下來。',
            '進場後，跟著教練、音樂和全場節奏完成 50 分鐘。',
          ],
          meta: '首堂免費體驗',
          button: '看 Fight Night 場次',
        },
        {
          image: 'hero-poster.jpg',
          eyebrow: 'FIGHT NIGHT',
          title: '不是冷冰冰的課程表',
          paragraphs: [
            '這是一場把拳擊、泰拳、節奏、教練帶領和現場氛圍編排好的體驗。',
            '你只要選一場，照時間到場。',
          ],
          meta: '適合第一次來的人',
          button: '選一場體驗',
        },
        {
          image: 'flow-step-5.jpg',
          eyebrow: 'LINE CONFIRM',
          title: '預約完成後在 LINE 確認',
          paragraphs: [
            '送出資料後，你會收到免費體驗確認卡。',
            '預約先完成，再決定要不要看首購優惠。',
          ],
          meta: '先預約，再看優惠',
          button: '保留免費體驗',
        },
      ],
    },
  }

  return copyByTemplate[templateId] || copyByTemplate.newcomer_entry
}

function getRecoveryCardParagraphs(card) {
  if (Array.isArray(card.paragraphs)) {
    return card.paragraphs.map((item) => trimText(item, 220)).filter(Boolean)
  }
  return String(card.body || '')
    .split(/\n\s*\n/)
    .map((item) => trimText(item, 220))
    .filter(Boolean)
}

function buildRecoveryCardBubble(card, targetUrl, env, request) {
  const paragraphs = getRecoveryCardParagraphs(card)
  const hasImage = Boolean(card.image)

  if (card.imageOnly && hasImage) {
    return {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: buildLineImageUrl(env, request, card.image),
        size: 'full',
        aspectRatio: card.imageAspectRatio || '3:4',
        aspectMode: card.imageAspectMode || 'cover',
      },
    }
  }

  return {
    type: 'bubble',
    size: 'mega',
    styles: {
      body: { backgroundColor: LINE_STORY_CARD_BG },
      footer: { backgroundColor: LINE_STORY_CARD_BG },
    },
    ...(hasImage
      ? {
          hero: {
            type: 'image',
            url: buildLineImageUrl(env, request, card.image),
            size: 'full',
            aspectRatio: card.imageAspectRatio || '20:13',
            aspectMode: card.imageAspectMode || 'cover',
          },
        }
      : {}),
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      paddingAll: 'xl',
      contents: [
        {
          type: 'text',
          text: card.eyebrow,
          size: 'xs',
          weight: 'bold',
          color: LINE_STORY_CARD_BLUE,
        },
        {
          type: 'text',
          text: card.title,
          weight: 'bold',
          size: 'xl',
          color: LINE_STORY_CARD_BLUE,
          wrap: true,
        },
        ...paragraphs.map((paragraph, index) => ({
          type: 'text',
          text: paragraph,
          size: 'md',
          color: LINE_STORY_CARD_TEXT,
          wrap: true,
          lineSpacing: '7px',
          margin: index === 0 ? 'md' : 'lg',
        })),
        {
          type: 'separator',
          margin: 'xl',
          color: '#DDE7F5',
        },
        {
          type: 'text',
          text: card.meta,
          size: 'sm',
          color: LINE_STORY_CARD_MUTED,
          wrap: true,
          margin: 'md',
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: 'xl',
      paddingTop: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'md',
          color: LINE_STORY_CARD_BLUE,
          action: {
            type: 'uri',
            label: card.button,
            uri: targetUrl,
          },
        },
      ],
    },
  }
}

function buildRecoveryMessage({ customer, templateId, targetUrl, env, request }) {
  const copy = getRecoveryMessageCopy(customer, templateId)
  const cards = copy.cards || [copy]

  return {
    type: 'flex',
    altText: `${copy.title}｜${copy.button}`,
    contents: {
      type: 'carousel',
      contents: cards.map((card) =>
        buildRecoveryCardBubble(card, targetUrl, env, request),
      ),
    },
  }
}

function buildRecoveryPreview({ customer, templateId, targetUrl, env, request }) {
  const copy = getRecoveryMessageCopy(customer, templateId)
  const cards = copy.cards || [copy]
  return {
    templateId,
    targetUrl,
    altText: `${copy.title}｜${copy.button}`,
    eyebrow: copy.eyebrow,
    title: copy.title,
    body: copy.body,
    meta: copy.meta,
    button: copy.button,
    cards: cards.map((card) => {
      const paragraphs = getRecoveryCardParagraphs(card)
      return {
        eyebrow: card.eyebrow,
        title: card.title,
        body: card.body || paragraphs.join('\n\n'),
        paragraphs,
        meta: card.meta,
        button: card.button,
        imageUrl: card.image ? buildLineImageUrl(env, request, card.image) : null,
        imageOnly: Boolean(card.imageOnly),
        imageAspectRatio: card.imageAspectRatio || null,
        imageAspectMode: card.imageAspectMode || null,
      }
    }),
    targetKind:
      templateId === 'pending_checkout' &&
      customer.latest_order_shopline_session_url &&
      String(customer.latest_order_status || '') === 'pending'
        ? 'shopline_checkout'
        : 'site_recovery',
  }
}

function parseD1Time(value) {
  if (!value) return null
  const normalized = String(value).includes('T')
    ? String(value)
    : `${String(value).replace(' ', 'T')}Z`
  const time = new Date(normalized).getTime()
  return Number.isFinite(time) ? time : null
}

function isWithinHours(value, hours) {
  const time = parseD1Time(value)
  if (!time) return false
  return Date.now() - time < hours * 60 * 60 * 1000
}

function getRecoveryBlockers(customer, env, templateId) {
  const blockers = []
  if (!customer?.line_user_id) blockers.push('缺少 LINE userId')
  if (!customer?.is_friend) blockers.push('不是 LINE 好友，不能由後台推播')
  if (toNumber(customer?.paid_orders) > 0) blockers.push('已有付款紀錄，避免再發喚回訊息')
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) blockers.push('Missing LINE_CHANNEL_ACCESS_TOKEN')
  if (
    templateId &&
    customer?.latest_recovery_template_id === templateId &&
    isWithinHours(
      customer.latest_recovery_sent_at || customer.latest_recovery_attempted_at,
      24,
    )
  ) {
    blockers.push('24 小時內已發過相同喚回卡')
  }
  return blockers
}

function buildRecoveryTarget(env, request, customer, recoveryId, templateId) {
  if (
    templateId === 'pending_checkout' &&
    customer.latest_order_shopline_session_url &&
    String(customer.latest_order_status || '') === 'pending'
  ) {
    return customer.latest_order_shopline_session_url
  }

  if (
    templateId === 'reserved_to_first_purchase' ||
    templateId === 'offer_viewed_unpaid'
  ) {
    return buildRecoveryOfferUrl(env, request, recoveryId, templateId)
  }

  return buildRecoveryTicketUrl(env, request, recoveryId, templateId)
}
async function previewLineRecoveryMessage(env, request, lineUserId, requestedTemplateId) {
  const customer = await getRecoveryCustomer(env, lineUserId)
  if (!customer) return { error: 'LINE customer not found', status: 404 }

  const templateId = chooseRecoveryTemplate(customer, requestedTemplateId)
  const targetUrl = buildRecoveryTarget(env, request, customer, 'preview', templateId)
  const blockers = getRecoveryBlockers(customer, env, templateId)

  return {
    ok: true,
    canSend: blockers.length === 0,
    blockers,
    preview: buildRecoveryPreview({ customer, templateId, targetUrl, env, request }),
  }
}

function normalizeLineUserIds(value, max = 100) {
  const ids = Array.isArray(value) ? value : []
  const seen = new Set()
  const normalized = []

  for (const id of ids) {
    const lineUserId = trimText(id, 160)
    if (!lineUserId || seen.has(lineUserId)) continue
    seen.add(lineUserId)
    normalized.push(lineUserId)
    if (normalized.length >= max) break
  }

  return normalized
}

async function previewLineRecoveryBatch(env, request, body = {}) {
  const lineUserIds = normalizeLineUserIds(body?.lineUserIds, 100)
  if (lineUserIds.length === 0) {
    return { error: '請先勾選 LINE 用戶', status: 400 }
  }

  const requestedTemplateId = trimText(body?.templateId, 80)
  const requestedSegment = trimText(body?.segment, 100) || null
  const recipients = []
  const previewsByTemplate = new Map()

  for (const lineUserId of lineUserIds) {
    const customer = await getRecoveryCustomer(env, lineUserId)
    if (!customer) {
      recipients.push({
        lineUserId,
        displayName: null,
        templateId: null,
        segment: requestedSegment || 'missing_customer',
        canSend: false,
        blockers: ['找不到 LINE 用戶'],
      })
      continue
    }

    const templateId = chooseRecoveryTemplate(customer, requestedTemplateId)
    const segment = requestedSegment || getRecoverySegment(customer)
    const targetUrl = buildRecoveryTarget(env, request, customer, 'preview', templateId)
    const blockers = getRecoveryBlockers(customer, env, templateId)
    const preview = buildRecoveryPreview({ customer, templateId, targetUrl, env, request })

    if (!previewsByTemplate.has(templateId)) {
      previewsByTemplate.set(templateId, preview)
    }

    recipients.push({
      lineUserId: customer.line_user_id,
      displayName: customer.display_name || null,
      pictureUrl: customer.picture_url || null,
      templateId,
      segment,
      targetUrl,
      canSend: blockers.length === 0,
      blockers,
    })
  }

  const sendableCount = recipients.filter((recipient) => recipient.canSend).length
  const blockedCount = recipients.length - sendableCount

  return {
    ok: true,
    templateId: getAllowedRecoveryTemplateId(requestedTemplateId) || 'auto',
    selectedCount: recipients.length,
    sendableCount,
    blockedCount,
    previews: Array.from(previewsByTemplate.values()),
    recipients,
  }
}

async function insertManualLineMessageLog(
  env,
  { recoveryId, customer, templateId, targetUrl, message, batchId, segment, staffNote },
) {
  await ensureLineMessageSendsTable(env)
  await ensureLineMessageSendMetadataColumns(env)
  await env.DB.prepare(
    `INSERT INTO line_message_sends (
       message_id, line_user_id, reference_id, source, message_type,
       template_id, target_url, status, message_json, batch_id, segment,
       staff_note, template_version, attempted_at
     ) VALUES (?, ?, ?, 'admin_manual', 'manual_recovery', ?, ?, 'sending', ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      recoveryId,
      customer.line_user_id,
      customer.latest_order_reference_id || null,
      templateId,
      targetUrl,
      JSON.stringify(message).slice(0, 8000),
      batchId || null,
      segment || null,
      staffNote || null,
      LINE_RECOVERY_TEMPLATE_VERSION,
    )
    .run()
}

async function updateManualLineMessageLog(env, recoveryId, result) {
  await env.DB.prepare(
    `UPDATE line_message_sends
     SET status = ?,
         response_json = ?,
         error = ?,
         sent_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE sent_at END,
         attempted_at = datetime('now')
     WHERE message_id = ?`,
  )
    .bind(
      trimText(result.status, 80),
      result.response ? JSON.stringify(result.response).slice(0, 8000) : null,
      result.error ? trimText(result.error, 1000) : null,
      result.status,
      recoveryId,
    )
    .run()
}

async function getRecoveryCustomer(env, lineUserId) {
  const hasOrdersTable = Boolean(
    await safeFirst(
      env,
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = 'course_orders'`,
    ),
  )

  if (!hasOrdersTable) {
    return safeFirst(
      env,
      `SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.email,
              lc.email_verified, lc.is_friend, lc.access_count, lc.last_seen_at,
              0 AS total_orders, 0 AS paid_orders, 0 AS pending_orders,
              0 AS free_reserved_orders, 0 AS paid_revenue,
              NULL AS latest_recovery_template_id,
              NULL AS latest_recovery_status,
              NULL AS latest_recovery_sent_at,
              NULL AS latest_recovery_attempted_at
       FROM line_customers lc
       WHERE lc.line_user_id = ?`,
      [lineUserId],
    )
  }

  return safeFirst(
    env,
    `WITH order_ranked AS (
       SELECT co.line_user_id, co.reference_id, co.status, co.course_name,
              co.amount_value, co.currency, co.shopline_session_url,
              co.source_path, co.created_at, co.updated_at, co.paid_at,
              ROW_NUMBER() OVER (
                PARTITION BY co.line_user_id
                ORDER BY
                  CASE WHEN co.status IN ('pending', 'payment_processing', 'session_failed') THEN 0 ELSE 1 END,
                  datetime(COALESCE(co.paid_at, co.updated_at, co.created_at)) DESC,
                  co.reference_id DESC
              ) AS rn
       FROM course_orders co
       WHERE co.line_user_id = ?
     ),
     order_stats AS (
       SELECT line_user_id,
              COUNT(*) AS total_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
              COALESCE(SUM(CASE WHEN status IN ('pending', 'payment_processing', 'session_failed') THEN 1 ELSE 0 END), 0) AS pending_orders,
              COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_reserved_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS paid_revenue
       FROM order_ranked
       GROUP BY line_user_id
     ),
     latest_recovery AS (
       SELECT line_user_id, template_id, status, sent_at, attempted_at,
              ROW_NUMBER() OVER (
                PARTITION BY line_user_id
                ORDER BY datetime(COALESCE(sent_at, attempted_at, created_at)) DESC, id DESC
              ) AS rn
       FROM line_recovery_messages
     )
     SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.email,
            lc.email_verified, lc.is_friend, lc.access_count, lc.last_seen_at,
            COALESCE(os.total_orders, 0) AS total_orders,
            COALESCE(os.paid_orders, 0) AS paid_orders,
            COALESCE(os.pending_orders, 0) AS pending_orders,
            COALESCE(os.free_reserved_orders, 0) AS free_reserved_orders,
            COALESCE(os.paid_revenue, 0) AS paid_revenue,
            latest.reference_id AS latest_order_reference_id,
            latest.status AS latest_order_status,
            latest.course_name AS latest_order_course_name,
            latest.amount_value AS latest_order_amount_value,
            latest.currency AS latest_order_currency,
            latest.shopline_session_url AS latest_order_shopline_session_url,
            latest.source_path AS latest_order_source_path,
            lr.template_id AS latest_recovery_template_id,
            lr.status AS latest_recovery_status,
            lr.sent_at AS latest_recovery_sent_at,
            lr.attempted_at AS latest_recovery_attempted_at
     FROM line_customers lc
     LEFT JOIN order_stats os ON os.line_user_id = lc.line_user_id
     LEFT JOIN order_ranked latest
       ON latest.line_user_id = lc.line_user_id AND latest.rn = 1
     LEFT JOIN latest_recovery lr ON lr.line_user_id = lc.line_user_id AND lr.rn = 1
     WHERE lc.line_user_id = ?`,
    [lineUserId, lineUserId],
  )
}

async function sendLineRecoveryMessage(env, request, lineUserId, body = {}) {
  const customer = await getRecoveryCustomer(env, lineUserId)
  if (!customer) return { error: 'LINE customer not found', status: 404 }
  if (!customer.is_friend) {
    return { error: '這位用戶不是 LINE 好友，無法主動推播。', status: 409 }
  }
  if (toNumber(customer.paid_orders) > 0) {
    return { error: '這位用戶已有付款紀錄，已略過喚回訊息。', status: 409 }
  }
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    return { error: 'Missing LINE_CHANNEL_ACCESS_TOKEN', status: 503 }
  }

  const recoveryId = createRecoveryId()
  const templateId = chooseRecoveryTemplate(
    customer,
    trimText(body?.templateId, 80),
  )
  const blockers = getRecoveryBlockers(customer, env, templateId)
  if (blockers.length > 0) {
    return { error: blockers.join('；'), status: 409, templateId, blockers }
  }

  const batchId = trimText(body?.batchId, 100) || null
  const segment = trimText(body?.segment || getRecoverySegment(customer), 100) || null
  const staffNote = trimText(body?.staffNote, 500) || null
  const targetUrl = buildRecoveryTarget(env, request, customer, recoveryId, templateId)
  const message = buildRecoveryMessage({ customer, templateId, targetUrl, env, request })

  await env.DB.prepare(
    `INSERT INTO line_recovery_messages (
       recovery_id, line_user_id, batch_id, template_id, segment, target_url, status,
       message_json, staff_note, template_version, attempted_at
     ) VALUES (?, ?, ?, ?, ?, ?, 'sending', ?, ?, ?, datetime('now'))`,
  )
    .bind(
      recoveryId,
      customer.line_user_id,
      batchId,
      templateId,
      segment,
      targetUrl,
      JSON.stringify(message),
      staffNote,
      LINE_RECOVERY_TEMPLATE_VERSION,
    )
    .run()
  await insertManualLineMessageLog(env, {
    recoveryId,
    customer,
    templateId,
    targetUrl,
    message,
    batchId,
    segment,
    staffNote,
  })

  try {
    const response = await fetch(LINE_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        to: customer.line_user_id,
        messages: [message],
      }),
    })
    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      const error = `LINE push failed with HTTP ${response.status}`
      await env.DB.prepare(
        `UPDATE line_recovery_messages
         SET status = 'failed',
             response_json = ?,
             error = ?,
             attempted_at = datetime('now')
         WHERE recovery_id = ?`,
      )
        .bind(
          responseBody ? JSON.stringify(responseBody).slice(0, 8000) : null,
          error,
          recoveryId,
        )
        .run()

      await updateManualLineMessageLog(env, recoveryId, {
        status: 'failed',
        response: responseBody,
        error,
      })

      return { error, status: 502, recoveryId, templateId, response: responseBody }
    }

    await env.DB.prepare(
      `UPDATE line_recovery_messages
       SET status = 'sent',
           response_json = ?,
           sent_at = datetime('now'),
           attempted_at = datetime('now')
       WHERE recovery_id = ?`,
    )
      .bind(
        responseBody ? JSON.stringify(responseBody).slice(0, 8000) : JSON.stringify({ ok: true }),
        recoveryId,
      )
      .run()
    await updateManualLineMessageLog(env, recoveryId, {
      status: 'sent',
      response: responseBody || { ok: true },
    })

    return {
      ok: true,
      status: 'sent',
      recoveryId,
      templateId,
      targetUrl,
    }
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : 'LINE push request failed'
    await env.DB.prepare(
      `UPDATE line_recovery_messages
       SET status = 'failed',
           error = ?,
           attempted_at = datetime('now')
       WHERE recovery_id = ?`,
    )
      .bind(messageText, recoveryId)
      .run()
    await updateManualLineMessageLog(env, recoveryId, {
      status: 'failed',
      error: messageText,
    })

    return { error: messageText, status: 502, recoveryId, templateId }
  }
}

async function sendLineRecoveryBatch(env, request, body = {}) {
  if (body?.confirmed !== true) {
    return { error: '批次發送前必須先確認預覽結果', status: 400 }
  }

  const lineUserIds = normalizeLineUserIds(body?.lineUserIds, LINE_RECOVERY_BATCH_LIMIT)
  if (lineUserIds.length === 0) {
    return { error: '請先勾選 LINE 用戶', status: 400 }
  }

  const requestedTemplateId = trimText(body?.templateId, 80)
  const segment = trimText(body?.segment, 100) || null
  const staffNote = trimText(body?.staffNote, 500) || null
  const batchPreview = await previewLineRecoveryBatch(env, request, {
    lineUserIds,
    templateId: requestedTemplateId,
    segment,
  })

  if (!batchPreview.ok) return batchPreview

  const batchId = createRecoveryBatchId()
  const sendableRecipients = batchPreview.recipients.filter((recipient) => recipient.canSend)
  const blockedRecipients = batchPreview.recipients.filter((recipient) => !recipient.canSend)

  await env.DB.prepare(
    `INSERT INTO line_recovery_batches (
       batch_id, template_id, segment, selected_count, sendable_count,
       blocked_count, status, staff_note, created_by, confirmed_at
     ) VALUES (?, ?, ?, ?, ?, ?, 'sending', ?, 'admin', datetime('now'))`,
  )
    .bind(
      batchId,
      batchPreview.templateId,
      segment,
      batchPreview.selectedCount,
      batchPreview.sendableCount,
      batchPreview.blockedCount,
      staffNote,
    )
    .run()

  const results = []
  let sentCount = 0
  let failedCount = 0

  for (const recipient of sendableRecipients) {
    const result = await sendLineRecoveryMessage(env, request, recipient.lineUserId, {
      templateId: recipient.templateId,
      batchId,
      segment: recipient.segment,
      staffNote,
    })

    if (result.ok) {
      sentCount += 1
    } else {
      failedCount += 1
    }

    results.push({
      lineUserId: recipient.lineUserId,
      displayName: recipient.displayName || null,
      templateId: recipient.templateId,
      segment: recipient.segment,
      ok: Boolean(result.ok),
      status: result.status || null,
      recoveryId: result.recoveryId || null,
      error: result.error || null,
    })
  }

  const finalStatus =
    failedCount > 0 ? 'completed_with_errors' : 'completed'

  await env.DB.prepare(
    `UPDATE line_recovery_batches
     SET sent_count = ?,
         failed_count = ?,
         status = ?,
         completed_at = datetime('now')
     WHERE batch_id = ?`,
  )
    .bind(sentCount, failedCount, finalStatus, batchId)
    .run()

  return {
    ok: true,
    batchId,
    status: finalStatus,
    selectedCount: batchPreview.selectedCount,
    sendableCount: batchPreview.sendableCount,
    blockedCount: batchPreview.blockedCount,
    sentCount,
    failedCount,
    blockedRecipients,
    results,
  }
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
  const action = parts[2] || ''
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

  if (resource === 'line-customers' && id && action === 'recovery-preview') {
    const result = await previewLineRecoveryMessage(
      env,
      request,
      id,
      trimText(url.searchParams.get('templateId'), 80),
    )
    if (result.ok) return json(result)
    return json({ error: result.error, ...result }, { status: result.status || 500 })
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

  if (resource === 'line-messages') {
    return json({ ok: true, messages: await listLineMessages(env, url) })
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

  if (resource === 'orders' && id && action === 'resend-line-confirmation') {
    const result = await resendOrderLineConfirmation(env, id)
    if (result.ok) return json(result)
    return json({ error: result.error, ...result }, { status: result.status || 500 })
  }

  if (resource === 'line-recovery' && id === 'preview-batch') {
    const body = await request.json().catch(() => ({}))
    const result = await previewLineRecoveryBatch(env, request, body)
    if (result.ok) return json(result)
    return json({ error: result.error, ...result }, { status: result.status || 500 })
  }

  if (resource === 'line-recovery' && id === 'send-batch') {
    const body = await request.json().catch(() => ({}))
    const result = await sendLineRecoveryBatch(env, request, body)
    if (result.ok) return json(result)
    return json({ error: result.error, ...result }, { status: result.status || 500 })
  }

  if (resource === 'line-customers' && id && action === 'send-recovery') {
    const body = await request.json().catch(() => ({}))
    const result = await sendLineRecoveryMessage(env, request, id, body)
    if (result.ok) return json(result)
    return json({ error: result.error, ...result }, { status: result.status || 500 })
  }

  return json({ error: 'Not found' }, { status: 404 })
}
