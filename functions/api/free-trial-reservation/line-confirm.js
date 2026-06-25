const FREE_TRIAL_STATUS = 'free_reserved'

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

function normalizeLineContext(value) {
  if (!value || typeof value !== 'object') return null

  const lineUserId = trimText(value.lineUserId || value.userId, 120)
  if (!lineUserId) return null

  return {
    lineUserId,
    displayName: trimText(value.displayName, 200) || null,
    pictureUrl: trimText(value.pictureUrl, 1200) || null,
    email: normalizeEmail(value.email || value.lineEmail),
    emailVerified: value.emailVerified === true,
    isFriend: value.isFriend === true || value.friendFlag === true,
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

async function resolveLineContext(value, env) {
  const submittedContext = normalizeLineContext(value)
  const accessToken = trimText(value?.accessToken, 2000)
  if (!accessToken) return null

  try {
    const profile = await fetchLineProfile(accessToken)
    const lineUserId = trimText(profile?.userId, 120)
    if (!lineUserId) return null

    const verifiedToken = await verifyLineIdToken(trimText(value?.idToken, 4000), env)
    const tokenMatchesProfile = verifiedToken?.sub && verifiedToken.sub === lineUserId
    const verifiedEmail = tokenMatchesProfile ? normalizeEmail(verifiedToken?.email) : null
    const submittedEmail = submittedContext?.email || normalizeEmail(value?.email || value?.lineEmail)
    const lineEmail = verifiedEmail || submittedEmail

    return {
      lineUserId,
      displayName: trimText(profile?.displayName, 200) || submittedContext?.displayName || null,
      pictureUrl: trimText(profile?.pictureUrl, 1200) || submittedContext?.pictureUrl || null,
      email: lineEmail,
      emailVerified: Boolean(verifiedEmail),
      isFriend: submittedContext?.isFriend === true,
    }
  } catch {
    return null
  }
}

async function ensureLineCustomerColumns(env) {
  const columns = [
    ['email', 'TEXT'],
    ['email_verified', 'INTEGER NOT NULL DEFAULT 0'],
    ['email_updated_at', 'TEXT'],
    ['status_message', 'TEXT'],
    ['is_friend', 'INTEGER NOT NULL DEFAULT 0'],
    ['access_count', 'INTEGER NOT NULL DEFAULT 1'],
    ['raw_profile_json', 'TEXT'],
    ['last_seen_at', 'TEXT'],
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

async function upsertLineCustomerFromLineConfirm(env, lineContext) {
  if (!lineContext?.lineUserId) return

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
  ])

  await ensureLineCustomerColumns(env)

  await env.DB.prepare(
    `INSERT INTO line_customers (
      line_user_id, display_name, picture_url, status_message, email,
      email_verified, email_updated_at, is_friend, access_count,
      raw_profile_json, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
    ON CONFLICT(line_user_id) DO UPDATE SET
      display_name = COALESCE(excluded.display_name, line_customers.display_name),
      picture_url = COALESCE(excluded.picture_url, line_customers.picture_url),
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
      raw_profile_json = COALESCE(excluded.raw_profile_json, line_customers.raw_profile_json),
      last_seen_at = datetime('now')`,
  )
    .bind(
      lineContext.lineUserId,
      lineContext.displayName || 'LINE user',
      lineContext.pictureUrl,
      lineContext.email || null,
      lineContext.emailVerified ? 1 : 0,
      lineContext.email ? new Date().toISOString() : null,
      lineContext.isFriend ? 1 : 0,
      JSON.stringify(lineContext),
    )
    .run()
}

async function notifyLineFreeTrialReservation(env, referenceId, options) {
  const lineNotify = await import('../shopline/line-notify.js')
  return lineNotify.notifyLineFreeTrialReservation(env, referenceId, options)
}

function toStoredLineContext(lineContext) {
  return {
    lineUserId: lineContext.lineUserId,
    displayName: lineContext.displayName || null,
    pictureUrl: lineContext.pictureUrl || null,
    email: lineContext.email || null,
    emailVerified: lineContext.emailVerified === true,
    isFriend: lineContext.isFriend === true,
    source: 'free_trial_line_confirm',
  }
}

function getLineContextPayload(body) {
  const value =
    body?.lineContext && typeof body.lineContext === 'object'
      ? body.lineContext
      : body

  return {
    accessToken: value?.accessToken,
    idToken: value?.idToken,
    email: value?.email || value?.lineEmail,
    displayName: value?.displayName,
    pictureUrl: value?.pictureUrl,
    isFriend: value?.isFriend,
    friendFlag: value?.friendFlag,
  }
}

export async function confirmFreeTrialLineReservation({
  env,
  referenceId,
  lineContext,
  upsertLineCustomer = upsertLineCustomerFromLineConfirm,
  notifyLineFreeTrialReservation: notifyLine = notifyLineFreeTrialReservation,
}) {
  const normalizedReferenceId = trimText(referenceId, 80)
  const lineUserId = trimText(lineContext?.lineUserId, 120)

  if (!env?.DB) {
    return { ok: false, status: 503, error: 'Missing D1 binding DB' }
  }
  if (!normalizedReferenceId) {
    return { ok: false, status: 400, error: 'Missing referenceId' }
  }
  if (!lineUserId) {
    return { ok: false, status: 401, error: 'Missing verified LINE user' }
  }

  const order = await env.DB.prepare(
    `SELECT reference_id, status, line_user_id
     FROM course_orders
     WHERE reference_id = ?`,
  )
    .bind(normalizedReferenceId)
    .first()

  if (!order) {
    return { ok: false, status: 404, error: 'Reservation not found' }
  }
  if (order.status !== FREE_TRIAL_STATUS) {
    return {
      ok: false,
      status: 400,
      error: 'Only free trial reservations can be confirmed through this flow',
    }
  }

  const existingLineUserId = trimText(order.line_user_id, 120)
  if (existingLineUserId && existingLineUserId !== lineUserId) {
    return {
      ok: false,
      status: 409,
      error: 'Reservation is already linked to another LINE user',
    }
  }

  const storedLineContext = toStoredLineContext({
    ...lineContext,
    lineUserId,
  })

  await upsertLineCustomer(env, storedLineContext)

  const update = await env.DB.prepare(
    `UPDATE course_orders
     SET line_user_id = ?,
         line_display_name = ?,
         line_picture_url = ?,
         line_email = ?,
         line_email_verified = ?,
         line_is_friend = ?,
         line_context_json = ?,
         line_payment_notify_status = CASE
           WHEN line_payment_notify_status IN ('failed', 'skipped_missing_token', 'skipped_no_line_user')
           THEN NULL
           ELSE line_payment_notify_status
         END,
         line_payment_notify_attempted_at = CASE
           WHEN line_payment_notify_status IN ('failed', 'skipped_missing_token', 'skipped_no_line_user')
           THEN NULL
           ELSE line_payment_notify_attempted_at
         END,
         line_payment_notify_error = CASE
           WHEN line_payment_notify_status IN ('failed', 'skipped_missing_token', 'skipped_no_line_user')
           THEN NULL
           ELSE line_payment_notify_error
         END,
         updated_at = datetime('now')
     WHERE reference_id = ?
       AND status = ?
       AND (
         line_user_id IS NULL
         OR line_user_id = ''
         OR line_user_id = ?
       )`,
  )
    .bind(
      lineUserId,
      storedLineContext.displayName,
      storedLineContext.pictureUrl,
      storedLineContext.email,
      storedLineContext.emailVerified ? 1 : 0,
      storedLineContext.isFriend ? 1 : 0,
      JSON.stringify(storedLineContext),
      normalizedReferenceId,
      FREE_TRIAL_STATUS,
      lineUserId,
    )
    .run()

  if (!update.meta?.changes) {
    return {
      ok: false,
      status: 409,
      error: 'Reservation could not be linked to this LINE user',
    }
  }

  const lineNotify = await notifyLine(env, normalizedReferenceId, { force: true })

  return {
    ok: true,
    referenceId: normalizedReferenceId,
    lineUserId,
    lineNotify,
  }
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null)
  const url = new URL(request.url)
  const referenceId = trimText(
    body?.referenceId || url.searchParams.get('referenceId'),
    80,
  )

  if (!referenceId) {
    return json({ error: 'Missing referenceId' }, { status: 400 })
  }

  const lineContext = await resolveLineContext(getLineContextPayload(body), env)
  if (!lineContext?.lineUserId) {
    return json(
      { error: 'LINE 驗證失敗，請重新開啟 LINE 確認。' },
      { status: 401 },
    )
  }

  try {
    const result = await confirmFreeTrialLineReservation({
      env,
      referenceId,
      lineContext,
    })

    if (!result.ok) {
      return json({ error: result.error, ...result }, { status: result.status || 500 })
    }

    return json(result)
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'LINE confirmation failed',
      },
      { status: 500 },
    )
  }
}
