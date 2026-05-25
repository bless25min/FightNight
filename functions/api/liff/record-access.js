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

async function ensureTables(env) {
  await env.DB.batch([
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
    const rawProfileJson = JSON.stringify(profile)

    await ensureTables(env)

    await env.DB.prepare(
      `INSERT INTO line_customers (
        line_user_id, display_name, picture_url, status_message, is_friend,
        access_count, raw_profile_json, first_seen_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
      ON CONFLICT(line_user_id) DO UPDATE SET
        display_name = excluded.display_name,
        picture_url = excluded.picture_url,
        status_message = excluded.status_message,
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
        trimText(body?.placement, 120) || null,
        trimText(body?.sourcePath, 800) || null,
        isFriend,
        rawProfileJson,
      )
      .run()

    return json({
      ok: true,
      lineUserId,
      displayName: trimText(profile?.displayName, 200) || 'LINE user',
      pictureUrl: trimText(profile?.pictureUrl, 1200) || null,
      isFriend: Boolean(isFriend),
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
