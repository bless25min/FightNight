import { weeklyCourses } from '../../../src/data/weeklySchedule.ts'

const LINE_PUSH_ENDPOINT = 'https://api.line.me/v2/bot/message/push'
const DEFAULT_PUBLIC_ORIGIN = 'https://fightnight.25min.co'

function trimText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function createLineMessageId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function formatMoney(value, currency = 'TWD') {
  const amount = Number(value || 0)
  if (currency !== 'TWD') return `${currency} ${amount.toLocaleString('en-US')}`
  return `NT$${amount.toLocaleString('en-US')}`
}

function formatDateLabel(iso) {
  const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return String(iso || '')
  return `${Number(match[2])}/${Number(match[3])}`
}

function formatTimeDigits(value) {
  const match = String(value || '').match(/^(\d{2})(\d{2})$/)
  if (!match) return ''
  return `${match[1]}:${match[2]}`
}

function getBaseCourseId(courseId) {
  return String(courseId || '').replace(/-\d{4}-\d{2}-\d{2}$/, '')
}

function getCourseTime(order) {
  const courseId = String(order.course_id || '')
  const baseCourseId = getBaseCourseId(courseId)
  const course = weeklyCourses.find(
    (item) => item.id === courseId || item.id === baseCourseId,
  )
  if (course?.startTime) return course.startTime

  const idTime = courseId.match(/^wc-[^-]+-\d{4}-(\d{4})-/)
  return formatTimeDigits(idTime?.[1])
}

function getVenueShortName(venueName) {
  const value = trimText(venueName, 80)
  return value
    .replace(/^UFCGYM\s*/i, '')
    .replace('旗艦館', '館')
    .trim()
}

function getPackageLabel(order) {
  return Number(order.package_size || 1) > 1
    ? `Boot Camp ${order.package_size} 堂`
    : 'Fight Night Pass'
}

function getDateTimeLabel(order) {
  const dates = safeJsonParse(order.series_dates_json, [])
  const time = getCourseTime(order)
  return dates
    .map((date) => `${formatDateLabel(date)}${time ? ` ${time}` : ''}`)
    .filter(Boolean)
    .join('、')
}

function buildConfirmationText(order) {
  const venue = getVenueShortName(order.venue_name)
  const dateTime = getDateTimeLabel(order)
  const packageLabel = getPackageLabel(order)
  const amountLabel = formatMoney(order.amount_value, order.currency)
  const lines = [
    `確認報名｜${venue}`,
    `課程：${order.course_name}`,
    `時間：${dateTime || '-'}`,
    `方案：${packageLabel}`,
    `金額：${amountLabel}`,
    `訂單：${order.reference_id}`,
    `聯絡人：${order.buyer_name || '-'}`,
    `電話：${order.buyer_phone || '-'}`,
  ]

  if (order.buyer_email) {
    lines.push(`Email：${order.buyer_email}`)
  }

  return lines.join('\n').slice(0, 300)
}

function buildReservationConfirmationCard(order) {
  const venue = getVenueShortName(order.venue_name)
  const dateTime = getDateTimeLabel(order)
  const packageLabel = getPackageLabel(order)
  const confirmationText = buildConfirmationText(order)

  return {
    type: 'flex',
    altText: `已付款報名，請確認 ${venue} ${dateTime} ${order.course_name}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: '已付款報名',
            weight: 'bold',
            size: 'xl',
            color: '#111111',
          },
          {
            type: 'text',
            text: '請點擊下方按鈕確認報名，場館方會在聊天室接手安排。',
            size: 'sm',
            color: '#666666',
            wrap: true,
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            margin: 'md',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '場館', color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: venue, color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '課程', color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: order.course_name, color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '時間', color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: dateTime || '-', color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '方案', color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: packageLabel, color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '金額', color: '#999999', size: 'sm', flex: 2 },
                  {
                    type: 'text',
                    text: formatMoney(order.amount_value, order.currency),
                    color: '#111111',
                    size: 'sm',
                    flex: 5,
                    wrap: true,
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#E3242B',
            action: {
              type: 'message',
              label: '確認報名',
              text: confirmationText,
            },
          },
        ],
      },
    },
  }
}

function buildFreeTrialConfirmationText(order) {
  const venue = getVenueShortName(order.venue_name)
  const dateTime = getDateTimeLabel(order)
  const lines = [
    `免費體驗預約｜${venue}｜${dateTime}`,
    `課程：${order.course_name}`,
    `聯絡人：${order.buyer_name || '-'}`,
    `電話：${order.buyer_phone || '-'}`,
    `預約編號：${order.reference_id}`,
  ]

  if (order.buyer_email) {
    lines.splice(4, 0, `Email：${order.buyer_email}`)
  }

  return lines.join('\n').slice(0, 300)
}

function buildFreeTrialConfirmationCard(order) {
  const venue = getVenueShortName(order.venue_name)
  const dateTime = getDateTimeLabel(order)
  const confirmationText = buildFreeTrialConfirmationText(order)

  return {
    type: 'flex',
    altText: `免費體驗已預約，請確認 ${venue} ${dateTime} ${order.course_name}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: '免費體驗已預約',
            weight: 'bold',
            size: 'xl',
            color: '#111111',
          },
          {
            type: 'text',
            text: '這堂已為你保留。請點擊下方按鈕確認預約，場館方會在聊天室接手安排。',
            size: 'sm',
            color: '#666666',
            wrap: true,
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            margin: 'md',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '場館', color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: venue, color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '課程', color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: order.course_name, color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '時間', color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: dateTime || '-', color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '方案', color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: '首堂免費體驗', color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '金額', color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: '免費', color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#E3242B',
            action: {
              type: 'message',
              label: '確認預約',
              text: confirmationText,
            },
          },
        ],
      },
    },
  }
}

function getPublicOrigin(env) {
  const configured =
    env.PUBLIC_SITE_URL ||
    env.SITE_ORIGIN ||
    env.PUBLIC_ORIGIN ||
    env.VITE_PUBLIC_SITE_URL

  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      // Fall through to the production origin.
    }
  }

  return DEFAULT_PUBLIC_ORIGIN
}

function buildFirstPurchaseOfferUrl(env, referenceId) {
  const url = new URL('/boot-camp', getPublicOrigin(env))
  url.searchParams.set('from', 'line-auto')
  url.searchParams.set('utm_source', 'line')
  url.searchParams.set('utm_medium', 'auto')
  url.searchParams.set('utm_campaign', 'free_trial_already_reserved')
  if (referenceId) {
    url.searchParams.set('reference_id', referenceId)
  }
  return url.toString()
}

function buildFreeTrialAlreadyReservedOfferCard(order, targetUrl) {
  const venue = getVenueShortName(order.venue_name)
  const dateTime = getDateTimeLabel(order)

  return {
    type: 'flex',
    altText: '你已經保留免費體驗，可以查看 618 首購方案',
    contents: {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: '你已經保留過免費體驗',
            weight: 'bold',
            size: 'xl',
            color: '#111111',
            wrap: true,
          },
          {
            type: 'text',
            text: '不用再重填一次資料。原本的預約仍然保留，當天照 LINE 確認資訊到場即可。',
            size: 'sm',
            color: '#666666',
            wrap: true,
          },
          {
            type: 'separator',
            margin: 'md',
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            margin: 'md',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '場館', color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: venue || '-', color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '時間', color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: dateTime || '-', color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: '編號', color: '#999999', size: 'sm', flex: 2 },
                  { type: 'text', text: order.reference_id, color: '#111111', size: 'sm', flex: 5, wrap: true },
                ],
              },
            ],
          },
          {
            type: 'text',
            text: '如果你想把這次體驗接成固定開始，可以先在線上看 618 首購方案；這不是現場推銷，也不需要入會。',
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'lg',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#E3242B',
            action: {
              type: 'uri',
              label: '查看 618 首購',
              uri: targetUrl,
            },
          },
        ],
      },
    },
  }
}

export async function ensureLineNotificationColumns(env) {
  const columns = [
    ['line_payment_notify_status', 'TEXT'],
    ['line_payment_notify_attempted_at', 'TEXT'],
    ['line_payment_notified_at', 'TEXT'],
    ['line_payment_notify_response_json', 'TEXT'],
    ['line_payment_notify_error', 'TEXT'],
  ]

  for (const [name, type] of columns) {
    try {
      await env.DB.prepare(
        `ALTER TABLE course_orders ADD COLUMN ${name} ${type}`,
      ).run()
    } catch (error) {
      if (
        error instanceof Error &&
        (/duplicate column/i.test(error.message) || /no such table/i.test(error.message))
      ) {
        continue
      }
      throw error
    }
  }
}

export async function ensureLineMessageSendsTable(env) {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS line_message_sends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT NOT NULL UNIQUE,
        line_user_id TEXT,
        reference_id TEXT,
        source TEXT NOT NULL,
        message_type TEXT NOT NULL,
        template_id TEXT,
        target_url TEXT,
        status TEXT NOT NULL DEFAULT 'sending',
        message_json TEXT,
        response_json TEXT,
        error TEXT,
        attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
        sent_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_message_sends_user
       ON line_message_sends (line_user_id, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_message_sends_reference
       ON line_message_sends (reference_id, message_type)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_message_sends_status
       ON line_message_sends (status, created_at)`,
    ),
  ])
}

async function insertLineMessageSend(
  env,
  {
    messageId,
    lineUserId,
    referenceId,
    source,
    messageType,
    templateId,
    targetUrl,
    message,
  },
) {
  await ensureLineMessageSendsTable(env)
  await env.DB.prepare(
    `INSERT INTO line_message_sends (
       message_id, line_user_id, reference_id, source, message_type,
       template_id, target_url, status, message_json, attempted_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'sending', ?, datetime('now'))`,
  )
    .bind(
      messageId,
      lineUserId || null,
      referenceId || null,
      source,
      messageType,
      templateId || null,
      targetUrl || null,
      message ? JSON.stringify(message).slice(0, 8000) : null,
    )
    .run()
}

async function updateLineMessageSend(env, messageId, result) {
  await env.DB.prepare(
    `UPDATE line_message_sends
     SET status = ?,
         response_json = ?,
         error = ?,
         sent_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE sent_at END,
         attempted_at = datetime('now')
     WHERE message_id = ?`,
  )
    .bind(
      trimText(result.status, 80),
      result.response ? JSON.stringify(result.response).slice(0, 8000) : null,
      result.error ? trimText(result.error, 1000) : null,
      result.status,
      messageId,
    )
    .run()
}

async function recordLineNotifyStatus(env, referenceId, result) {
  await env.DB.prepare(
    `UPDATE course_orders
     SET line_payment_notify_status = ?,
         line_payment_notify_attempted_at = datetime('now'),
         line_payment_notified_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE line_payment_notified_at END,
         line_payment_notify_response_json = ?,
         line_payment_notify_error = ?,
         updated_at = datetime('now')
     WHERE reference_id = ?`,
  )
    .bind(
      trimText(result.status, 80),
      result.status,
      result.response ? JSON.stringify(result.response).slice(0, 8000) : null,
      result.error ? trimText(result.error, 1000) : null,
      referenceId,
    )
    .run()
}

export async function notifyLinePaymentSuccess(env, referenceId, options = {}) {
  const force = options?.force === true
  if (!env.DB || !referenceId) {
    return { status: 'skipped_invalid_request' }
  }

  await ensureLineNotificationColumns(env)

  const order = await env.DB.prepare(
    `SELECT reference_id, status, course_id, course_name, venue_name,
            package_size, amount_value, currency, series_dates_json,
            buyer_name, buyer_phone, buyer_email, line_user_id,
            line_display_name, line_payment_notify_status,
            line_payment_notify_attempted_at, line_payment_notified_at
     FROM course_orders
     WHERE reference_id = ?`,
  )
    .bind(referenceId)
    .first()

  if (!order || order.status !== 'paid') {
    return { status: 'skipped_not_paid' }
  }
  if (order.line_payment_notified_at && !force) {
    return { status: 'skipped_already_sent' }
  }
  if (!order.line_user_id) {
    const result = {
      status: 'skipped_no_line_user',
      error: 'Order has no linked LINE user',
    }
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    const result = {
      status: 'skipped_missing_token',
      error: 'Missing LINE_CHANNEL_ACCESS_TOKEN',
    }
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }

  const claim = force
    ? await env.DB.prepare(
        `UPDATE course_orders
         SET line_payment_notify_status = 'sending',
             line_payment_notify_attempted_at = datetime('now'),
             line_payment_notified_at = NULL,
             line_payment_notify_error = NULL,
             updated_at = datetime('now')
         WHERE reference_id = ?
           AND status = 'paid'
           AND line_user_id IS NOT NULL
           AND line_user_id != ''`,
      )
        .bind(referenceId)
        .run()
    : await env.DB.prepare(
        `UPDATE course_orders
         SET line_payment_notify_status = 'sending',
             line_payment_notify_attempted_at = datetime('now'),
             line_payment_notify_error = NULL,
             updated_at = datetime('now')
         WHERE reference_id = ?
           AND status = 'paid'
           AND line_user_id IS NOT NULL
           AND line_user_id != ''
           AND line_payment_notified_at IS NULL
           AND (
             line_payment_notify_status IS NULL
             OR line_payment_notify_status IN ('failed', 'skipped_missing_token', 'skipped_no_line_user')
             OR (
               line_payment_notify_status = 'sending'
               AND datetime(line_payment_notify_attempted_at) <= datetime('now', '-5 minutes')
             )
           )`,
      )
        .bind(referenceId)
        .run()

  if (!claim.meta?.changes) {
    return { status: 'skipped_in_progress_or_sent' }
  }

  const message = buildReservationConfirmationCard(order)
  const messageId = createLineMessageId('lms_paid')

  await insertLineMessageSend(env, {
    messageId,
    lineUserId: order.line_user_id,
    referenceId,
    source: 'auto',
    messageType: 'paid_confirmation',
    templateId: 'paid_confirmation',
    targetUrl: null,
    message,
  })

  const payload = {
    to: order.line_user_id,
    messages: [message],
  }

  try {
    const response = await fetch(LINE_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      const result = {
        status: 'failed',
        response: responseBody,
        error: `LINE push failed with HTTP ${response.status}`,
      }
      await updateLineMessageSend(env, messageId, result)
      await recordLineNotifyStatus(env, referenceId, result)
      return result
    }

    const result = {
      status: 'sent',
      response: responseBody || { ok: true },
    }
    await updateLineMessageSend(env, messageId, result)
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  } catch (error) {
    const result = {
      status: 'failed',
      error:
        error instanceof Error
          ? error.message
        : 'LINE push request failed',
    }
    await updateLineMessageSend(env, messageId, result)
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }
}

export async function notifyLineFreeTrialAlreadyReservedOffer(env, referenceId) {
  if (!env.DB || !referenceId) {
    return { status: 'skipped_invalid_request' }
  }

  const order = await env.DB.prepare(
    `SELECT reference_id, status, course_id, course_name, venue_name,
            package_size, amount_value, currency, series_dates_json,
            buyer_name, buyer_phone, buyer_email, line_user_id,
            line_display_name
     FROM course_orders
     WHERE reference_id = ?`,
  )
    .bind(referenceId)
    .first()

  if (!order || !['free_reserved', 'free_attended'].includes(String(order.status || ''))) {
    return { status: 'skipped_not_free_trial' }
  }
  if (!order.line_user_id) {
    return {
      status: 'skipped_no_line_user',
      error: 'Reservation has no linked LINE user',
    }
  }
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    return {
      status: 'skipped_missing_token',
      error: 'Missing LINE_CHANNEL_ACCESS_TOKEN',
    }
  }

  const targetUrl = buildFirstPurchaseOfferUrl(env, referenceId)
  const message = buildFreeTrialAlreadyReservedOfferCard(order, targetUrl)
  const messageId = createLineMessageId('lms_reserved_offer')
  const resultMeta = {
    messageType: 'free_trial_already_reserved_offer',
    templateId: 'reserved_to_first_purchase',
    targetUrl,
  }

  await insertLineMessageSend(env, {
    messageId,
    lineUserId: order.line_user_id,
    referenceId,
    source: 'auto',
    messageType: resultMeta.messageType,
    templateId: resultMeta.templateId,
    targetUrl,
    message,
  })

  const payload = {
    to: order.line_user_id,
    messages: [message],
  }

  try {
    const response = await fetch(LINE_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      const result = {
        ...resultMeta,
        status: 'failed',
        response: responseBody,
        error: `LINE push failed with HTTP ${response.status}`,
      }
      await updateLineMessageSend(env, messageId, result)
      return result
    }

    const result = {
      ...resultMeta,
      status: 'sent',
      response: responseBody || { ok: true },
    }
    await updateLineMessageSend(env, messageId, result)
    return result
  } catch (error) {
    const result = {
      ...resultMeta,
      status: 'failed',
      error:
        error instanceof Error
          ? error.message
          : 'LINE push request failed',
    }
    await updateLineMessageSend(env, messageId, result)
    return result
  }
}

export async function notifyLineFreeTrialReservation(env, referenceId, options = {}) {
  const force = options?.force === true
  if (!env.DB || !referenceId) {
    return { status: 'skipped_invalid_request' }
  }

  await ensureLineNotificationColumns(env)

  const order = await env.DB.prepare(
    `SELECT reference_id, status, course_id, course_name, venue_name,
            package_size, amount_value, currency, series_dates_json,
            buyer_name, buyer_phone, buyer_email, line_user_id,
            line_display_name, line_payment_notify_status,
            line_payment_notify_attempted_at, line_payment_notified_at
     FROM course_orders
     WHERE reference_id = ?`,
  )
    .bind(referenceId)
    .first()

  if (!order || order.status !== 'free_reserved') {
    return { status: 'skipped_not_free_reserved' }
  }
  if (order.line_payment_notified_at && !force) {
    return { status: 'skipped_already_sent' }
  }
  if (!order.line_user_id) {
    const result = {
      status: 'skipped_no_line_user',
      error: 'Reservation has no linked LINE user',
    }
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    const result = {
      status: 'skipped_missing_token',
      error: 'Missing LINE_CHANNEL_ACCESS_TOKEN',
    }
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }

  const claim = force
    ? await env.DB.prepare(
        `UPDATE course_orders
         SET line_payment_notify_status = 'sending',
             line_payment_notify_attempted_at = datetime('now'),
             line_payment_notified_at = NULL,
             line_payment_notify_error = NULL,
             updated_at = datetime('now')
         WHERE reference_id = ?
           AND status = 'free_reserved'
           AND line_user_id IS NOT NULL
           AND line_user_id != ''`,
      )
        .bind(referenceId)
        .run()
    : await env.DB.prepare(
        `UPDATE course_orders
         SET line_payment_notify_status = 'sending',
             line_payment_notify_attempted_at = datetime('now'),
             line_payment_notify_error = NULL,
             updated_at = datetime('now')
         WHERE reference_id = ?
           AND status = 'free_reserved'
           AND line_user_id IS NOT NULL
           AND line_user_id != ''
           AND line_payment_notified_at IS NULL
           AND (
             line_payment_notify_status IS NULL
             OR line_payment_notify_status IN ('failed', 'skipped_missing_token', 'skipped_no_line_user')
             OR (
               line_payment_notify_status = 'sending'
               AND datetime(line_payment_notify_attempted_at) <= datetime('now', '-5 minutes')
             )
           )`,
      )
        .bind(referenceId)
        .run()

  if (!claim.meta?.changes) {
    return { status: 'skipped_in_progress_or_sent' }
  }

  const message = buildFreeTrialConfirmationCard(order)
  const messageId = createLineMessageId('lms_free')

  await insertLineMessageSend(env, {
    messageId,
    lineUserId: order.line_user_id,
    referenceId,
    source: 'auto',
    messageType: 'free_trial_confirmation',
    templateId: 'free_trial_confirmation',
    targetUrl: null,
    message,
  })

  const payload = {
    to: order.line_user_id,
    messages: [message],
  }

  try {
    const response = await fetch(LINE_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      const result = {
        status: 'failed',
        response: responseBody,
        error: `LINE push failed with HTTP ${response.status}`,
      }
      await updateLineMessageSend(env, messageId, result)
      await recordLineNotifyStatus(env, referenceId, result)
      return result
    }

    const result = {
      status: 'sent',
      response: responseBody || { ok: true },
    }
    await updateLineMessageSend(env, messageId, result)
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  } catch (error) {
    const result = {
      status: 'failed',
      error:
        error instanceof Error
          ? error.message
        : 'LINE push request failed',
    }
    await updateLineMessageSend(env, messageId, result)
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }
}
