// 滾動深度追蹤 — scroll_25 / scroll_50 / scroll_75 / scroll_100

import { useEffect, useRef } from 'react'
import { useTracking } from './useTracking'

export function useScrollProgress() {
  const { track } = useTracking()
  const fired = useRef(new Set<number>())

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (total <= 0) return
      const pct = Math.round((window.scrollY / total) * 100)

      for (const cp of [25, 50, 75, 100]) {
        if (pct >= cp && !fired.current.has(cp)) {
          fired.current.add(cp)
          track({ event: `scroll_${cp}` })
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
