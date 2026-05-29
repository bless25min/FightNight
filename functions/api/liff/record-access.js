import { sendMetaLeadEvent } from '../shopline/meta-capi.js'

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

function normalizeEmail(value) {
  const email = trimText(value, 320).toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

function getLineChannelId(env) {
  return trimText(
    env.LINE_LOGIN_CHANNEL_ID ||
      env.VITE_LINE_LOGIN_CHANNEL_ID ||
      env.LINE_CHANNEL_ID ||
      env.LINE_LIFF_CHANNEL_ID,
    80,
  )
}

async function verifyLineIdToken(idToken, env) {
  const channelId = getLineChannelId(env)
  if (!idToken || !channelId) return null

  const body = new URLSearchParams()
  body.set('id_token', idToken)
  body.set('client_id', channelId)

  const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) return null
  return response.json().catch(() => null)
}

async function ensureTables(env) {
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

  await ensureLineCustomerColumns(env)
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
      if (!(error instanceof Error) || !/duplicate column/i.test(error.message)) {
        throw error
      }
    }
  }
}

async function fetchLineProfile(accessToken) {
  const response = await fetch('https://api.line.me/v2/profile', {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('LINE profile verification failed')
  }

  return response.json()
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)
  const accessToken = trimText(body?.accessToken, 2000)
  if (!accessToken) {
    return json({ error: 'Missing accessToken' }, { status: 400 })
  }

  try {
    const profile = await fetchLineProfile(accessToken)
    const lineUserId = trimText(profile?.userId, 120)
    if (!lineUserId) {
      return json({ error: 'LINE profile is missing userId' }, { status: 400 })
    }

    const isFriend = body?.friendFlag === true || body?.isFriend === true ? 1 : 0
    const verifiedToken = await verifyLineIdToken(trimText(body?.idToken, 4000), env)
    const tokenMatchesProfile = verifiedToken?.sub && verifiedToken.sub === lineUserId
    const verifiedEmail = tokenMatchesProfile ? normalizeEmail(verifiedToken?.email) : null
    const submittedEmail = normalizeEmail(body?.email || body?.lineEmail)
    const lineEmail = verifiedEmail || submittedEmail
    const lineEmailVerified = verifiedEmail ? 1 : 0
    const rawProfileJson = JSON.stringify(profile)
    const placement = trimText(body?.placement, 120) || null
    const sourcePath = trimText(body?.sourcePath, 800) || null

    await ensureTables(env)

    const existingCustomer = await env.DB.prepare(
      `SELECT line_user_id FROM line_customers WHERE line_user_id = ?`,
    )
      .bind(lineUserId)
      .first()
    const isNewCustomer = !existingCustomer

    await env.DB.prepare(
      `INSERT INTO line_customers (
        line_user_id, display_name, picture_url, status_message, email,
        email_verified, email_updated_at, is_friend, access_count,
        raw_profile_json, first_seen_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
      ON CONFLICT(line_user_id) DO UPDATE SET
        display_name = excluded.display_name,
        picture_url = excluded.picture_url,
        status_message = excluded.status_message,
        email = CASE
          WHEN excluded.email IS NULL THEN line_customers.email
          WHEN line_customers.email IS NULL THEN excluded.email
          WHEN excluded.email_verified = 1 THEN excluded.email
          WHEN COALESCE(line_customers.email_verified, 0) = 0 THEN excluded.email
          ELSE line_customers.email
        END,
        email_verified = CASE
          WHEN excluded.email IS NULL THEN COALESCE(line_customers.email_verified, 0)
          WHEN excluded.email_verified = 1 THEN 1
          ELSE COALESCE(line_customers.email_verified, 0)
        END,
        email_updated_at = CASE
          WHEN excluded.email IS NULL THEN line_customers.email_updated_at
          WHEN line_customers.email IS NULL OR excluded.email_verified = 1 OR COALESCE(line_customers.email_verified, 0) = 0 THEN datetime('now')
          ELSE line_customers.email_updated_at
        END,
        is_friend = excluded.is_friend,
        access_count = line_customers.access_count + 1,
        raw_profile_json = excluded.raw_profile_json,
        last_seen_at = datetime('now')`,
    )
      .bind(
        lineUserId,
        trimText(profile?.displayName, 200) || 'LINE user',
        trimText(profile?.pictureUrl, 1200) || null,
        trimText(profile?.statusMessage, 400) || null,
        lineEmail,
        lineEmailVerified,
        lineEmail ? new Date().toISOString() : null,
        isFriend,
        rawProfileJson,
      )
      .run()

    await env.DB.prepare(
      `INSERT INTO liff_access_events (
        line_user_id, placement, source_path, is_friend, raw_profile_json
      ) VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(
        lineUserId,
        placement,
        sourcePath,
        isFriend,
        rawProfileJson,
      )
      .run()

    let metaLead = null
    if (isNewCustomer) {
      try {
        metaLead = await sendMetaLeadEvent({
          env,
          request,
          lead: {
            lineUserId,
            eventId: trimText(body?.leadEventId, 160) || undefined,
            email: lineEmail,
            isFriend: Boolean(isFriend),
            placement,
            sourcePath,
            tracking:
              body?.tracking && typeof body.tracking === 'object'
                ? body.tracking
                : {},
            client:
              body?.client && typeof body.client === 'object'
                ? body.client
                : {},
          },
        })
      } catch (error) {
        metaLead = {
          ok: false,
          status: 'failed',
          error:
            error instanceof Error
              ? error.message
              : 'Failed to send Meta Lead event',
        }
      }
    }

    return json({
      ok: true,
      lineUserId,
      displayName: trimText(profile?.displayName, 200) || 'LINE user',
      pictureUrl: trimText(profile?.pictureUrl, 1200) || null,
      email: lineEmail,
      emailVerified: Boolean(lineEmailVerified),
      isFriend: Boolean(isFriend),
      metaLead: metaLead
        ? {
            ok: metaLead.ok === true,
            skipped: metaLead.skipped === true,
            status: metaLead.status || 'unknown',
            eventId: metaLead.eventId || null,
          }
        : null,
    })
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to record LIFF access',
      },
      { status: 400 },
    )
  }
}
