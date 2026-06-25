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
    return normalizeRouteCandidate(new URL(raw, 'https://ufcgym.local').pathname)
  } catch {
    return normalizeRouteCandidate(raw)
  }
}

export function canonicalizeRoutePath(value: string) {
  const normalized = getRoutePathFromSource(value)
  const lower = normalized.toLowerCase()

  if (lower === '/index.html') return '/'
  if (lower === '/training-plan' || lower === '/training-plan.html') return '/training-plan'
  if (lower.startsWith('/training-plan/')) return '/training-plan'
  if (lower === '/single-session-event' || lower === '/single-session-event.html') {
    return '/single-session-event'
  }
  if (lower.startsWith('/single-session-event/')) return '/single-session-event'
  if (lower === '/paid-event' || lower === '/paid-event.html') return '/paid-event'
  if (lower.startsWith('/paid-event/')) return '/paid-event'
  if (lower === '/single-session-intro' || lower === '/single-session-intro.html') {
    return '/single-session-intro'
  }
  if (lower.startsWith('/single-session-intro/')) return '/single-session-intro'
  if (lower === '/offers' || lower === '/offers.html') return '/offers'
  if (lower.startsWith('/offers/')) return '/offers'
  if (lower === '/payment/success' || lower.startsWith('/payment/success/')) {
    return '/payment/success'
  }
  if (lower.startsWith('/guides/')) return '/guides'
  if (lower === '/privacy-policy' || lower === '/privacy-policy.html') {
    return '/privacy-policy'
  }
  if (lower === '/terms-of-service' || lower === '/terms-of-service.html') {
    return '/terms-of-service'
  }
  if (lower === '/refund-policy' || lower === '/refund-policy.html') {
    return '/refund-policy'
  }
  if (lower.startsWith('/admin')) return '/admin'

  return normalized
}
