function readCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : ''
}

function buildFacebookClickCookie() {
  if (typeof window === 'undefined') return ''
  const fbclid = new URLSearchParams(window.location.search).get('fbclid')
  if (!fbclid) return ''
  return `fb.1.${Date.now()}.${fbclid}`
}

export function getCheckoutTrackingContext() {
  if (typeof window === 'undefined') return {}

  return {
    fbp: readCookie('_fbp'),
    fbc: readCookie('_fbc') || buildFacebookClickCookie(),
    sourceUrl: window.location.href,
    referrer: document.referrer,
  }
}
