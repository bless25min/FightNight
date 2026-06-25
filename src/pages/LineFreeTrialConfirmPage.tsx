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
import { loadLiffSdk } from '../lib/liff'
import { saveLineContext } from '../lib/lineContext'

type ConfirmStatus =
  | 'loading'
  | 'missing-reference'
  | 'missing-config'
  | 'login'
  | 'friend-required'
  | 'confirming'
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

function isLineNotifySent(status: string | undefined) {
  return ['sent', 'skipped_already_sent', 'skipped_in_progress_or_sent'].includes(
    status || '',
  )
}

function getStatusCopy(status: ConfirmStatus) {
  if (status === 'success') {
    return {
      eyebrow: 'LINE CONFIRMED',
      title: 'LINE 確認卡已送出。',
      body: '預約已綁定你的 LINE，確認卡已傳到聊天室。點開卡片按鈕後，就能在 LINE 對話中完成確認。',
    }
  }
  if (status === 'partial') {
    return {
      eyebrow: 'LINE NEEDS HELP',
      title: '預約已綁定，確認卡暫時沒有送出。',
      body: '請先保留這組預約編號，直接到 LINE 私訊專員協助確認入館時間。',
    }
  }
  if (status === 'friend-required') {
    return {
      eyebrow: 'ADD LINE FRIEND',
      title: '請先加入官方 LINE 好友。',
      body: '加入好友後回到這個頁面，系統才能把預約確認卡傳到你的 LINE 聊天室。',
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
  const [status, setStatus] = useState<ConfirmStatus>(
    referenceId ? 'loading' : 'missing-reference',
  )
  const [error, setError] = useState('')
  const [lineNotifyStatus, setLineNotifyStatus] = useState('')

  useEffect(() => {
    if (!referenceId || hasStarted.current) return
    hasStarted.current = true

    let cancelled = false

    const run = async () => {
      try {
        track({
          event: 'free_trial_line_confirm_start',
          params: {
            reference_id: referenceId,
          },
          lineEventName: 'FreeTrialLineStart',
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

        if (!liff.isLoggedIn()) {
          if (!cancelled) setStatus('login')
          track({
            event: 'free_trial_line_confirm_login_redirect',
            params: { reference_id: referenceId },
            lineEventName: 'FreeTrialLineLogin',
          })
          liff.login({ redirectUri: window.location.href })
          return
        }

        const [profile, friendship] = await Promise.all([
          liff.getProfile(),
          liff.getFriendship(),
        ])
        let isFriend = friendship.friendFlag

        if (!isFriend) {
          if (!cancelled) setStatus('friend-required')
          try {
            await liff.requestFriendship()
            const nextFriendship = await liff.getFriendship()
            isFriend = nextFriendship.friendFlag
          } catch {
            isFriend = false
          }
        }

        if (!isFriend) {
          track({
            event: 'free_trial_line_confirm_friend_required',
            params: { reference_id: referenceId },
            lineEventName: 'FreeTrialAddFriend',
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

        const response = await fetch('/api/free-trial-reservation/line-confirm', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
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
          }),
        })
        const data = (await response.json().catch(() => null)) as
          | LineConfirmResponse
          | null

        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || 'LINE 確認失敗，請稍後再試。')
        }

        const notifyStatus = data.lineNotify?.status || ''
        if (!cancelled) {
          setLineNotifyStatus(notifyStatus)
          setStatus(isLineNotifySent(notifyStatus) ? 'success' : 'partial')
        }

        track({
          event: 'free_trial_line_confirm_success',
          params: {
            reference_id: referenceId,
            line_notify_status: notifyStatus,
          },
          metaStandardEvent: 'Schedule',
          lineEventName: 'FreeTrialConfirmed',
        })
      } catch (confirmError) {
        const message =
          confirmError instanceof Error
            ? confirmError.message
            : 'LINE 確認失敗，請稍後再試。'
        if (!cancelled) {
          setError(message)
          setStatus('error')
        }
        track({
          event: 'free_trial_line_confirm_error',
          params: {
            reference_id: referenceId,
            error_message: message,
          },
          lineEventName: 'FreeTrialLineError',
        })
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [referenceId, track])

  const copy = getStatusCopy(status)
  const isBusy = ['loading', 'login', 'confirming'].includes(status)

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
              預約編號：{referenceId}
            </p>
          )}

          {lineNotifyStatus && status === 'partial' && (
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
            <Button
              href={siteConfig.lineUrl}
              variant={status === 'success' ? 'primary' : 'secondary'}
              size="lg"
              className="w-full"
              data-cta="free-trial-line-confirm-open-chat"
              onClick={() =>
                track({
                  event: 'free_trial_line_confirm_open_chat',
                  params: {
                    reference_id: referenceId,
                    confirm_status: status,
                    line_notify_status: lineNotifyStatus,
                  },
                  metaStandardEvent: 'Contact',
                  lineEventName: 'FreeTrialLineChat',
                })
              }
            >
              打開 LINE 聊天室
            </Button>
            <Button
              href="/"
              variant="ghost"
              size="lg"
              className="w-full"
              data-cta="free-trial-line-confirm-home"
            >
              回到課程頁
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
