import { useEffect, useMemo, useState } from 'react'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { siteConfig } from '../data/landingContent'
import { useTracking } from '../hooks/useTracking'
import {
  buildFreeTrialLineConfirmPath,
  buildVenuePassLineConfirmPath,
  buildLiffStateUrl,
  buildLiffUrl,
  getBuildTimeLineConfirmLiffId,
  getRuntimeLineConfirmLiffId,
} from '../lib/freeTrialLineConfirm'

type OrderStatus =
  | 'pending'
  | 'payment_processing'
  | 'free_reserved'
  | 'free_attended'
  | 'venue_pass_lead'
  | 'paid'
  | 'expired'
  | 'failed'
  | 'cancelled'
  | 'paid_over_capacity'
  | 'payment_amount_mismatch'
  | 'refund_processing'
  | 'refunded'
  | string

type OrderStatusResponse = {
  order?: {
    referenceId: string
    status: OrderStatus
    courseName: string
    category: string
    venueName: string
    packageSize: number
    amountValue: number
    currency: string
    seriesDates: string[]
    createdAt: string
    paidAt?: string
  }
  provider?: {
    ok: boolean
    diagnosis?: string
    sessionStatus?: string | null
    paymentStatus?: string | null
    paymentMethod?: string | null
    tradeOrderId?: string | null
    checkedAt?: string
  } | null
  error?: string
}

const statusCopy: Record<
  string,
  {
    eyebrow: string
    title: string
    description: string
    tone: string
  }
> = {
  paid: {
    eyebrow: 'PAYMENT COMPLETE',
    title: '付款完成，名額已保留。',
    description: '我們已收到 SHOPLINE 付款通知，課程名額會依你購買的日期保留。',
    tone: 'border-neon/35 bg-neon/10 text-neon',
  },
  free_reserved: {
    eyebrow: 'RESERVATION COMPLETE',
    title: '預約完成，請到 LINE 確認報名。',
    description: '我們已收到你的免費體驗預約資料，課程名額已依你選擇的日期保留。',
    tone: 'border-neon/35 bg-neon/10 text-neon',
  },
  free_attended: {
    eyebrow: 'TRIAL COMPLETE',
    title: '免費體驗已完成。',
    description: '這筆免費體驗紀錄已完成報到。若還需要確認後續課程，請到 LINE 與專員聯繫。',
    tone: 'border-neon/35 bg-neon/10 text-neon',
  },
  venue_pass_lead: {
    eyebrow: 'VENUE PASS REQUEST',
    title: '場館七日通行登記完成。',
    description:
      '我們已收到你的場館七日通行登記資料，現場同仁會協助確認可使用時段與入館方式。',
    tone: 'border-neon/35 bg-neon/10 text-neon',
  },
  pending: {
    eyebrow: 'PAYMENT CHECKING',
    title: '正在確認付款結果。',
    description: '如果你剛完成付款，SHOPLINE 通知可能需要一點時間回來。',
    tone: 'border-pearl/15 bg-pearl/5 text-mist',
  },
  provider_not_paid: {
    eyebrow: 'PAYMENT NOT COMPLETE',
    title: '這筆付款尚未完成。',
    description:
      'SHOPLINE 查詢結果顯示目前還沒有成功付款交易。若銀行沒有扣款通知，請回到課程頁重新建立付款。',
    tone: 'border-blaze/35 bg-blaze/10 text-blaze',
  },
  provider_paid_webhook_missing: {
    eyebrow: 'PAYMENT SYNC CHECK',
    title: 'SHOPLINE 已確認付款，系統同步中。',
    description:
      'SHOPLINE 查詢結果已有付款成功資料，但網站尚未收到成功通知。請加入 LINE，工作人員會用訂單編號協助確認名額。',
    tone: 'border-blaze/35 bg-blaze/10 text-blaze',
  },
  provider_payment_failed: {
    eyebrow: 'PAYMENT FAILED',
    title: '付款沒有完成。',
    description:
      'SHOPLINE 查詢結果顯示付款失敗，名額尚未保留。請回到課程頁重新建立付款。',
    tone: 'border-blaze/35 bg-blaze/10 text-blaze',
  },
  provider_payment_cancelled: {
    eyebrow: 'PAYMENT CANCELLED',
    title: '付款已取消。',
    description:
      'SHOPLINE 查詢結果顯示付款已取消，名額尚未保留。請回到課程頁重新選擇場次。',
    tone: 'border-blaze/35 bg-blaze/10 text-blaze',
  },
  provider_session_expired: {
    eyebrow: 'PAYMENT EXPIRED',
    title: '這筆付款已逾時。',
    description:
      'SHOPLINE 查詢結果顯示付款連結已逾時，名額尚未保留。請回到課程頁重新選擇場次。',
    tone: 'border-blaze/35 bg-blaze/10 text-blaze',
  },
  provider_query_failed: {
    eyebrow: 'PAYMENT CHECKING',
    title: '正在確認付款結果。',
    description:
      '目前無法即時查詢 SHOPLINE 付款狀態。若你已看到銀行扣款通知，請加入 LINE 讓工作人員協助確認。',
    tone: 'border-pearl/15 bg-pearl/5 text-mist',
  },
  expired: {
    eyebrow: 'PAYMENT EXPIRED',
    title: '這筆付款已逾時。',
    description: '名額尚未保留，請回到頁面重新選擇場次。',
    tone: 'border-blaze/35 bg-blaze/10 text-blaze',
  },
  failed: {
    eyebrow: 'PAYMENT FAILED',
    title: '付款沒有完成。',
    description: '名額尚未保留，請回到頁面重新建立付款。',
    tone: 'border-blaze/35 bg-blaze/10 text-blaze',
  },
  cancelled: {
    eyebrow: 'PAYMENT CANCELLED',
    title: '付款已取消。',
    description: '名額尚未保留，請回到頁面重新選擇場次。',
    tone: 'border-blaze/35 bg-blaze/10 text-blaze',
  },
  paid_over_capacity: {
    eyebrow: 'PAYMENT NEEDS CHECK',
    title: '付款完成，名額需要人工確認。',
    description: 'SHOPLINE 已回報付款成功，但該場次名額同步時發生衝突，請加入 LINE 讓工作人員協助確認。',
    tone: 'border-blaze/35 bg-blaze/10 text-blaze',
  },
  payment_amount_mismatch: {
    eyebrow: 'PAYMENT NEEDS CHECK',
    title: '付款金額需要人工確認。',
    description: 'SHOPLINE 回傳的付款金額和課程金額不一致，請加入 LINE 讓工作人員協助確認。',
    tone: 'border-blaze/35 bg-blaze/10 text-blaze',
  },
  refund_processing: {
    eyebrow: 'REFUND PROCESSING',
    title: '退款同步中。',
    description: 'SHOPLINE 已送出退款通知，系統正在同步訂單與名額狀態。',
    tone: 'border-pearl/15 bg-pearl/5 text-mist',
  },
  refunded: {
    eyebrow: 'REFUNDED',
    title: '退款已完成。',
    description: '這筆訂單已完成退款，原本保留的名額已釋出。',
    tone: 'border-pearl/15 bg-pearl/5 text-mist',
  },
}

function formatDate(iso: string) {
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  return `${Number(parts[1])}/${Number(parts[2])}`
}

function getDisplayStatus(data: OrderStatusResponse | null, mode: string | null) {
  const localStatus =
    data?.order?.status ||
    (mode === 'free-trial'
      ? 'free_reserved'
      : mode === 'venue-pass'
        ? 'venue_pass_lead'
        : 'pending')
  const diagnosis = data?.provider?.diagnosis
  const canUseProviderDiagnosis = [
    'pending',
    'payment_processing',
    'session_failed',
  ].includes(localStatus)

  if (canUseProviderDiagnosis && diagnosis && statusCopy[diagnosis]) {
    return diagnosis
  }

  return localStatus
}

function createVenuePassFallbackData(referenceId: string): OrderStatusResponse {
  return {
    order: {
      referenceId,
      status: 'venue_pass_lead',
      courseName: '場館七日通行',
      category: 'VENUE_PASS',
      venueName: 'UFC GYM',
      packageSize: 1,
      amountValue: 0,
      currency: 'TWD',
      seriesDates: [],
      createdAt: '',
    },
  }
}

function providerStatusLabel(provider: OrderStatusResponse['provider']) {
  if (!provider) return null
  if (provider.diagnosis === 'provider_paid_webhook_missing') {
    return provider.paymentMethod
      ? `SHOPLINE 已付款 · ${provider.paymentMethod}`
      : 'SHOPLINE 已付款'
  }
  if (provider.diagnosis === 'provider_not_paid') return '尚未完成付款'
  if (provider.diagnosis === 'provider_payment_failed') return '付款失敗'
  if (provider.diagnosis === 'provider_payment_cancelled') return '付款取消'
  if (provider.diagnosis === 'provider_session_expired') return '付款逾時'
  if (provider.sessionStatus) return `SHOPLINE ${provider.sessionStatus}`
  return null
}

function getLineHandoffCopy(
  status: string,
  isFreeTrialResult: boolean,
  isVenuePassResult: boolean,
) {
  const supportStatuses = new Set([
    'cancelled',
    'expired',
    'failed',
    'provider_not_paid',
    'provider_payment_cancelled',
    'provider_payment_failed',
    'provider_session_expired',
    'refund_processing',
    'refunded',
  ])

  if (isFreeTrialResult) {
    return {
      title: 'LINE 快速自助確認',
      body: '帥氣可愛的專員將聯繫你，幫您安排入館時間。不想等電話聯繫？LINE 快速自助確認，直接確認預約時間！',
      buttonLabel: 'LINE 快速自助確認',
      intent: 'free_trial_booking_confirmation',
    }
  }

  if (isVenuePassResult) {
    return {
      title: 'LINE 快速自助確認',
      body: '帥氣可愛的專員將聯繫你，幫您安排入館時間。不想等電話聯繫？LINE 快速自助確認，直接領取七日通行確認卡！',
      buttonLabel: 'LINE 快速自助確認',
      intent: 'venue_pass_line_confirmation',
    }
  }

  if (supportStatuses.has(status)) {
    return {
      title: '加入 LINE 協助處理',
      body: '如果付款狀態和你看到的扣款結果不同，請加入官方 LINE，將訂單編號傳給同仁協助查詢。',
      buttonLabel: '加入 LINE 協助處理',
      intent: 'payment_support',
    }
  }

  return {
    title: '加入 LINE 確認報名',
    body: '付款後請加入官方 LINE，將訂單編號傳給同仁確認報名與入場資訊。',
    buttonLabel: '到 LINE 確認報名',
    intent: 'booking_confirmation',
  }
}

export function PaymentResultPage() {
  const { track } = useTracking()
  const [data, setData] = useState<OrderStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lineConfirmLiffId, setLineConfirmLiffId] = useState(
    getBuildTimeLineConfirmLiffId,
  )
  const params = new URLSearchParams(window.location.search)
  const referenceId = params.get('referenceId') || ''
  const resultMode = params.get('mode')
  const isFreeTrialResult =
    resultMode === 'free-trial' ||
    data?.order?.status === 'free_reserved' ||
    data?.order?.status === 'free_attended'
  const isVenuePassResult =
    resultMode === 'venue-pass' || data?.order?.status === 'venue_pass_lead'
  const displayStatus = useMemo(
    () => getDisplayStatus(data, resultMode),
    [data, resultMode],
  )
  const copy = useMemo(
    () => statusCopy[displayStatus] ?? statusCopy.pending,
    [displayStatus],
  )
  const lineHandoffCopy = useMemo(
    () => getLineHandoffCopy(displayStatus, isFreeTrialResult, isVenuePassResult),
    [displayStatus, isFreeTrialResult, isVenuePassResult],
  )
  const freeTrialLineConfirmPath = referenceId
    ? buildFreeTrialLineConfirmPath(referenceId)
    : '/line/free-trial-confirm'
  const venuePassLineConfirmPath = referenceId
    ? buildVenuePassLineConfirmPath(referenceId)
    : '/line/venue-pass-confirm'
  const lineCtaHref =
    isFreeTrialResult && referenceId
      ? lineConfirmLiffId
        ? buildLiffUrl(lineConfirmLiffId, freeTrialLineConfirmPath)
        : freeTrialLineConfirmPath
      : isVenuePassResult && referenceId
        ? lineConfirmLiffId
          ? buildLiffStateUrl(lineConfirmLiffId, venuePassLineConfirmPath)
          : venuePassLineConfirmPath
      : siteConfig.lineUrl

  useEffect(() => {
    if (!isFreeTrialResult && !isVenuePassResult) return undefined

    let active = true

    fetch('/api/config', {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((config) => {
        if (!active) return
        const runtimeLiffId = getRuntimeLineConfirmLiffId(config)
        if (runtimeLiffId) setLineConfirmLiffId(runtimeLiffId)
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [isFreeTrialResult, isVenuePassResult])

  useEffect(() => {
    if (!referenceId) {
      setIsLoading(false)
      setData({ error: 'Missing referenceId' })
      return undefined
    }

    let cancelled = false

    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `/api/shopline/order-status?referenceId=${encodeURIComponent(referenceId)}`,
          { cache: 'no-store' },
        )
        if (!response.ok && resultMode === 'venue-pass') {
          if (!cancelled) setData(createVenuePassFallbackData(referenceId))
          return
        }
        const nextData = (await response.json()) as OrderStatusResponse
        if (!cancelled) setData(nextData)
      } catch {
        if (!cancelled) {
          setData(
            resultMode === 'venue-pass'
              ? createVenuePassFallbackData(referenceId)
              : { error: '付款狀態讀取失敗' },
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void fetchStatus()
    const intervalId = window.setInterval(fetchStatus, 3500)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [referenceId, resultMode])

  const order = data?.order
  const providerLabel = providerStatusLabel(data?.provider)
  const referenceLabel =
    isVenuePassResult ? '登記編號' : isFreeTrialResult ? '預約編號' : '訂單編號'
  const amountLabel =
    isFreeTrialResult || order?.amountValue === 0
      ? '免費'
      : `NT${(order?.amountValue ?? 0).toLocaleString('en-US')}`
  const lineCtaId = isFreeTrialResult
    ? 'free-trial-line-confirm'
    : isVenuePassResult
      ? 'venue-pass-line-confirm'
      : 'payment-result-line'
  const messengerCtaId = isFreeTrialResult
    ? 'free-trial-result-messenger'
    : isVenuePassResult
      ? 'venue-pass-result-messenger'
      : 'payment-result-messenger'
  const referenceType = isVenuePassResult
    ? 'venue_pass_lead'
    : isFreeTrialResult
      ? 'reservation'
      : 'order'
  const loadingTitle = isFreeTrialResult
    ? '讀取預約結果中。'
    : isVenuePassResult
      ? '讀取登記結果中。'
      : '讀取付款結果中。'

  return (
    <div className="min-h-screen overflow-x-hidden bg-abyss text-pearl">
      <Header />
      <main className="mx-auto flex min-h-[72vh] max-w-3xl flex-col justify-center px-3 pb-14 pt-28 sm:px-8 md:pt-36">
        <section className="rounded-3xl border border-pearl/10 bg-black/35 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] md:p-8">
          <p
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-heading font-bold uppercase tracking-[0.22em] ${copy.tone}`}
          >
            {copy.eyebrow}
          </p>
          <h1 className="mt-5 font-heading text-3xl font-black leading-tight text-pearl md:text-5xl">
            {isLoading ? loadingTitle : copy.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-mist/76 md:text-lg">
            {isLoading ? '請稍候。' : data?.error || copy.description}
          </p>

          {order && (
            <div className="mt-6 grid gap-3 border-t border-pearl/10 pt-5 text-sm text-mist/72">
              <div className="flex justify-between gap-4">
                <span className="font-heading text-mist/45">{referenceLabel}</span>
                <span className="text-right font-heading text-pearl">
                  {order.referenceId}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-heading text-mist/45">
                  {isVenuePassResult ? '方案' : '課程'}
                </span>
                <span className="text-right text-pearl">
                  {order.courseName}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-heading text-mist/45">場館</span>
                <span className="text-right text-pearl">
                  {order.venueName}
                </span>
              </div>
              {!isVenuePassResult && (
                <div className="flex justify-between gap-4">
                  <span className="font-heading text-mist/45">日期</span>
                  <span className="text-right font-heading text-pearl">
                    {order.seriesDates.map(formatDate).join(' / ')}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="font-heading text-mist/45">金額</span>
                <span className="text-right font-heading text-neon">
                  {amountLabel}
                </span>
              </div>
              {providerLabel && (
                <div className="flex justify-between gap-4">
                  <span className="font-heading text-mist/45">付款狀態</span>
                  <span className="text-right text-pearl">{providerLabel}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-neon/20 bg-neon/[0.06] p-4">
            <p className="font-heading text-base font-bold text-pearl">
              {lineHandoffCopy.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-mist/72">
              {lineHandoffCopy.body}
            </p>
            {referenceId && (
              <p className="mt-3 rounded-xl border border-pearl/10 bg-black/24 px-3 py-2 font-mono text-xs text-mist/72">
                {referenceLabel}：{referenceId}
              </p>
            )}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              href={lineCtaHref}
              target={isFreeTrialResult || isVenuePassResult ? '_self' : undefined}
              variant="primary"
              size="lg"
              className="w-full"
              data-cta={lineCtaId}
              onClick={() =>
                track({
                  event: isFreeTrialResult
                    ? 'free_trial_line_confirm_click'
                    : isVenuePassResult
                      ? 'venue_pass_line_confirm_click'
                      : 'payment_result_line_click',
                  params: {
                    cta_id: lineCtaId,
                    reference_id: referenceId,
                    reference_type: referenceType,
                    order_status: order?.status ?? '',
                    display_status: displayStatus,
                    line_handoff_intent: lineHandoffCopy.intent,
                  },
                  metaStandardEvent: isFreeTrialResult ? 'Contact' : 'Lead',
                  lineEventName: isFreeTrialResult
                    ? 'FreeTrialLineConfirm'
                    : isVenuePassResult
                      ? 'VenuePassLineConfirm'
                      : 'LeadClick',
                })
              }
            >
              {lineHandoffCopy.buttonLabel}
            </Button>
            <Button
              href={siteConfig.messengerUrl}
              variant="secondary"
              size="lg"
              className="w-full"
              data-cta={messengerCtaId}
              onClick={() =>
                track({
                  event: isFreeTrialResult
                    ? 'free_trial_result_messenger_click'
                    : isVenuePassResult
                      ? 'venue_pass_result_messenger_click'
                      : 'payment_result_messenger_click',
                  params: {
                    cta_id: messengerCtaId,
                    reference_id: referenceId,
                    reference_type: referenceType,
                    order_status: order?.status ?? '',
                    display_status: displayStatus,
                    handoff_intent: lineHandoffCopy.intent,
                    channel: 'messenger',
                  },
                  metaStandardEvent: isFreeTrialResult ? 'Contact' : 'Lead',
                })
              }
            >
              Messenger 私訊專員
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
