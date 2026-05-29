const leadEventStorageKey = 'fightnight_lead_event_v1'
const leadEventParam = 'lead_event_id'

type LeadEventRecord = {
  eventId: string
  createdAt: string
  firstSurface?: string
  metaLeadSentAt?: string
}

function createLeadEventId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `lead.${crypto.randomUUID()}`
  }

  return `lead.${Date.now()}.${Math.random().toString(36).slice(2)}`
}

function sanitizeLeadEventId(value: unknown) {
  const text = String(value || '').trim()
  if (!text || text.length > 160) return ''
  return /^[a-zA-Z0-9._:-]+$/.test(text) ? text : ''
}

function readUrlLeadEventId() {
  if (typeof window === 'undefined') return ''

  try {
    return sanitizeLeadEventId(
      new URLSearchParams(window.location.search).get(leadEventParam),
    )
  } catch {
    return ''
  }
}

function readStoredLeadEvent() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(leadEventStorageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LeadEventRecord
    const eventId = sanitizeLeadEventId(parsed.eventId)
    if (!eventId) return null
    return { ...parsed, eventId }
  } catch {
    return null
  }
}

function writeStoredLeadEvent(record: LeadEventRecord) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(leadEventStorageKey, JSON.stringify(record))
  } catch {
    // Storage can fail in constrained browser modes; tracking should not block UX.
  }
}

function syncLeadEventIdToUrl(eventId: string) {
  if (typeof window === 'undefined') return

  try {
    const url = new URL(window.location.href)
    if (url.searchParams.get(leadEventParam) === eventId) return
    url.searchParams.set(leadEventParam, eventId)
    window.history.replaceState(window.history.state, '', url.toString())
  } catch {
    // Non-critical; the in-memory/session copy still supports same-tab journeys.
  }
}

export function ensureLeadEvent(surface?: string, syncUrl = false) {
  const urlEventId = readUrlLeadEventId()
  const stored = readStoredLeadEvent()
  const eventId = urlEventId || stored?.eventId || createLeadEventId()
  const record: LeadEventRecord = {
    createdAt: stored?.createdAt || new Date().toISOString(),
    firstSurface: stored?.firstSurface || surface,
    metaLeadSentAt: stored?.metaLeadSentAt,
    eventId,
  }

  writeStoredLeadEvent(record)
  if (syncUrl) syncLeadEventIdToUrl(eventId)
  return record
}

export function claimLeadEvent(surface: string) {
  const record = ensureLeadEvent(surface, true)
  const shouldSendMetaLead = !record.metaLeadSentAt

  if (shouldSendMetaLead) {
    record.metaLeadSentAt = new Date().toISOString()
    writeStoredLeadEvent(record)
  }

  return {
    eventId: record.eventId,
    shouldSendMetaLead,
  }
}

export function getLeadEventIdForIdentity() {
  return ensureLeadEvent('line_identity').eventId
}

export function appendLeadEventIdToUrl(url: string, eventId = getLeadEventIdForIdentity()) {
  if (!url || typeof window === 'undefined') return url

  try {
    const next = new URL(url, window.location.href)
    next.searchParams.set(leadEventParam, eventId)
    return next.toString()
  } catch {
    return url
  }
}
