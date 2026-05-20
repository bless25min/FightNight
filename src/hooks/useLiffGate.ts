import { useCallback, useEffect, useState } from 'react'
import { loadLiffSdk } from '../lib/liff'

export type LiffGateStatus =
  | 'loading'
  | 'missing-config'
  | 'logged-out'
  | 'not-friend'
  | 'unlocked'
  | 'error'

export type LiffGateState = {
  status: LiffGateStatus
  message?: string
  profileName?: string
}

const missingConfigMessage = '找不到 VITE_LINE_LIFF_ID，請先補上正式環境變數。'
const liffErrorMessage = 'LIFF 驗證失敗，請稍後再試。'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : liffErrorMessage
}

function isMobileDevice() {
  if (typeof window === 'undefined') return false
  const userAgent = window.navigator.userAgent
  const mobileViewport =
    window.matchMedia?.('(max-width: 767px)').matches &&
    window.navigator.maxTouchPoints > 0
  return /Android|iPhone|iPad|iPod|Line/i.test(userAgent) || mobileViewport
}

function getSourcePath() {
  if (typeof window === 'undefined') return ''
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function getLiffPlacement() {
  const sourcePath = getSourcePath()
  if (sourcePath.includes('boot-camp')) return 'boot_camp_gate'
  if (sourcePath.includes('offers')) return 'offers_gate'
  return 'ticket_gate'
}

function recordLiffAccess(accessToken: string | null | undefined, friendFlag: boolean) {
  if (!accessToken) return

  void fetch('/api/liff/record-access', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      accessToken,
      friendFlag,
      placement: getLiffPlacement(),
      sourcePath: getSourcePath(),
    }),
    keepalive: true,
  }).catch(() => undefined)
}

export function useLiffGate() {
  const [gateState, setGateState] = useState<LiffGateState>({
    status: 'loading',
  })
  const liffId = import.meta.env.VITE_LINE_LIFF_ID
  const liffUrl = liffId
    ? `https://line.me/R/app/${liffId}`
    : undefined
  const loginUrl = isMobileDevice() ? liffUrl : undefined

  const runGateCheck = useCallback(async () => {
    await Promise.resolve()

    if (!liffId) {
      setGateState({
        status: 'missing-config',
        message: missingConfigMessage,
      })
      return
    }

    try {
      const liff = await loadLiffSdk()
      await liff.init({
        liffId,
        withLoginOnExternalBrowser: false,
      })

      if (!liff.isLoggedIn()) {
        setGateState({ status: 'logged-out' })
        return
      }

      const [profile, friendship] = await Promise.all([
        liff.getProfile(),
        liff.getFriendship(),
      ])
      recordLiffAccess(liff.getAccessToken?.(), friendship.friendFlag)

      if (friendship.friendFlag) {
        setGateState({
          status: 'unlocked',
          profileName: profile.displayName,
        })
        return
      }

      setGateState({
        status: 'not-friend',
        profileName: profile.displayName,
      })
    } catch (error) {
      setGateState({ status: 'error', message: getErrorMessage(error) })
    }
  }, [liffId])

  useEffect(() => {
    const checkId = window.setTimeout(() => {
      void runGateCheck()
    }, 0)

    return () => window.clearTimeout(checkId)
  }, [runGateCheck])

  const requestGateAccess = useCallback(async () => {
    if (!liffId) {
      setGateState({
        status: 'missing-config',
        message: missingConfigMessage,
      })
      return false
    }

    try {
      const liff = await loadLiffSdk()
      await liff.init({
        liffId,
        withLoginOnExternalBrowser: false,
      })

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href })
        return false
      }

      const friendship = await liff.getFriendship()
      if (!friendship.friendFlag) {
        await liff.requestFriendship()
        await runGateCheck()
        return false
      }

      await runGateCheck()
      return true
    } catch (error) {
      setGateState({ status: 'error', message: getErrorMessage(error) })
      return false
    }
  }, [liffId, runGateCheck])

  const openWhenUnlocked = useCallback(
    async (redirectUrl: string) => {
      const unlocked = await requestGateAccess()
      if (!unlocked) return

      window.open(redirectUrl, '_blank', 'noopener,noreferrer')
    },
    [requestGateAccess],
  )

  return {
    gateState,
    isUnlocked: gateState.status === 'unlocked',
    runGateCheck,
    requestGateAccess,
    openWhenUnlocked,
    loginUrl,
    liffUrl,
  }
}
