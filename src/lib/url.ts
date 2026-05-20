const DEFAULT_ORIGIN = 'https://fightnight.25min.co'

export function toAbsoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value

  const origin =
    typeof window !== 'undefined' ? window.location.origin : DEFAULT_ORIGIN
  const path = value.startsWith('/') ? value : `/${value}`

  return `${origin}${path}`
}
