import {
  ensureTables,
  hasPurchasedOrderForLineUser,
  resolveLineContext,
} from './shopline/checkout-session.js'

const EXISTING_FREE_TRIAL_STATUSES = ['free_reserved', 'free_attended']

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

async function getExistingFreeTrial(env, lineUserId) {
  if (!lineUserId) return null

  const placeholders = EXISTING_FREE_TRIAL_STATUSES.map(() => '?').join(',')
  return await env.DB.prepare(
    `SELECT reference_id, status, course_id, course_name, venue_name,
            series_dates_json
     FROM course_orders
     WHERE line_user_id = ?
       AND status IN (${placeholders})
     ORDER BY created_at DESC
     LIMIT 1`,
  )
    .bind(lineUserId, ...EXISTING_FREE_TRIAL_STATUSES)
    .first()
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)

  try {
    await ensureTables(env)
    const lineContext = await resolveLineContext(body?.lineContext, env)
    if (!lineContext?.lineUserId) {
      return json({
        ok: true,
        lineLoginRequired: true,
        alreadyReserved: false,
        hasPurchased: false,
        paidFallbackAmount: 680,
      })
    }

    const [existingFreeTrial, hasPurchased] = await Promise.all([
      getExistingFreeTrial(env, lineContext.lineUserId),
      hasPurchasedOrderForLineUser(env, lineContext.lineUserId),
    ])

    return json({
      ok: true,
      lineLoginRequired: false,
      alreadyReserved: Boolean(existingFreeTrial),
      hasPurchased,
      paidFallbackAmount: 680,
      reservation: existingFreeTrial
        ? {
            referenceId: existingFreeTrial.reference_id,
            status: existingFreeTrial.status,
            courseId: existingFreeTrial.course_id,
            courseName: existingFreeTrial.course_name,
            venueName: existingFreeTrial.venue_name,
          }
        : null,
    })
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : '免費體驗狀態讀取失敗，請稍後再試。',
      },
      { status: 400 },
    )
  }
}
