import { weeklyCourses } from '../../../src/data/weeklySchedule.ts'

const LINE_PUSH_ENDPOINT = 'https://api.line.me/v2/bot/message/push'

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
  const lines = [
    `確認報名｜${venue}｜${dateTime}`,
    `課程：${order.course_name}`,
    `聯絡人：${order.buyer_name || '-'}`,
    `電話：${order.buyer_phone || '-'}`,
    `訂單：${order.reference_id}`,
  ]

  if (order.buyer_email) {
    lines.splice(4, 0, `Email：${order.buyer_email}`)
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

export async function notifyLinePaymentSuccess(env, referenceId) {
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
  if (order.line_payment_notified_at) {
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

  const claim = await env.DB.prepare(
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

  const payload = {
    to: order.line_user_id,
    messages: [buildReservationConfirmationCard(order)],
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
      await recordLineNotifyStatus(env, referenceId, result)
      return result
    }

    const result = {
      status: 'sent',
      response: responseBody || { ok: true },
    }
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
    await recordLineNotifyStatus(env, referenceId, result)
    return result
  }
}
