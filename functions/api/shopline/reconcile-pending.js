import { reconcilePendingOrders } from './reconcile.js'

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
  return request.headers.get('x-admin-token') || ''
}

function getOptions(request, env) {
  const url = new URL(request.url)
  return {
    limit:
      Number(url.searchParams.get('limit')) ||
      Number(env.SHOPLINE_RECONCILE_LIMIT || 40),
    lookbackHours:
      Number(url.searchParams.get('lookbackHours')) ||
      Number(env.SHOPLINE_RECONCILE_LOOKBACK_HOURS || 48),
    minAgeSeconds:
      Number(url.searchParams.get('minAgeSeconds')) ||
      Number(env.SHOPLINE_RECONCILE_MIN_AGE_SECONDS || 90),
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  if (!env.ADMIN_TOKEN || getAdminToken(request) !== env.ADMIN_TOKEN) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await reconcilePendingOrders(env, getOptions(request, env))
  return json({ ok: true, ...result })
}
