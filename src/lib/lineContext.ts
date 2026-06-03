export type LineRequestContext = {
  lineUserId: string
  displayName?: string
  pictureUrl?: string
  email?: string
  isFriend?: boolean
  accessToken?: string
  idToken?: string
}

export const lineContextKey = 'fightnight_line_context'

export function saveLineContext(context: Omit<LineRequestContext, 'accessToken' | 'idToken'>) {
  if (typeof window === 'undefined') return
  if (!context.lineUserId) return

  try {
    window.localStorage.setItem(lineContextKey, JSON.stringify(context))
  } catch {
    // Checkout still works if browser storage is blocked.
  }
}

export function getLineRequestContext(): LineRequestContext | null {
  if (typeof window === 'undefined') return null

  try {
    const accessToken = window.liff?.getAccessToken?.() || undefined
    if (!accessToken) return null

    const raw = window.localStorage.getItem(lineContextKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<LineRequestContext>
    if (!parsed.lineUserId || typeof parsed.lineUserId !== 'string') return null
    const decodedEmail = window.liff?.getDecodedIDToken?.()?.email
    const lineEmail =
      typeof decodedEmail === 'string' && decodedEmail.trim()
        ? decodedEmail.trim()
        : typeof parsed.email === 'string'
          ? parsed.email
          : undefined

    return {
      lineUserId: parsed.lineUserId,
      displayName:
        typeof parsed.displayName === 'string' ? parsed.displayName : undefined,
      pictureUrl:
        typeof parsed.pictureUrl === 'string' ? parsed.pictureUrl : undefined,
      email: lineEmail,
      isFriend: parsed.isFriend === true,
      accessToken,
      idToken: window.liff?.getIDToken?.() || undefined,
    }
  } catch {
    return null
  }
}
