const buildTimeEventLiffId = import.meta.env.VITE_EVENT_LINE_LIFF_ID
const buildTimeDefaultLiffId = import.meta.env.VITE_LINE_LIFF_ID

export function getBuildTimeLineConfirmLiffId() {
  return buildTimeEventLiffId || buildTimeDefaultLiffId || ''
}

function getRuntimeString(data: unknown, key: string) {
  if (!data || typeof data !== 'object') return ''
  const value = (data as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

export function getRuntimeLineConfirmLiffId(data: unknown) {
  return (
    getRuntimeString(data, 'eventLineLiffId') ||
    getRuntimeString(data, 'lineLiffId') ||
    ''
  )
}

export function buildFreeTrialLineConfirmPath(referenceId: string) {
  const params = new URLSearchParams({
    referenceId,
  })
  return `/line/free-trial-confirm?${params.toString()}`
}

export function buildLiffUrl(liffId: string, returnPath: string) {
  const encodedLiffId = encodeURIComponent(liffId)
  const stateUrl = new URL(returnPath, 'https://ufcgym.local')
  return `https://liff.line.me/${encodedLiffId}${stateUrl.pathname}${stateUrl.search}${stateUrl.hash}`
}
