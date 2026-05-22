const DEFAULT_CAPACITY = 6

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

function normalizeSessionIds(value) {
  const ids = Array.isArray(value) ? value : [value]
  return Array.from(
    new Set(
      ids
        .map((id) => String(id || '').trim())
        .filter(Boolean)
        .slice(0, 8),
    ),
  )
}

async function getAvailability(env, sessionIds) {
  const placeholders = sessionIds.map(() => '?').join(',')
  const { results } = await env.DB.prepare(
    `SELECT session_id, capacity, sold, updated_at
     FROM session_inventory
     WHERE session_id IN (${placeholders})`,
  )
    .bind(...sessionIds)
    .all()

  return Object.fromEntries(
    (results || []).map((row) => {
      const capacity = Math.max(0, Number(row.capacity ?? DEFAULT_CAPACITY))
      const sold = Math.max(0, Number(row.sold ?? 0))
      return [
        row.session_id,
        {
          sessionId: row.session_id,
          capacity,
          sold,
          remaining: Math.max(0, capacity - sold),
          updatedAt: row.updated_at,
        },
      ]
    }),
  )
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const token = request.headers.get('x-inventory-token')
  if (!env.INVENTORY_WRITE_TOKEN || token !== env.INVENTORY_WRITE_TOKEN) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const sessionIds = normalizeSessionIds(body?.sessionIds ?? body?.sessionId)
  const quantity = Math.max(1, Math.min(6, Number(body?.quantity ?? 1)))

  if (sessionIds.length === 0) {
    return json({ error: 'Missing sessionIds' }, { status: 400 })
  }

  for (const sessionId of sessionIds) {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO session_inventory
       (session_id, capacity, sold, updated_at)
       VALUES (?, ?, 0, datetime('now'))`,
    )
      .bind(sessionId, DEFAULT_CAPACITY)
      .run()
  }

  const touched = []

  for (const sessionId of sessionIds) {
    const result = await env.DB.prepare(
      `UPDATE session_inventory
       SET sold = sold + ?, updated_at = datetime('now')
       WHERE session_id = ? AND sold + ? <= capacity`,
    )
      .bind(quantity, sessionId, quantity)
      .run()

    if (!result.meta?.changes) {
      for (const touchedSessionId of touched) {
        await env.DB.prepare(
          `UPDATE session_inventory
           SET sold = MAX(0, sold - ?), updated_at = datetime('now')
           WHERE session_id = ?`,
        )
          .bind(quantity, touchedSessionId)
          .run()
      }

      return json(
        {
          error: 'Sold out',
          availability: await getAvailability(env, sessionIds),
        },
        { status: 409 },
      )
    }

    touched.push(sessionId)
  }

  return json({
    ok: true,
    availability: await getAvailability(env, sessionIds),
  })
}
