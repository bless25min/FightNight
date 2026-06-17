const DEFAULT_ORIGIN = 'https://booking.ufcgym.com.tw'

export function toAbsoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value

  const origin =
    typeof window !== 'undefined' ? window.location.origin : DEFAULT_ORIGIN
  const path = value.startsWith('/') ? value : `/${value}`

  return `${origin}${path}`
}
