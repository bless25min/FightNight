export type SupportedLocale = 'zh-TW' | 'en'

export type LocaleSource = 'url' | 'user' | 'default'

export type LocaleDecision = {
  locale: SupportedLocale
  source: LocaleSource
  browserLanguage: string
  selectedLanguage: string
  urlLanguage: string
}

export const supportedLocales: SupportedLocale[] = ['zh-TW', 'en']

const localeStorageKey = 'fightnight_locale'

function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale)
}

export function normalizeLocale(value?: string | null): SupportedLocale | '' {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const lower = raw.replace('_', '-').toLowerCase()
  if (lower === 'zh' || lower.startsWith('zh-tw') || lower.startsWith('zh-hant')) {
    return 'zh-TW'
  }
  if (lower.startsWith('zh-hk') || lower.startsWith('zh-mo')) return 'zh-TW'
  if (lower.startsWith('en')) return 'en'
  if (isSupportedLocale(raw)) return raw

  return ''
}

function readUrlLocale() {
  if (typeof window === 'undefined') return ''

  const params = new URLSearchParams(window.location.search)
  return normalizeLocale(params.get('lang') || params.get('locale'))
}

function readSavedLocale() {
  if (typeof window === 'undefined') return ''

  try {
    return normalizeLocale(window.localStorage.getItem(localeStorageKey))
  } catch {
    return ''
  }
}

function readBrowserLanguage() {
  if (typeof window === 'undefined') return ''

  return window.navigator.languages?.[0] || window.navigator.language || ''
}

export function getLocaleDecision(): LocaleDecision {
  const browserLanguage = readBrowserLanguage()
  const urlLanguage = readUrlLocale()
  const selectedLanguage = readSavedLocale()

  if (urlLanguage) {
    return {
      locale: urlLanguage,
      source: 'url',
      browserLanguage,
      selectedLanguage,
      urlLanguage,
    }
  }

  if (selectedLanguage) {
    return {
      locale: selectedLanguage,
      source: 'user',
      browserLanguage,
      selectedLanguage,
      urlLanguage,
    }
  }

  return {
    locale: 'zh-TW',
    source: 'default',
    browserLanguage,
    selectedLanguage,
    urlLanguage,
  }
}

export function saveUserLocale(locale: SupportedLocale) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(localeStorageKey, locale)
  } catch {
    // Locale selection should never block rendering.
  }
}

export function updateUrlLocale(locale: SupportedLocale) {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  url.searchParams.set('lang', locale)
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
}

export function getLocaleTrackingParams() {
  const decision = getLocaleDecision()

  return {
    page_language: decision.locale,
    language_source: decision.source,
    selected_language: decision.selectedLanguage,
    url_language: decision.urlLanguage,
    detected_browser_language: decision.browserLanguage,
  }
}
