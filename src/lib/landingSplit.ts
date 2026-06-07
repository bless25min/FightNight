export type LandingSplitContext = {
  experiment_id?: string
  experiment_variant?: string
  first_experiment_variant?: string
  split_visit_id?: string
  split_assignment_mode?: string
  split_original_path?: string
  split_assigned_path?: string
}

const splitCookieNames = {
  experimentId: 'fn_split_experiment_id',
  firstVariant: 'fn_split_first_variant',
  sessionVariant: 'fn_split_session_variant',
  visitId: 'fn_split_visit_id',
  assignmentMode: 'fn_split_assignment_mode',
  originalPath: 'fn_split_original_path',
  assignedPath: 'fn_split_assigned_path',
}

function trimText(value: unknown, maxLength = 240) {
  return String(value || '').trim().slice(0, maxLength)
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return ''

  const encodedName = `${encodeURIComponent(name)}=`
  const row = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(encodedName))
  if (!row) return ''

  try {
    return decodeURIComponent(row.slice(encodedName.length))
  } catch {
    return row.slice(encodedName.length)
  }
}

function readSearchParam(params: URLSearchParams, key: string) {
  return trimText(params.get(key), 240)
}

function getCurrentPath() {
  if (typeof window === 'undefined') return ''
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function getLandingSplitContext(): LandingSplitContext {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  if (params.get('split') === 'off') return {}

  const experimentId =
    readSearchParam(params, 'experiment_id') ||
    trimText(readCookie(splitCookieNames.experimentId), 80)
  const variant =
    readSearchParam(params, 'experiment_variant') ||
    trimText(readCookie(splitCookieNames.sessionVariant), 40)
  const firstVariant =
    readSearchParam(params, 'first_experiment_variant') ||
    trimText(readCookie(splitCookieNames.firstVariant), 40) ||
    variant
  const visitId =
    readSearchParam(params, 'split_visit_id') ||
    trimText(readCookie(splitCookieNames.visitId), 120)

  if (!experimentId && !variant && !visitId) return {}

  return {
    experiment_id: experimentId,
    experiment_variant: variant,
    first_experiment_variant: firstVariant,
    split_visit_id: visitId,
    split_assignment_mode:
      readSearchParam(params, 'split_assignment_mode') ||
      trimText(readCookie(splitCookieNames.assignmentMode), 80),
    split_original_path: trimText(readCookie(splitCookieNames.originalPath), 600),
    split_assigned_path:
      trimText(readCookie(splitCookieNames.assignedPath), 240) || getCurrentPath(),
  }
}
