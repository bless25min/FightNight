const deliveredLineNotifyStatuses = new Set(['sent', 'skipped_already_sent'])
const pendingLineNotifyStatuses = new Set(['skipped_in_progress_or_sent'])

export function isLineNotifyDelivered(status: string | undefined) {
  return deliveredLineNotifyStatuses.has(status || '')
}

export function isLineNotifyPending(status: string | undefined) {
  return pendingLineNotifyStatuses.has(status || '')
}
