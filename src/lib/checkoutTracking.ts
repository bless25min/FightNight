import { getLandingSplitContext } from './landingSplit'
import { getLocaleTrackingParams } from './locale'

function readCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : ''
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined' || !value) return

  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    'path=/',
    'max-age=7776000',
    'SameSite=Lax',
    'Secure',
  ].join('; ')
}

function getStoredFacebookClickId() {
  if (typeof window === 'undefined') return ''

  try {
    const raw = window.localStorage.getItem('ufcgym_attribution')
    if (!raw) return ''
    const stored = JSON.parse(raw) as {
      clickIdType?: unknown
      clickIdValue?: unknown
    }
    return stored.clickIdType === 'fbclid' && typeof stored.clickIdValue === 'string'
      ? stored.clickIdValue.trim()
      : ''
  } catch {
    return ''
  }
}

function buildFacebookClickCookie() {
  if (typeof window === 'undefined') return ''
  const fbclid =
    new URLSearchParams(window.location.search).get('fbclid') ||
    getStoredFacebookClickId()
  if (!fbclid) return ''
  return `fb.1.${Date.now()}.${fbclid}`
}

function getFacebookBrowserCookie() {
  const existing = readCookie('_fbp')
  if (existing) return existing

  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.floor(Math.random() * 10_000_000_000_000_000).toString()
  const next = `fb.1.${Date.now()}.${randomPart}`
  writeCookie('_fbp', next)
  return next
}

function getFacebookClickCookie() {
  const existing = readCookie('_fbc')
  if (existing) return existing

  const next = buildFacebookClickCookie()
  if (next) writeCookie('_fbc', next)
  return next
}

export function createMetaEventId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}.${crypto.randomUUID()}`
  }

  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2)}`
}

export function getCheckoutTrackingContext() {
  if (typeof window === 'undefined') return {}

  return {
    ...getLandingSplitContext(),
    ...getLocaleTrackingParams(),
    fbp: getFacebookBrowserCookie(),
    fbc: getFacebookClickCookie(),
    sourceUrl: window.location.href,
    referrer: document.referrer,
  }
}
