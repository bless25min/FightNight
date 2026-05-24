const DEFAULT_GRAPH_API_VERSION = 'v21.0'

function firstPresent(...values) {
  for (const value of values) {
    const normalized = String(value || '').trim()
    if (normalized) return normalized
  }
  return ''
}

function cleanObject(value) {
  if (Array.isArray(value)) {
    const cleaned = value.map(cleanObject).filter((entry) => entry !== undefined)
    return cleaned.length ? cleaned : undefined
  }

  if (value && typeof value === 'object') {
    const cleanedEntries = Object.entries(value)
      .map(([key, entryValue]) => [key, cleanObject(entryValue)])
      .filter(([, entryValue]) => {
        if (entryValue === undefined || entryValue === null) return false
        if (typeof entryValue === 'string' && entryValue.trim() === '') return false
        return true
      })

    return cleanedEntries.length ? Object.fromEntries(cleanedEntries) : undefined
  }

  return value
}

function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/[^\d]/g, '')
  if (digits.startsWith('886')) return digits
  if (digits.startsWith('0')) return `886${digits.slice(1)}`
  return digits
}

async function sha256Hex(value) {
  const normalized = String(value || '').trim()
  if (!normalized) return ''

  const data = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

function getGraphApiVersion(env) {
  const version = firstPresent(env.META_GRAPH_API_VERSION)
  return version || DEFAULT_GRAPH_API_VERSION
}

function getMetaPixelId(env) {
  return firstPresent(env.META_PIXEL_ID, env.VITE_META_PIXEL_ID)
}

function getMetaAccessToken(env) {
  return firstPresent(
    env.META_CAPI_ACCESS_TOKEN,
    env.META_ACCESS_TOKEN,
    env.FACEBOOK_CAPI_ACCESS_TOKEN,
    env.META_CONVERSIONS_API_ACCESS_TOKEN,
  )
}

function getRequestSnapshot(order) {
  const raw = safeJsonParse(order.raw_request_json)
  if (!raw || typeof raw !== 'object') return {}

  const shoplinePayload = raw.shoplinePayload || raw
  return {
    shoplinePayload,
    client: raw.client || shoplinePayload.client || {},
    tracking: raw.tracking || {},
  }
}

function resolveEventSourceUrl(order, request, snapshot) {
  const trackingUrl = snapshot.tracking?.sourceUrl
  if (trackingUrl) return trackingUrl

  const returnUrl = String(order.return_url || '')
  if (returnUrl.startsWith('http')) return returnUrl

  try {
    const origin = new URL(request.url).origin
    return new URL(order.source_path || '/offers', origin).toString()
  } catch {
    return ''
  }
}

function resolveClientIp(request, snapshot) {
  return firstPresent(
    snapshot.client?.ip,
    request.headers.get('CF-Connecting-IP'),
    request.headers.get('x-forwarded-for'),
  )
}

function resolveClientUserAgent(request, snapshot) {
  return firstPresent(snapshot.client?.userAgent, request.headers.get('user-agent'))
}

export async function sendMetaPurchaseEvent({ env, request, order }) {
  const pixelId = getMetaPixelId(env)
  const accessToken = getMetaAccessToken(env)
  const eventId = order.event_id || `purchase.${order.reference_id}`

  if (!pixelId || !accessToken) {
    return {
      ok: false,
      skipped: true,
      eventId,
      status: 'skipped',
      error: !pixelId ? 'Missing Meta Pixel ID' : 'Missing Meta CAPI access token',
    }
  }

  const snapshot = getRequestSnapshot(order)
  const emailHash = await sha256Hex(normalizeEmail(order.buyer_email))
  const phoneHash = await sha256Hex(normalizePhone(order.buyer_phone))
  const externalIdHash = await sha256Hex(order.reference_id)
  const value = Number(order.amount_value || 0)
  const currency = String(order.currency || 'TWD')

  const payload = cleanObject({
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: resolveEventSourceUrl(order, request, snapshot),
        user_data: {
          em: emailHash,
          ph: phoneHash,
          external_id: externalIdHash,
          client_ip_address: resolveClientIp(request, snapshot),
          client_user_agent: resolveClientUserAgent(request, snapshot),
          fbp: snapshot.tracking?.fbp,
          fbc: snapshot.tracking?.fbc,
        },
        custom_data: {
          currency,
          value,
          order_id: order.reference_id,
          content_name: order.course_name,
          content_category: order.category,
          content_ids: [order.course_id],
          contents: [
            {
              id: order.course_id,
              quantity: Number(order.quantity || 1),
              item_price: value,
            },
          ],
          num_items: Number(order.quantity || 1),
        },
      },
    ],
    test_event_code: firstPresent(env.META_TEST_EVENT_CODE),
  })

  const graphVersion = getGraphApiVersion(env)
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )
  const data = await response.json().catch(() => null)

  return {
    ok: response.ok && !data?.error,
    skipped: false,
    eventId,
    status: response.ok && !data?.error ? 'sent' : 'failed',
    httpStatus: response.status,
    response: data,
    error: data?.error?.message || null,
  }
}
