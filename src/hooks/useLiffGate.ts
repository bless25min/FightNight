import { useCallback, useEffect, useState } from 'react'
import { saveBuyerContact } from '../lib/buyerContact'
import { loadLiffSdk } from '../lib/liff'
import { saveLineContext } from '../lib/lineContext'
import { getCheckoutTrackingContext } from '../lib/checkoutTracking'
import { canonicalizeRoutePath } from '../lib/routePath'

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

const defaultBuildTimeLiffId = import.meta.env.VITE_LINE_LIFF_ID
const eventBuildTimeLiffId = import.meta.env.VITE_EVENT_LINE_LIFF_ID
const trainingPlanBuildTimeLiffId = import.meta.env.VITE_BOOTCAMP_LINE_LIFF_ID
const eventFallbackLiffId = '2009987027-X2HAgwQw'
const trainingPlanFallbackLiffId = '2009987027-MtHp8nrN'
const missingConfigMessage = '找不到 LINE LIFF ID，請先補上正式環境變數。'
const liffErrorMessage = 'LIFF 驗證失敗，請稍後再試。'

type LiffSurface = 'default' | 'event' | 'trainingPlan'

type RuntimeLiffIds = {
  default?: string
  event?: string
  trainingPlan?: string
}

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

function getLiffSurface(sourcePath = getSourcePath()): LiffSurface {
  const pathname = canonicalizeRoutePath(sourcePath)
  if (pathname === '/training-plan') return 'trainingPlan'
  if (
    pathname === '/' ||
    pathname === '/single-session-event' ||
    pathname === '/paid-event'
  ) {
    return 'event'
  }
  return 'default'
}

function getLiffPlacement() {
  const sourcePath = getSourcePath()
  if (getLiffSurface(sourcePath) === 'trainingPlan') return 'training_plan_gate'
  if (getLiffSurface(sourcePath) === 'event') return 'event_gate'
  if (canonicalizeRoutePath(sourcePath) === '/offers') return 'offers_gate'
  return 'ticket_gate'
}

function getBuildTimeLiffId(sourcePath = getSourcePath()) {
  const surface = getLiffSurface(sourcePath)
  if (surface === 'trainingPlan') return trainingPlanBuildTimeLiffId
  if (surface === 'event') return eventBuildTimeLiffId
  return defaultBuildTimeLiffId
}

function getFallbackLiffId(sourcePath = getSourcePath()) {
  const surface = getLiffSurface(sourcePath)
  if (surface === 'trainingPlan') return trainingPlanFallbackLiffId
  if (surface === 'event') return eventFallbackLiffId
  return undefined
}

function buildLiffUrl(liffId: string, statePath = getSourcePath()) {
  const baseUrl = `https://liff.line.me/${encodeURIComponent(liffId)}`
  if (!statePath) return baseUrl

  const stateUrl = new URL(statePath, 'https://ufcgym.local')
  return `${baseUrl}${stateUrl.pathname}${stateUrl.search}${stateUrl.hash}`
}

function getRuntimeString(data: unknown, key: string) {
  if (!data || typeof data !== 'object') return undefined
  const value = (data as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getRuntimeLiffIds(data: unknown): RuntimeLiffIds {
  return {
    default: getRuntimeString(data, 'lineLiffId'),
    event: getRuntimeString(data, 'eventLineLiffId'),
    trainingPlan: getRuntimeString(data, 'trainingPlanLineLiffId'),
  }
}

function getRuntimeLiffIdForSource(
  runtimeLiffIds: RuntimeLiffIds,
  sourcePath = getSourcePath(),
) {
  const surface = getLiffSurface(sourcePath)
  if (surface === 'trainingPlan') {
    return runtimeLiffIds.trainingPlan
  }
  if (surface === 'event') {
    return runtimeLiffIds.event
  }
  return runtimeLiffIds.default
}

function getLiffEmail() {
  const email = window.liff?.getDecodedIDToken?.()?.email
  return typeof email === 'string' && email.trim() ? email.trim() : undefined
}

function getRecordAccessBuyerContact(
  data: unknown,
  fallbackLineUserId?: string | null,
) {
  if (!data || typeof data !== 'object') return null
  const responseLineUserId =
    typeof (data as { lineUserId?: unknown }).lineUserId === 'string'
      ? (data as { lineUserId: string }).lineUserId.trim()
      : ''
  const buyerContact = (data as { buyerContact?: unknown }).buyerContact
  if (!buyerContact || typeof buyerContact !== 'object') return null
  const value = buyerContact as {
    lineUserId?: unknown
    name?: unknown
    phone?: unknown
    email?: unknown
  }
  const contactLineUserId =
    typeof value.lineUserId === 'string' ? value.lineUserId.trim() : ''
  const lineUserId =
    contactLineUserId || responseLineUserId || fallbackLineUserId?.trim() || ''
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  const phone = typeof value.phone === 'string' ? value.phone.trim() : ''
  const email = typeof value.email === 'string' ? value.email.trim() : ''
  if (!lineUserId) return null
  if (!name && !phone && !email) return null
  return { lineUserId, name, phone, email }
}

async function recordLiffAccess(
  accessToken: string | null | undefined,
  friendFlag: boolean,
  lineUserId?: string | null,
) {
  if (!accessToken) return

  try {
    const response = await fetch('/api/liff/record-access', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        accessToken,
        idToken: window.liff?.getIDToken?.() || undefined,
        email: getLiffEmail(),
        friendFlag,
        placement: getLiffPlacement(),
        sourcePath: getSourcePath(),
        tracking: getCheckoutTrackingContext(),
        client: {
          screenWidth: String(window.screen.width),
          screenHeight: String(window.screen.height),
          timeZoneOffset: String(new Date().getTimezoneOffset()),
          transactionWebSite: window.location.origin,
          userAgent: window.navigator.userAgent,
          language: window.navigator.language,
          colorDepth: String(window.screen.colorDepth),
        },
      }),
    })

    if (!response.ok) return

    const data = await response.json().catch(() => null)
    const buyerContact = getRecordAccessBuyerContact(data, lineUserId)
    if (buyerContact) saveBuyerContact(buyerContact, buyerContact.lineUserId)
  } catch {
    // LIFF access tracking and prefill must not block the booking gate.
  }
}

export function useLiffGate() {
  const sourcePath = getSourcePath()
  const buildTimeLiffId = getBuildTimeLiffId(sourcePath)
  const [gateState, setGateState] = useState<LiffGateState>({
    status: 'loading',
  })
  const [runtimeLiffIds, setRuntimeLiffIds] = useState<RuntimeLiffIds>({})
  const [isConfigLoaded, setIsConfigLoaded] = useState(Boolean(buildTimeLiffId))
  const liffId =
    buildTimeLiffId ||
    getRuntimeLiffIdForSource(runtimeLiffIds, sourcePath) ||
    (isConfigLoaded ? getFallbackLiffId(sourcePath) : undefined)
  const getLoginUrl = (returnPath = getSourcePath()) => {
    if (!isMobileDevice() || !liffId) return undefined
    return buildLiffUrl(liffId, returnPath)
  }
  const liffUrl = liffId ? buildLiffUrl(liffId, sourcePath) : undefined
  const loginUrl = getLoginUrl(sourcePath)

  useEffect(() => {
    if (buildTimeLiffId) return

    let active = true

    fetch('/api/config', {
      headers: { accept: 'application/json' },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active) return
        setRuntimeLiffIds(getRuntimeLiffIds(data))
      })
      .catch(() => {
        if (!active) return
        setRuntimeLiffIds({})
      })
      .finally(() => {
        if (!active) return
        setIsConfigLoaded(true)
      })

    return () => {
      active = false
    }
  }, [buildTimeLiffId])

  const runGateCheck = useCallback(async () => {
    await Promise.resolve()

    if (!isConfigLoaded) return

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
      saveLineContext({
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        email: getLiffEmail(),
        isFriend: friendship.friendFlag,
      })
      await recordLiffAccess(
        liff.getAccessToken?.(),
        friendship.friendFlag,
        profile.userId,
      )

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
  }, [isConfigLoaded, liffId, setGateState])

  useEffect(() => {
    if (!isConfigLoaded) return

    const checkId = window.setTimeout(() => {
      void runGateCheck()
    }, 0)

    return () => window.clearTimeout(checkId)
  }, [isConfigLoaded, runGateCheck])

  const requestGateAccess = useCallback(async () => {
    if (!isConfigLoaded) {
      setGateState({ status: 'loading' })
      return false
    }

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
  }, [isConfigLoaded, liffId, runGateCheck, setGateState])

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
    getLoginUrl,
    liffUrl,
  }
}
