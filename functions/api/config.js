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

function firstPresent(...values) {
  for (const value of values) {
    const normalized = String(value || '').trim()
    if (normalized) return normalized
  }
  return null
}

export async function onRequestGet({ env }) {
  return json({
    gaMeasurementId: firstPresent(
      env.VITE_GA_MEASUREMENT_ID,
      env.GA_MEASUREMENT_ID,
    ),
    lineLiffId: firstPresent(
      env.VITE_LINE_LIFF_ID,
      env.LINE_LIFF_ID,
      env.LINE_LOGIN_LIFF_ID,
    ),
    lineTagCustomerType: firstPresent(
      env.VITE_LINE_TAG_CUSTOMER_TYPE,
      env.LINE_TAG_CUSTOMER_TYPE,
    ) || 'lap',
    lineTagId: firstPresent(
      env.VITE_LINE_TAG_ID,
      env.LINE_TAG_ID,
    ),
    metaPixelId: firstPresent(
      env.VITE_META_PIXEL_ID,
      env.META_PIXEL_ID,
    ),
  })
}
