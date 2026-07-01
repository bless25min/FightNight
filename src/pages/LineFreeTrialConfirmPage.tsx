import { useEffect, useMemo, useRef, useState } from 'react'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { siteConfig } from '../data/landingContent'
import { useTracking } from '../hooks/useTracking'
import { getCheckoutTrackingContext } from '../lib/checkoutTracking'
import {
  getBuildTimeLineConfirmLiffId,
  getRuntimeLineConfirmLiffId,
} from '../lib/freeTrialLineConfirm'
import {
  isLineNotifyDelivered,
  isLineNotifyPending,
} from '../lib/freeTrialLineConfirmStatus'
import { loadLiffSdk, type LiffInstance } from '../lib/liff'
import { saveLineContext } from '../lib/lineContext'

type ConfirmStatus =
  | 'loading'
  | 'missing-reference'
  | 'missing-config'
  | 'login'
  | 'friend-required'
  | 'confirming'
  | 'sending'
  | 'success'
  | 'partial'
  | 'error'

type LineConfirmResponse = {
  ok?: boolean
  error?: string
  referenceId?: string
  lineNotify?: {
    status?: string
    error?: string
  }
}

type ConfirmMode = 'free-trial' | 'venue-pass'

type ConfirmTrackingNames = {
  startEvent: string
  startLineEventName: string
  loginRedirectEvent: string
  loginLineEventName: string
  friendRequiredEvent: string
  friendRequiredLineEventName: string
  successEvent: string
  successLineEventName: string
  pendingEvent: string
  pendingLineEventName: string
  partialEvent: string
  partialLineEventName: string
  errorEvent: string
  errorLineEventName: string
  friendRetryEvent: string
  friendRetryLineEventName: string
  closeEvent: string
  closeLineEventName: string
  openChatEvent: string
  openChatLineEventName: string
  ctaPrefix: string
  successMetaStandardEvent: 'Schedule' | 'Lead'
}

const FREE_TRIAL_CONFIRM_ENDPOINT = '/api/free-trial-reservation/line-confirm'
const VENUE_PASS_CONFIRM_ENDPOINT = '/api/venue-pass-lead/line-confirm'
const WRONG_FREE_TRIAL_FLOW_ERROR =
  'Only free trial reservations can be confirmed through this flow'

function isVenuePassReferenceId(referenceId: string) {
  return /^VP[A-Z0-9]/i.test(referenceId.trim())
}

function getConfirmModeForReferenceId(referenceId: string): ConfirmMode {
  return isVenuePassReferenceId(referenceId) ? 'venue-pass' : 'free-trial'
}

function getConfirmEndpoint(mode: ConfirmMode) {
  return mode === 'venue-pass'
    ? VENUE_PASS_CONFIRM_ENDPOINT
    : FREE_TRIAL_CONFIRM_ENDPOINT
}

function isWrongFreeTrialFlowError(message?: string) {
  return message === WRONG_FREE_TRIAL_FLOW_ERROR
}

function getTrackingNames(mode: ConfirmMode): ConfirmTrackingNames {
  if (mode === 'venue-pass') {
    return {
      startEvent: 'venue_pass_line_confirm_start',
      startLineEventName: 'VenuePassLineStart',
      loginRedirectEvent: 'venue_pass_line_confirm_login_redirect',
      loginLineEventName: 'VenuePassLineLogin',
      friendRequiredEvent: 'venue_pass_line_confirm_friend_required',
      friendRequiredLineEventName: 'VenuePassAddFriend',
      successEvent: 'venue_pass_line_confirm_success',
      successLineEventName: 'VenuePassConfirmed',
      pendingEvent: 'venue_pass_line_confirm_pending',
      pendingLineEventName: 'VenuePassConfirmPending',
      partialEvent: 'venue_pass_line_confirm_partial',
      partialLineEventName: 'VenuePassConfirmPartial',
      errorEvent: 'venue_pass_line_confirm_error',
      errorLineEventName: 'VenuePassLineError',
      friendRetryEvent: 'venue_pass_line_confirm_friend_retry',
      friendRetryLineEventName: 'VenuePassAddFriendRetry',
      closeEvent: 'venue_pass_line_confirm_close',
      closeLineEventName: 'VenuePassLineClose',
      openChatEvent: 'venue_pass_line_confirm_open_chat',
      openChatLineEventName: 'VenuePassLineChat',
      ctaPrefix: 'venue-pass-line-confirm',
      successMetaStandardEvent: 'Lead',
    }
  }

  return {
    startEvent: 'free_trial_line_confirm_start',
    startLineEventName: 'FreeTrialLineStart',
    loginRedirectEvent: 'free_trial_line_confirm_login_redirect',
    loginLineEventName: 'FreeTrialLineLogin',
    friendRequiredEvent: 'free_trial_line_confirm_friend_required',
    friendRequiredLineEventName: 'FreeTrialAddFriend',
    successEvent: 'free_trial_line_confirm_success',
    successLineEventName: 'FreeTrialConfirmed',
    pendingEvent: 'free_trial_line_confirm_pending',
    pendingLineEventName: 'FreeTrialConfirmPending',
    partialEvent: 'free_trial_line_confirm_partial',
    partialLineEventName: 'FreeTrialConfirmPartial',
    errorEvent: 'free_trial_line_confirm_error',
    errorLineEventName: 'FreeTrialLineError',
    friendRetryEvent: 'free_trial_line_confirm_friend_retry',
    friendRetryLineEventName: 'FreeTrialAddFriendRetry',
    closeEvent: 'free_trial_line_confirm_close',
    closeLineEventName: 'FreeTrialLineClose',
    openChatEvent: 'free_trial_line_confirm_open_chat',
    openChatLineEventName: 'FreeTrialLineChat',
    ctaPrefix: 'free-trial-line-confirm',
    successMetaStandardEvent: 'Schedule',
  }
}

function getReferenceIdFromLocation() {
  const params = new URLSearchParams(window.location.search)
  const referenceId = params.get('referenceId')
  if (referenceId) return referenceId

  const liffStatePath = params.get('liff.state') || ''
  if (liffStatePath.startsWith('/')) {
    try {
      const liffStateUrl = new URL(liffStatePath, window.location.origin)
      const liffReferenceId = liffStateUrl.searchParams.get('referenceId')
      if (liffReferenceId) return liffReferenceId
    } catch {
      // Fall through to hash parsing.
    }
  }

  const hashQuery = window.location.hash.split('?')[1] || ''
  return new URLSearchParams(hashQuery).get('referenceId') || ''
}

function buildCleanConfirmPath(referenceId: string, mode: ConfirmMode = 'free-trial') {
  const params = new URLSearchParams({ referenceId })
  const path =
    mode === 'venue-pass' ? '/line/venue-pass-confirm' : '/line/free-trial-confirm'
  return `${path}?${params.toString()}`
}

function getCleanConfirmUrl(referenceId: string, mode: ConfirmMode = 'free-trial') {
  return new URL(
    buildCleanConfirmPath(referenceId, mode),
    window.location.origin,
  ).toString()
}

function normalizeConfirmLocation(
  referenceId: string,
  mode: ConfirmMode = 'free-trial',
) {
  const cleanPath = buildCleanConfirmPath(referenceId, mode)
  const currentPath = `${window.location.pathname}${window.location.search}`
  if (currentPath !== cleanPath || window.location.hash) {
    window.history.replaceState(null, '', cleanPath)
  }
}

function getLiffEmail() {
  const email = window.liff?.getDecodedIDToken?.()?.email
  return typeof email === 'string' && email.trim() ? email.trim() : undefined
}

async function getLineConfirmLiffId() {
  const buildTimeLiffId = getBuildTimeLineConfirmLiffId()
  try {
    const response = await fetch('/api/config', {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
    const data = response.ok ? await response.json().catch(() => null) : null
    return getRuntimeLineConfirmLiffId(data) || buildTimeLiffId
  } catch {
    return buildTimeLiffId
  }
}

function getFriendRequestStorageKey(referenceId: string, mode: ConfirmMode) {
  return `ufcgym:${mode}-line-friend-request:${referenceId}`
}

function hasRequestedFriendship(referenceId: string, mode: ConfirmMode) {
  try {
    return (
      window.sessionStorage.getItem(getFriendRequestStorageKey(referenceId, mode)) ===
      '1'
    )
  } catch {
    return false
  }
}

function markFriendshipRequested(referenceId: string, mode: ConfirmMode) {
  try {
    window.sessionStorage.setItem(getFriendRequestStorageKey(referenceId, mode), '1')
  } catch {
    // Session storage may be unavailable in some in-app browsers.
  }
}

async function requestFriendshipAndRefresh(
  liff: LiffInstance,
  referenceId: string,
  mode: ConfirmMode,
) {
  markFriendshipRequested(referenceId, mode)
  try {
    await liff.requestFriendship()
    const nextFriendship = await liff.getFriendship()
    return nextFriendship.friendFlag
  } catch {
    return false
  }
}

function closeLiffWindow() {
  const liff = window.liff
  if (liff?.closeWindow && (!liff.isInClient || liff.isInClient())) {
    liff.closeWindow()
    return true
  }
  return false
}

function getVenuePassStatusCopy(status: ConfirmStatus) {
  if (status === 'success') {
    return {
      eyebrow: 'LINE CARD SENT',
      title: '七日通行優惠已保留。',
      body: '確認卡已傳到你的 LINE 聊天室。請回 LINE 點擊「確認領取」，場館方才會在聊天室接手安排。',
    }
  }
  if (status === 'partial') {
    return {
      eyebrow: 'LINE NEEDS HELP',
      title: '登記已綁定，確認卡暫時沒有送出。',
      body: '七日通行優惠已保留。請先保留這組登記編號，直接到 LINE 私訊專員協助確認領取。',
    }
  }
  if (status === 'sending') {
    return {
      eyebrow: 'LINE SENDING',
      title: '確認卡正在送出中。',
      body: '系統正在把七日通行優惠確認卡送到你的 LINE 聊天室。請回到 LINE 查看，收到後點擊「確認領取」。',
    }
  }
  if (status === 'friend-required') {
    return {
      eyebrow: 'ADD LINE FRIEND',
      title: '請先加入官方 LINE 好友。',
      body: '如果剛剛沒有完成加入好友，可以再開啟一次加好友；完成後系統會繼續送出七日通行優惠確認卡。',
    }
  }
  if (status === 'login') {
    return {
      eyebrow: 'LINE LOGIN',
      title: '正在開啟 LINE 登入。',
      body: '登入完成後，系統會自動回到這裡幫你送出七日通行優惠確認卡。',
    }
  }
  if (status === 'confirming') {
    return {
      eyebrow: 'CONFIRMING',
      title: '正在保留你的七日通行優惠。',
      body: '我們正在綁定登記編號，並把確認領取卡送到你的 LINE 聊天室。',
    }
  }
  if (status === 'missing-config') {
    return {
      eyebrow: 'LINE CONFIG',
      title: '目前找不到 LINE LIFF 設定。',
      body: '請先用官方 LINE 私訊登記編號，專員會協助確認領取七日通行優惠。',
    }
  }
  if (status === 'missing-reference') {
    return {
      eyebrow: 'MISSING REQUEST',
      title: '找不到登記編號。',
      body: '請回到登記成功頁，或直接到 LINE 私訊專員協助查詢。',
    }
  }
  if (status === 'error') {
    return {
      eyebrow: 'CONFIRM FAILED',
      title: 'LINE 快速確認沒有完成。',
      body: '請重新開啟一次確認連結；如果還是不成功，直接到 LINE 私訊登記編號協助確認領取。',
    }
  }
  return {
    eyebrow: 'LINE CONFIRM',
    title: '正在準備 LINE 場館七日通行優惠確認。',
    body: '請稍候，我們會把你的登記帶入 LINE 確認領取流程。',
  }
}

function getStatusCopy(status: ConfirmStatus, mode: ConfirmMode) {
  if (mode === 'venue-pass') {
    return getVenuePassStatusCopy(status)
  }

  if (status === 'success') {
    return {
      eyebrow: 'LINE CONFIRMED',
      title: 'LINE 確認卡已送出。',
      body: '確認卡已傳到你的 LINE 聊天室。請回到 LINE，點開卡片完成預約確認。',
    }
  }
  if (status === 'partial') {
    return {
      eyebrow: 'LINE NEEDS HELP',
      title: '預約已綁定，確認卡暫時沒有送出。',
      body: '請先保留這組預約編號，直接到 LINE 私訊專員協助確認入館時間。',
    }
  }
  if (status === 'sending') {
    return {
      eyebrow: 'LINE SENDING',
      title: '確認卡正在送出中。',
      body: '系統正在把確認卡送到你的 LINE 聊天室。請回到 LINE 查看；如果稍後仍沒收到，再請專員協助確認。',
    }
  }
  if (status === 'friend-required') {
    return {
      eyebrow: 'ADD LINE FRIEND',
      title: '請先加入官方 LINE 好友。',
      body: '如果剛剛沒有完成加入好友，可以再開啟一次加好友；完成後系統會繼續送出確認卡。',
    }
  }
  if (status === 'login') {
    return {
      eyebrow: 'LINE LOGIN',
      title: '正在開啟 LINE 登入。',
      body: '登入完成後，系統會自動回到這裡幫你送出預約確認卡。',
    }
  }
  if (status === 'confirming') {
    return {
      eyebrow: 'CONFIRMING',
      title: '正在確認你的 LINE 預約。',
      body: '我們正在綁定預約編號，並把確認卡送到你的 LINE 聊天室。',
    }
  }
  if (status === 'missing-config') {
    return {
      eyebrow: 'LINE CONFIG',
      title: '目前找不到 LINE LIFF 設定。',
      body: '請先用官方 LINE 私訊預約編號，專員會協助確認入館時間。',
    }
  }
  if (status === 'missing-reference') {
    return {
      eyebrow: 'MISSING RESERVATION',
      title: '找不到預約編號。',
      body: '請回到預約成功頁，或直接到 LINE 私訊專員協助查詢。',
    }
  }
  if (status === 'error') {
    return {
      eyebrow: 'CONFIRM FAILED',
      title: 'LINE 快速確認沒有完成。',
      body: '請重新開啟一次確認連結；如果還是不成功，直接到 LINE 私訊預約編號即可。',
    }
  }
  return {
    eyebrow: 'LINE CONFIRM',
    title: '正在準備 LINE 快速確認。',
    body: '請稍候，我們會把你的預約帶入 LINE 確認流程。',
  }
}

export function LineFreeTrialConfirmPage() {
  const { track } = useTracking()
  const hasStarted = useRef(false)
  const referenceId = useMemo(getReferenceIdFromLocation, [])
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(() =>
    getConfirmModeForReferenceId(referenceId),
  )
  const [status, setStatus] = useState<ConfirmStatus>(
    referenceId ? 'loading' : 'missing-reference',
  )
  const [error, setError] = useState('')
  const [lineNotifyStatus, setLineNotifyStatus] = useState('')
  const [friendRetrying, setFriendRetrying] = useState(false)

  useEffect(() => {
    if (!referenceId || hasStarted.current) return
    hasStarted.current = true

    let cancelled = false

    const run = async () => {
      let activeConfirmMode = getConfirmModeForReferenceId(referenceId)
      if (!cancelled) setConfirmMode(activeConfirmMode)

      try {
        let trackingNames = getTrackingNames(activeConfirmMode)
        track({
          event: trackingNames.startEvent,
          params: {
            reference_id: referenceId,
          },
          lineEventName: trackingNames.startLineEventName,
        })

        const liffId = await getLineConfirmLiffId()
        if (!liffId) {
          if (!cancelled) setStatus('missing-config')
          return
        }

        const liff = await loadLiffSdk()
        await liff.init({
          liffId,
          withLoginOnExternalBrowser: false,
        })
        if (activeConfirmMode === 'venue-pass') {
          normalizeConfirmLocation(referenceId, activeConfirmMode)
        } else {
          normalizeConfirmLocation(referenceId)
        }

        if (!liff.isLoggedIn()) {
          if (!cancelled) setStatus('login')
          track({
            event: trackingNames.loginRedirectEvent,
            params: { reference_id: referenceId },
            lineEventName: trackingNames.loginLineEventName,
          })
          liff.login({ redirectUri: getCleanConfirmUrl(referenceId, activeConfirmMode) })
          return
        }

        const [profile, friendship] = await Promise.all([
          liff.getProfile(),
          liff.getFriendship(),
        ])
        let isFriend = friendship.friendFlag

        if (!isFriend) {
          if (!cancelled) setStatus('friend-required')
          if (!hasRequestedFriendship(referenceId, activeConfirmMode)) {
            isFriend = await requestFriendshipAndRefresh(
              liff,
              referenceId,
              activeConfirmMode,
            )
          }
        }

        if (!isFriend) {
          track({
            event: trackingNames.friendRequiredEvent,
            params: { reference_id: referenceId },
            lineEventName: trackingNames.friendRequiredLineEventName,
          })
          return
        }

        saveLineContext({
          lineUserId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          email: getLiffEmail(),
          isFriend,
        })

        if (!cancelled) setStatus('confirming')

        const lineConfirmPayload = {
          referenceId,
          lineContext: {
            accessToken: liff.getAccessToken?.(),
            idToken: liff.getIDToken?.(),
            email: getLiffEmail(),
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            friendFlag: isFriend,
          },
          tracking: getCheckoutTrackingContext(),
          sourcePath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        }

        const postLineConfirm = async (mode: ConfirmMode) => {
          const response = await fetch(getConfirmEndpoint(mode), {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify(lineConfirmPayload),
          })
          const data = (await response.json().catch(() => null)) as
            | LineConfirmResponse
            | null
          return { response, data }
        }

        let { response, data } = await postLineConfirm(activeConfirmMode)
        if (
          activeConfirmMode === 'free-trial' &&
          (!response.ok || !data?.ok) &&
          isWrongFreeTrialFlowError(data?.error)
        ) {
          activeConfirmMode = 'venue-pass'
          trackingNames = getTrackingNames(activeConfirmMode)
          if (!cancelled) setConfirmMode(activeConfirmMode)
          const venuePassResult = await postLineConfirm(activeConfirmMode)
          response = venuePassResult.response
          data = venuePassResult.data
        }

        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || 'LINE 確認失敗，請稍後再試。')
        }

        const notifyStatus = data.lineNotify?.status || ''
        const notifyDelivered = isLineNotifyDelivered(notifyStatus)
        const notifyPending = isLineNotifyPending(notifyStatus)
        if (!cancelled) {
          setLineNotifyStatus(notifyStatus)
          setStatus(
            notifyDelivered ? 'success' : notifyPending ? 'sending' : 'partial',
          )
        }

        if (notifyDelivered) {
          track({
            event: trackingNames.successEvent,
            params: {
              reference_id: referenceId,
              line_notify_status: notifyStatus,
            },
            metaStandardEvent: trackingNames.successMetaStandardEvent,
            lineEventName: trackingNames.successLineEventName,
          })
          window.setTimeout(() => {
            if (!cancelled) closeLiffWindow()
          }, 1200)
        } else if (notifyPending) {
          track({
            event: trackingNames.pendingEvent,
            params: {
              reference_id: referenceId,
              line_notify_status: notifyStatus,
            },
            lineEventName: trackingNames.pendingLineEventName,
          })
        } else {
          track({
            event: trackingNames.partialEvent,
            params: {
              reference_id: referenceId,
              line_notify_status: notifyStatus,
            },
            lineEventName: trackingNames.partialLineEventName,
          })
        }
      } catch (confirmError) {
        const message =
          confirmError instanceof Error
            ? confirmError.message
            : 'LINE 確認失敗，請稍後再試。'
        if (!cancelled) {
          setError(message)
          setStatus('error')
        }
        const trackingNames = getTrackingNames(activeConfirmMode)
        track({
          event: trackingNames.errorEvent,
          params: {
            reference_id: referenceId,
            error_message: message,
          },
          lineEventName: trackingNames.errorLineEventName,
        })
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [referenceId, track])

  const handleFriendRetry = async () => {
    const liff = window.liff
    if (!referenceId || !liff) {
      setError('LINE SDK 尚未完成，請重新開啟確認連結。')
      setStatus('error')
      return
    }

    setFriendRetrying(true)
    const trackingNames = getTrackingNames(confirmMode)
    track({
      event: trackingNames.friendRetryEvent,
      params: { reference_id: referenceId },
      lineEventName: trackingNames.friendRetryLineEventName,
    })

    const isFriend = await requestFriendshipAndRefresh(liff, referenceId, confirmMode)
    if (isFriend) {
      window.location.reload()
      return
    }

    setFriendRetrying(false)
    setStatus('friend-required')
  }

  const copy = getStatusCopy(status, confirmMode)
  const trackingNames = getTrackingNames(confirmMode)
  const isBusy = ['loading', 'login', 'confirming'].includes(status) || friendRetrying
  const shouldShowLineReturnButton = status === 'success' || status === 'sending'
  const shouldShowFriendRetryButton = status === 'friend-required'
  const shouldShowSupportButton = ['friend-required', 'partial', 'error', 'missing-config', 'missing-reference'].includes(status)
  const referenceLabel = confirmMode === 'venue-pass' ? '登記編號' : '預約編號'
  const homeLabel = confirmMode === 'venue-pass' ? '回到活動頁' : '回到課程頁'

  return (
    <div className="min-h-screen overflow-x-hidden bg-abyss text-pearl">
      <Header />
      <main className="mx-auto flex min-h-[72vh] max-w-2xl flex-col justify-center px-3 pb-14 pt-28 sm:px-8 md:pt-36">
        <section className="rounded-3xl border border-pearl/10 bg-black/35 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] md:p-8">
          <p className="inline-flex rounded-full border border-neon/35 bg-neon/10 px-3 py-1 text-xs font-heading font-bold uppercase tracking-[0.22em] text-neon">
            {copy.eyebrow}
          </p>
          <h1 className="mt-5 font-heading text-3xl font-black leading-tight text-pearl md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-mist/76 md:text-lg">
            {copy.body}
          </p>

          {referenceId && (
            <p className="mt-5 rounded-xl border border-pearl/10 bg-black/24 px-3 py-2 font-mono text-xs text-mist/72">
              {referenceLabel}：{referenceId}
            </p>
          )}

          {lineNotifyStatus && ['partial', 'sending'].includes(status) && (
            <p className="mt-3 text-xs leading-relaxed text-coral/80">
              LINE 發送狀態：{lineNotifyStatus}
            </p>
          )}

          {error && (
            <p className="mt-3 text-xs leading-relaxed text-coral/80">
              {error}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {shouldShowLineReturnButton && (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                data-cta={`${trackingNames.ctaPrefix}-close`}
                onClick={() => {
                  track({
                    event: trackingNames.closeEvent,
                    params: {
                      reference_id: referenceId,
                      confirm_status: status,
                      line_notify_status: lineNotifyStatus,
                    },
                    lineEventName: trackingNames.closeLineEventName,
                  })
                  closeLiffWindow()
                }}
              >
                {status === 'sending' ? '回到 LINE 等確認卡' : '回到 LINE 查看確認卡'}
              </Button>
            )}
            {shouldShowFriendRetryButton && (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                data-cta={`${trackingNames.ctaPrefix}-friend-retry`}
                disabled={friendRetrying}
                onClick={handleFriendRetry}
              >
                {friendRetrying ? '正在開啟 LINE 加好友' : '再次開啟 LINE 加好友'}
              </Button>
            )}
            {shouldShowSupportButton && (
              <Button
                href={siteConfig.lineUrl}
                variant="secondary"
                size="lg"
                className="w-full"
                data-cta={`${trackingNames.ctaPrefix}-open-chat`}
                onClick={() =>
                  track({
                    event: trackingNames.openChatEvent,
                    params: {
                      reference_id: referenceId,
                      confirm_status: status,
                      line_notify_status: lineNotifyStatus,
                    },
                    metaStandardEvent: 'Contact',
                    lineEventName: trackingNames.openChatLineEventName,
                  })
                }
              >
                找專員協助確認
              </Button>
            )}
            <Button
              href="/"
              variant="ghost"
              size="lg"
              className="w-full"
              data-cta={`${trackingNames.ctaPrefix}-home`}
            >
              {homeLabel}
            </Button>
          </div>

          {isBusy && (
            <p className="mt-5 text-center text-xs leading-relaxed text-mist/55">
              請不要關閉頁面。
            </p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
