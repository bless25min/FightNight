import { useCallback, useEffect, useState } from 'react'
import {
  getLocaleDecision,
  saveUserLocale,
  type LocaleDecision,
  type SupportedLocale,
  updateUrlLocale,
} from '../lib/locale'

export function useLocale() {
  const [decision, setDecision] = useState<LocaleDecision>(() =>
    getLocaleDecision(),
  )

  useEffect(() => {
    document.documentElement.lang = decision.locale
  }, [decision.locale])

  const setLocale = useCallback((locale: SupportedLocale) => {
    saveUserLocale(locale)
    updateUrlLocale(locale)
    setDecision(getLocaleDecision())
  }, [])

  return {
    ...decision,
    setLocale,
  }
}
