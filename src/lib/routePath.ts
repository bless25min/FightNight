function normalizeRouteCandidate(value: string) {
  const pathWithoutHash = value.split('#')[0] || value
  const pathWithoutQuery = pathWithoutHash.split('?')[0] || '/'
  const normalized = pathWithoutQuery.replace(/\/+$/, '') || '/'
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

function getHashRoutePath(value: string) {
  const hashRouteIndex = value.indexOf('#/')
  if (hashRouteIndex < 0) return ''

  return normalizeRouteCandidate(value.slice(hashRouteIndex + 1))
}

export function getRoutePathFromSource(value: string) {
  const raw = String(value || '').trim()
  if (!raw) return '/'

  const hashRoute = getHashRoutePath(raw)
  if (hashRoute) return hashRoute

  try {
    return normalizeRouteCandidate(new URL(raw, 'https://fightnight.local').pathname)
  } catch {
    return normalizeRouteCandidate(raw)
  }
}

export function canonicalizeRoutePath(value: string) {
  const normalized = getRoutePathFromSource(value)
  const lower = normalized.toLowerCase()

  if (lower === '/index.html') return '/'
  if (lower === '/boot-camp' || lower === '/boot-camp.html') return '/boot-camp'
  if (lower.startsWith('/boot-camp/')) return '/boot-camp'
  if (lower === '/fight-night-event' || lower === '/fight-night-event.html') {
    return '/fight-night-event'
  }
  if (lower.startsWith('/fight-night-event/')) return '/fight-night-event'
  if (lower === '/fight-night-intro' || lower === '/fight-night-intro.html') {
    return '/fight-night-intro'
  }
  if (lower.startsWith('/fight-night-intro/')) return '/fight-night-intro'
  if (lower === '/offers' || lower === '/offers.html') return '/offers'
  if (lower.startsWith('/offers/')) return '/offers'
  if (lower === '/payment/success' || lower.startsWith('/payment/success/')) {
    return '/payment/success'
  }
  if (lower.startsWith('/guides/')) return '/guides'
  if (lower === '/privacy-policy' || lower === '/privacy-policy.html') {
    return '/privacy-policy'
  }
  if (lower === '/refund-policy' || lower === '/refund-policy.html') {
    return '/refund-policy'
  }
  if (lower.startsWith('/admin')) return '/admin'

  return normalized
}
