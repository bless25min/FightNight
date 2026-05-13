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

function parseSessionIds(request) {
  const url = new URL(request.url)
  return Array.from(
    new Set(
      (url.searchParams.get('ids') || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 100),
    ),
  )
}

function defaultRecord(sessionId) {
  return {
    sessionId,
    capacity: DEFAULT_CAPACITY,
    sold: 0,
    remaining: DEFAULT_CAPACITY,
  }
}

export async function onRequestGet({ request, env }) {
  const ids = parseSessionIds(request)
  const availability = Object.fromEntries(
    ids.map((id) => [id, defaultRecord(id)]),
  )

  if (!env.DB || ids.length === 0) {
    return json({ availability })
  }

  const placeholders = ids.map(() => '?').join(',')
  const { results } = await env.DB.prepare(
    `SELECT session_id, capacity, sold, updated_at
     FROM session_inventory
     WHERE session_id IN (${placeholders})`,
  )
    .bind(...ids)
    .all()

  for (const row of results || []) {
    const capacity = Math.max(0, Number(row.capacity ?? DEFAULT_CAPACITY))
    const sold = Math.max(0, Number(row.sold ?? 0))
    const remaining = Math.max(0, capacity - sold)
    availability[row.session_id] = {
      sessionId: row.session_id,
      capacity,
      sold,
      remaining,
      updatedAt: row.updated_at,
    }
  }

  return json({ availability })
}
