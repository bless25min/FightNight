export const freeTrialBridgeStorageKey = 'ufcgym_free_trial_bridge'

export type FreeTrialBridgeBuyer = {
  name: string
  phone: string
  email: string
}

export type FreeTrialBridgeState = {
  draftId: string
  referenceId?: string
  courseId: string
  courseName: string
  venueName?: string
  date?: string
  weekday?: string
  startTime?: string
  endTime?: string
  originalAmountValue?: number
  buyer: FreeTrialBridgeBuyer
  sessionIds?: string[]
  seriesDates?: string[]
  createdAt: string
}

export function writeFreeTrialBridgeState(state: FreeTrialBridgeState) {
  if (typeof window === 'undefined') return

  window.sessionStorage.setItem(
    freeTrialBridgeStorageKey,
    JSON.stringify(state),
  )
}

export function readFreeTrialBridgeState(): FreeTrialBridgeState | null {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(freeTrialBridgeStorageKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<FreeTrialBridgeState>
    if (
      !parsed.courseId ||
      !parsed.courseName ||
      !parsed.buyer?.name ||
      !parsed.buyer?.phone
    ) {
      return null
    }

    return {
      draftId:
        parsed.draftId ??
        parsed.referenceId ??
        `draft-${Date.now().toString(36)}`,
      referenceId: parsed.referenceId,
      courseId: parsed.courseId,
      courseName: parsed.courseName,
      venueName: parsed.venueName,
      date: parsed.date,
      weekday: parsed.weekday,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      originalAmountValue: parsed.originalAmountValue,
      buyer: {
        name: parsed.buyer.name,
        phone: parsed.buyer.phone,
        email: parsed.buyer.email ?? '',
      },
      sessionIds: parsed.sessionIds,
      seriesDates: parsed.seriesDates,
      createdAt: parsed.createdAt ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}
