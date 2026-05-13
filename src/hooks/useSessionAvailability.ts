import { useCallback, useEffect, useMemo, useState } from 'react'
import { ONLINE_SALES_SEAT_LIMIT } from '../data/weeklySchedule'

export type SessionAvailability = {
  capacity: number
  remaining: number
  sold: number
  updatedAt?: string
}

type ApiAvailabilityResponse = {
  availability?: Record<string, Partial<SessionAvailability>>
}

const REFRESH_MS = 15_000

function normalizeRecord(record?: Partial<SessionAvailability>): SessionAvailability {
  const capacity = Math.max(0, record?.capacity ?? ONLINE_SALES_SEAT_LIMIT)
  const sold = Math.max(0, record?.sold ?? 0)
  const remaining = Math.max(
    0,
    Math.min(capacity, record?.remaining ?? capacity - sold),
  )

  return {
    capacity,
    remaining,
    sold: Math.max(0, capacity - remaining),
    updatedAt: record?.updatedAt,
  }
}

export function useSessionAvailability(sessionIds: string[]) {
  const idsKey = useMemo(() => {
    return Array.from(new Set(sessionIds)).sort().join(',')
  }, [sessionIds])
  const ids = useMemo(() => (idsKey ? idsKey.split(',') : []), [idsKey])
  const [records, setRecords] = useState<Record<string, SessionAvailability>>({})
  const [hasLiveData, setHasLiveData] = useState(false)

  useEffect(() => {
    if (ids.length === 0) return

    let cancelled = false
    const controller = new AbortController()

    const fetchAvailability = async () => {
      try {
        const response = await fetch(
          `/api/session-availability?ids=${encodeURIComponent(ids.join(','))}`,
          {
            cache: 'no-store',
            signal: controller.signal,
          },
        )

        if (!response.ok) throw new Error('availability unavailable')

        const data = (await response.json()) as ApiAvailabilityResponse
        if (cancelled) return

        const nextRecords: Record<string, SessionAvailability> = {}
        for (const id of ids) {
          nextRecords[id] = normalizeRecord(data.availability?.[id])
        }

        setRecords(nextRecords)
        setHasLiveData(true)
      } catch {
        if (!cancelled) setHasLiveData(false)
      }
    }

    void fetchAvailability()
    const intervalId = window.setInterval(fetchAvailability, REFRESH_MS)

    return () => {
      cancelled = true
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [ids, idsKey])

  const getAvailability = useCallback(
    (sessionId: string) => normalizeRecord(records[sessionId]),
    [records],
  )

  return {
    getAvailability,
    hasLiveData,
  }
}
