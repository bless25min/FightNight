const MAX_PAYLOAD_BYTES = 16 * 1024

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

function trimText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function normalizeEventName(value) {
  return trimText(value, 80).replace(/[^a-zA-Z0-9_:-]/g, '_')
}

async function ensureTables(env) {
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
        canonical_route_path TEXT,
        landing_path TEXT,
        first_landing_path TEXT,
        source_channel TEXT,
        first_source_channel TEXT,
        experiment_id TEXT,
        experiment_variant TEXT,
        first_experiment_variant TEXT,
        split_visit_id TEXT,
        split_assignment_mode TEXT,
        split_original_path TEXT,
        split_assigned_path TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_content TEXT,
        utm_term TEXT,
        click_id_type TEXT,
        click_id_value TEXT,
        fbp TEXT,
        fbc TEXT,
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
  ])

  await ensureColumns(env)
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
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_canonical_route_created
       ON tracking_events (canonical_route_path, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_experiment_created
       ON tracking_events (experiment_id, experiment_variant, created_at)`,
    ),
  ])
}

async function ensureColumns(env) {
  const columns = [
    ['landing_path', 'TEXT'],
    ['first_landing_path', 'TEXT'],
    ['referrer_host', 'TEXT'],
    ['canonical_route_path', 'TEXT'],
    ['source_channel', 'TEXT'],
    ['first_source_channel', 'TEXT'],
    ['experiment_id', 'TEXT'],
    ['experiment_variant', 'TEXT'],
    ['first_experiment_variant', 'TEXT'],
    ['split_visit_id', 'TEXT'],
    ['split_assignment_mode', 'TEXT'],
    ['split_original_path', 'TEXT'],
    ['split_assigned_path', 'TEXT'],
    ['utm_source', 'TEXT'],
    ['utm_medium', 'TEXT'],
    ['utm_campaign', 'TEXT'],
    ['utm_content', 'TEXT'],
    ['utm_term', 'TEXT'],
    ['click_id_type', 'TEXT'],
    ['click_id_value', 'TEXT'],
    ['fbp', 'TEXT'],
    ['fbc', 'TEXT'],
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

function readNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function readInteger(value) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.round(number) : null
}

function readBooleanInteger(value) {
  if (value === true || value === 1 || value === '1' || value === 'true') return 1
  if (value === false || value === 0 || value === '0' || value === 'false') return 0
  return null
}

function readParamText(params, key, maxLength = 240) {
  return trimText(params?.[key], maxLength) || null
}

function canonicalizeRoutePath(value) {
  const raw = trimText(value, 800)
  if (!raw) return '/'

  const hashRouteIndex = raw.indexOf('#/')
  let pathname = hashRouteIndex >= 0 ? raw.slice(hashRouteIndex + 1) : raw
  try {
    if (hashRouteIndex < 0) {
      pathname = new URL(raw, 'https://fightnight.local').pathname
    }
  } catch {
    pathname = raw
  }

  const pathWithoutHash = pathname.split('#')[0] || pathname
  const pathWithoutQuery = pathWithoutHash.split('?')[0] || '/'
  const cleaned = trimText(pathWithoutQuery, 400).replace(/\/+$/, '') || '/'
  const normalized = cleaned.startsWith('/') ? cleaned : `/${cleaned}`
  const lower = normalized.toLowerCase()

  if (lower === '/index.html') return '/'
  if (lower === '/boot-camp' || lower === '/boot-camp.html') return '/boot-camp'
  if (lower.startsWith('/boot-camp/')) return '/boot-camp'
  if (lower === '/fight-night-event' || lower === '/fight-night-event.html') {
    return '/fight-night-event'
  }
  if (lower.startsWith('/fight-night-event/')) return '/fight-night-event'
  if (lower === '/paid-event' || lower === '/paid-event.html') return '/paid-event'
  if (lower.startsWith('/paid-event/')) return '/paid-event'
  if (lower === '/fight-night-intro' || lower === '/fight-night-intro.html') {
    return '/fight-night-intro'
  }
  if (lower.startsWith('/fight-night-intro/')) return '/fight-night-intro'
  if (lower === '/offers' || lower === '/offers.html') return '/offers'
  if (lower.startsWith('/offers/')) return '/offers'
  if (lower === '/payment/success' || lower.startsWith('/payment/success/')) {
    return '/payment/success'
  }
  if (lower.startsWith('/guides/')) return '/guides'
  if (lower === '/privacy-policy' || lower === '/privacy-policy.html') {
    return '/privacy-policy'
  }
  if (lower === '/terms-of-service' || lower === '/terms-of-service.html') {
    return '/terms-of-service'
  }
  if (lower === '/refund-policy' || lower === '/refund-policy.html') {
    return '/refund-policy'
  }
  if (lower.startsWith('/admin')) return '/admin'

  return normalized
}

function readCanonicalRoutePath(params, routePath) {
  return readParamText(params, 'canonical_route_path', 240) || canonicalizeRoutePath(routePath)
}

function readCfText(request, key, maxLength = 120) {
  return trimText(request.cf?.[key], maxLength) || null
}

function readHeaderText(request, key, maxLength = 240) {
  return trimText(request.headers.get(key), maxLength) || null
}

function readCfInteger(request, key) {
  const value = Number(request.cf?.[key])
  return Number.isFinite(value) ? Math.round(value) : null
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const rawBody = await request.text()
  if (rawBody.length > MAX_PAYLOAD_BYTES) {
    return json({ error: 'Payload too large' }, { status: 413 })
  }

  let body
  try {
    body = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const eventName = normalizeEventName(body?.event || body?.eventName)
  const anonymousId = trimText(body?.anonymousId, 120)
  const sessionId = trimText(body?.sessionId, 120)

  if (!eventName || !anonymousId || !sessionId) {
    return json({ error: 'Missing event, anonymousId, or sessionId' }, { status: 400 })
  }

  const params = body?.params && typeof body.params === 'object' ? body.params : {}
  const eventValue = readNumber(body?.eventValue ?? params.event_value ?? params.value)
  const currency = trimText(body?.currency ?? params.currency ?? 'TWD', 12) || 'TWD'
  const eventId = trimText(body?.eventId ?? params.event_id, 160) || null

  await ensureTables(env)
  const routePath = trimText(body?.routePath, 400) || null

  await env.DB.prepare(
    `INSERT OR IGNORE INTO tracking_events (
      anonymous_id, session_id, event_name, event_id, event_value, currency,
      source_url, referrer, referrer_host, route_path, canonical_route_path,
      landing_path, first_landing_path, source_channel, first_source_channel, experiment_id,
      experiment_variant, first_experiment_variant, split_visit_id,
      split_assignment_mode, split_original_path, split_assigned_path, utm_source,
      utm_medium, utm_campaign, utm_content, utm_term, click_id_type,
      click_id_value, fbp, fbc, device_type, browser_name, os_name, in_app_browser,
      browser_language, timezone, visitor_type, session_index, viewport_width,
      viewport_height, screen_width, screen_height, duration_ms, scroll_depth,
      max_scroll_depth, interaction_count, is_bounce, section_id, cta_id,
      target_text, cf_country, cf_region, cf_city, cf_continent, cf_timezone,
      cf_colo, cf_asn, cf_as_organization, cf_ray, cf_http_protocol,
      cf_tls_version, payload_json, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      anonymousId,
      sessionId,
      eventName,
      eventId,
      eventValue,
      currency,
      trimText(body?.sourceUrl, 1200) || null,
      trimText(body?.referrer, 1200) || null,
      readParamText(params, 'referrer_host', 240),
      routePath,
      readCanonicalRoutePath(params, routePath),
      readParamText(params, 'landing_path', 400),
      readParamText(params, 'first_landing_path', 400),
      readParamText(params, 'source_channel', 80),
      readParamText(params, 'first_source_channel', 80),
      readParamText(params, 'experiment_id', 80),
      readParamText(params, 'experiment_variant', 40),
      readParamText(params, 'first_experiment_variant', 40),
      readParamText(params, 'split_visit_id', 120),
      readParamText(params, 'split_assignment_mode', 80),
      readParamText(params, 'split_original_path', 600),
      readParamText(params, 'split_assigned_path', 240),
      readParamText(params, 'utm_source', 160),
      readParamText(params, 'utm_medium', 160),
      readParamText(params, 'utm_campaign', 240),
      readParamText(params, 'utm_content', 240),
      readParamText(params, 'utm_term', 240),
      readParamText(params, 'click_id_type', 60),
      readParamText(params, 'click_id_value', 1200),
      readParamText(params, 'fbp', 160),
      readParamText(params, 'fbc', 1200),
      readParamText(params, 'device_type', 40),
      readParamText(params, 'browser_name', 80),
      readParamText(params, 'os_name', 80),
      readParamText(params, 'in_app_browser', 80),
      readParamText(params, 'browser_language', 40),
      readParamText(params, 'timezone', 120),
      readParamText(params, 'visitor_type', 40),
      readInteger(params.session_index),
      readInteger(params.viewport_width),
      readInteger(params.viewport_height),
      readInteger(params.screen_width),
      readInteger(params.screen_height),
      readInteger(params.duration_ms),
      readInteger(params.scroll_depth),
      readInteger(params.max_scroll_depth),
      readInteger(params.interaction_count),
      readBooleanInteger(params.is_bounce),
      readParamText(params, 'section_id', 160),
      readParamText(params, 'cta_id', 240),
      readParamText(params, 'target_text', 240),
      trimText(request.headers.get('cf-ipcountry'), 20) || readCfText(request, 'country', 20),
      readCfText(request, 'region', 120) || readCfText(request, 'regionCode', 80),
      readCfText(request, 'city', 120),
      readCfText(request, 'continent', 20),
      readCfText(request, 'timezone', 120),
      readCfText(request, 'colo', 20),
      readCfInteger(request, 'asn'),
      readCfText(request, 'asOrganization', 240),
      readHeaderText(request, 'cf-ray', 120),
      readCfText(request, 'httpProtocol', 80),
      readCfText(request, 'tlsVersion', 80),
      JSON.stringify(params).slice(0, MAX_PAYLOAD_BYTES),
      trimText(request.headers.get('user-agent'), 800) || null,
    )
    .run()

  return json({ ok: true })
}
