type LiffProfile = {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

type LiffFriendship = {
  friendFlag: boolean
}

export type LiffInstance = {
  init: (config: {
    liffId: string
    withLoginOnExternalBrowser?: boolean
  }) => Promise<void>
  isLoggedIn: () => boolean
  login: (config?: { redirectUri?: string }) => void
  getAccessToken?: () => string | null
  getProfile: () => Promise<LiffProfile>
  getFriendship: () => Promise<LiffFriendship>
  requestFriendship: () => Promise<void>
}

declare global {
  interface Window {
    liff?: LiffInstance
  }
}

let liffPromise: Promise<LiffInstance> | null = null

export function loadLiffSdk() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('LIFF can only load in the browser.'))
  }

  if (window.liff) {
    return Promise.resolve(window.liff)
  }

  if (liffPromise) {
    return liffPromise
  }

  liffPromise = new Promise<LiffInstance>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-liff-sdk="true"]',
    )

    if (existing) {
      existing.addEventListener('load', () => {
        if (window.liff) {
          resolve(window.liff)
          return
        }
        reject(new Error('LIFF SDK loaded but window.liff is unavailable.'))
      })
      existing.addEventListener('error', () => {
        reject(new Error('Failed to load LIFF SDK.'))
      })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
    script.async = true
    script.dataset.liffSdk = 'true'
    script.onload = () => {
      if (window.liff) {
        resolve(window.liff)
        return
      }
      reject(new Error('LIFF SDK loaded but window.liff is unavailable.'))
    }
    script.onerror = () => reject(new Error('Failed to load LIFF SDK.'))
    document.head.appendChild(script)
  })

  return liffPromise
}
