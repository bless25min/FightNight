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
  ])
}

function readNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
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

  await env.DB.prepare(
    `INSERT OR IGNORE INTO tracking_events (
      anonymous_id, session_id, event_name, event_id, event_value, currency,
      source_url, referrer, route_path, payload_json, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      trimText(body?.routePath, 400) || null,
      JSON.stringify(params).slice(0, MAX_PAYLOAD_BYTES),
      trimText(request.headers.get('user-agent'), 800) || null,
    )
    .run()

  return json({ ok: true })
}
