const variants = {
  home: '/',
  bootcamp: '/boot-camp',
  event: '/fight-night-event',
}

const cookieNames = {
  experimentId: 'fn_split_experiment_id',
  firstVariant: 'fn_split_first_variant',
  lastVariant: 'fn_split_last_variant',
  sessionVariant: 'fn_split_session_variant',
  visitId: 'fn_split_visit_id',
  assignmentMode: 'fn_split_assignment_mode',
  originalPath: 'fn_split_original_path',
  assignedPath: 'fn_split_assigned_path',
}

const sessionMaxAge = 30 * 60
const longMaxAge = 90 * 24 * 60 * 60

function isTruthy(value) {
  return /^(1|true|yes|on)$/i.test(String(value || '').trim())
}

function normalizeVariant(value) {
  const key = String(value || '').trim().toLowerCase()
  if (key === 'control') return 'home'
  return Object.prototype.hasOwnProperty.call(variants, key) ? key : ''
}

function parseCookies(request) {
  const header = request.headers.get('cookie') || ''
  return header.split(';').reduce((cookies, entry) => {
    const index = entry.indexOf('=')
    if (index <= 0) return cookies

    const key = entry.slice(0, index).trim()
    const value = entry.slice(index + 1).trim()
    try {
      cookies[decodeURIComponent(key)] = decodeURIComponent(value)
    } catch {
      cookies[key] = value
    }
    return cookies
  }, {})
}

function buildCookie(name, value, maxAge, secure) {
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(String(value || ''))}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

function trimText(value, maxLength = 600) {
  return String(value || '').trim().slice(0, maxLength)
}

function buildVisitId() {
  if (globalThis.crypto?.randomUUID) return `split.${globalThis.crypto.randomUUID()}`
  return `split.${Date.now()}.${Math.random().toString(36).slice(2)}`
}

function parseWeights(value) {
  const weights = { home: 34, bootcamp: 33, event: 33 }
  const raw = String(value || '').trim()
  if (!raw) return weights

  const next = {}
  for (const entry of raw.split(',')) {
    const [key, rawWeight] = entry.split(':')
    const variant = normalizeVariant(key)
    const weight = Number(rawWeight)
    if (variant && Number.isFinite(weight) && weight > 0) {
      next[variant] = Math.round(weight)
    }
  }

  return Object.keys(next).length > 0 ? next : weights
}

function chooseVariant(weights, lastVariant) {
  const weightedEntries = Object.entries(weights).filter(
    ([variant, weight]) => normalizeVariant(variant) && Number(weight) > 0,
  )
  const entries =
    weightedEntries.length > 1
      ? weightedEntries.filter(([variant]) => variant !== lastVariant)
      : weightedEntries
  const candidates = entries.length > 0 ? entries : weightedEntries
  const total = candidates.reduce((sum, [, weight]) => sum + Number(weight), 0)
  if (total <= 0) return 'home'

  let cursor = Math.random() * total
  for (const [variant, weight] of candidates) {
    cursor -= Number(weight)
    if (cursor <= 0) return variant
  }

  return candidates[0]?.[0] || 'home'
}

function isBotRequest(request) {
  const userAgent = request.headers.get('user-agent') || ''
  return /bot|crawler|spider|crawling|preview|facebookexternalhit|line-poker/i.test(
    userAgent,
  )
}

function isPaidLikeEntry(url) {
  const medium = (url.searchParams.get('utm_medium') || '').toLowerCase()
  const source = (url.searchParams.get('utm_source') || '').toLowerCase()
  const entry = (url.searchParams.get('entry') || '').toLowerCase()

  return (
    url.searchParams.has('fbclid') ||
    url.searchParams.has('gclid') ||
    url.searchParams.has('gbraid') ||
    url.searchParams.has('wbraid') ||
    url.searchParams.has('ttclid') ||
    entry === 'ticket' ||
    /(cpc|ppc|paid|ads?|display|retarget|remarketing)/i.test(medium) ||
    /(meta|facebook|instagram|fb|ig)/i.test(source)
  )
}

function isRootDocumentRequest(request, url) {
  if (!['GET', 'HEAD'].includes(request.method)) return false
  if (url.pathname !== '/' && url.pathname !== '/index.html') return false

  const accept = request.headers.get('accept') || ''
  return !accept || accept.includes('text/html') || accept.includes('*/*')
}

function appendSplitParams(targetUrl, assignment) {
  targetUrl.searchParams.set('split_routed', '1')
  targetUrl.searchParams.set('experiment_id', assignment.experimentId)
  targetUrl.searchParams.set('experiment_variant', assignment.variant)
  targetUrl.searchParams.set('first_experiment_variant', assignment.firstVariant)
  targetUrl.searchParams.set('split_visit_id', assignment.visitId)
  targetUrl.searchParams.set('split_assignment_mode', assignment.assignmentMode)
}

function buildRedirectResponse(request, url, assignment) {
  const targetUrl = new URL(variants[assignment.variant], url.origin)
  for (const [key, value] of url.searchParams.entries()) {
    if (key === 'split') continue
    targetUrl.searchParams.append(key, value)
  }
  appendSplitParams(targetUrl, assignment)

  const secure = url.protocol === 'https:'
  const headers = new Headers({
    location: targetUrl.toString(),
    'cache-control': 'no-store',
  })
  headers.append(
    'set-cookie',
    buildCookie(cookieNames.experimentId, assignment.experimentId, longMaxAge, secure),
  )
  headers.append(
    'set-cookie',
    buildCookie(cookieNames.firstVariant, assignment.firstVariant, longMaxAge, secure),
  )
  headers.append(
    'set-cookie',
    buildCookie(cookieNames.lastVariant, assignment.variant, longMaxAge, secure),
  )
  headers.append(
    'set-cookie',
    buildCookie(cookieNames.sessionVariant, assignment.variant, sessionMaxAge, secure),
  )
  headers.append(
    'set-cookie',
    buildCookie(cookieNames.visitId, assignment.visitId, sessionMaxAge, secure),
  )
  headers.append(
    'set-cookie',
    buildCookie(cookieNames.assignmentMode, assignment.assignmentMode, sessionMaxAge, secure),
  )
  headers.append(
    'set-cookie',
    buildCookie(cookieNames.originalPath, assignment.originalPath, sessionMaxAge, secure),
  )
  headers.append(
    'set-cookie',
    buildCookie(cookieNames.assignedPath, variants[assignment.variant], sessionMaxAge, secure),
  )

  return new Response(null, {
    status: request.method === 'HEAD' ? 302 : 302,
    headers,
  })
}

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

  if (!isRootDocumentRequest(request, url)) return context.next()
  if (url.searchParams.get('split') === 'off') return context.next()
  if (url.searchParams.get('split_routed') === '1') return context.next()

  const forcedVariant = normalizeVariant(url.searchParams.get('split'))
  const enabled = isTruthy(env.LANDING_SPLIT_ENABLED)
  const onlyPaid = !env.LANDING_SPLIT_ONLY_PAID || isTruthy(env.LANDING_SPLIT_ONLY_PAID)

  if (!forcedVariant && !enabled) return context.next()
  if (!forcedVariant && isBotRequest(request)) return context.next()
  if (!forcedVariant && onlyPaid && !isPaidLikeEntry(url)) return context.next()

  const cookies = parseCookies(request)
  const experimentId = trimText(
    env.LANDING_SPLIT_EXPERIMENT_ID || 'home_destination_split_v1',
    80,
  )
  const cookieExperimentId = trimText(cookies[cookieNames.experimentId], 80)
  const sameExperiment = cookieExperimentId === experimentId
  const sessionVariant = sameExperiment
    ? normalizeVariant(cookies[cookieNames.sessionVariant])
    : ''
  const firstCookieVariant = sameExperiment
    ? normalizeVariant(cookies[cookieNames.firstVariant])
    : ''
  const lastVariant = sameExperiment
    ? normalizeVariant(cookies[cookieNames.lastVariant])
    : ''
  const weights = parseWeights(env.LANDING_SPLIT_WEIGHTS)
  const variant =
    forcedVariant ||
    sessionVariant ||
    chooseVariant(weights, lastVariant)
  const firstVariant = firstCookieVariant || variant
  const visitId =
    (sameExperiment && trimText(cookies[cookieNames.visitId], 120)) ||
    buildVisitId()
  const assignmentMode = forcedVariant
    ? 'forced_preview'
    : sessionVariant
      ? 'session_reuse'
      : 'weighted_rotate'
  const originalPath = trimText(`${url.pathname}${url.search}`, 600)

  return buildRedirectResponse(request, url, {
    experimentId,
    variant,
    firstVariant,
    visitId,
    assignmentMode,
    originalPath,
  })
}
