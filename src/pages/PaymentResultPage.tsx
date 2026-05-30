import { useEffect, useMemo, useState } from 'react'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { siteConfig } from '../data/landingContent'
import { useTracking } from '../hooks/useTracking'

type OrderStatus =
  | 'pending'
  | 'payment_processing'
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

function getDisplayStatus(data: OrderStatusResponse | null) {
  const localStatus = data?.order?.status || 'pending'
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

export function PaymentResultPage() {
  const { trackLineCta } = useTracking()
  const [data, setData] = useState<OrderStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const params = new URLSearchParams(window.location.search)
  const referenceId = params.get('referenceId') || ''
  const copy = useMemo(() => {
    const status = getDisplayStatus(data)
    return statusCopy[status] ?? statusCopy.pending
  }, [data])

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
        const nextData = (await response.json()) as OrderStatusResponse
        if (!cancelled) setData(nextData)
      } catch {
        if (!cancelled) setData({ error: '付款狀態讀取失敗' })
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
  }, [referenceId])

  const order = data?.order
  const providerLabel = providerStatusLabel(data?.provider)

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
            {isLoading ? '讀取付款結果中。' : copy.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-mist/76 md:text-lg">
            {isLoading ? '請稍候。' : data?.error || copy.description}
          </p>

          {order && (
            <div className="mt-6 grid gap-3 border-t border-pearl/10 pt-5 text-sm text-mist/72">
              <div className="flex justify-between gap-4">
                <span className="font-heading text-mist/45">訂單編號</span>
                <span className="text-right font-heading text-pearl">
                  {order.referenceId}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-heading text-mist/45">課程</span>
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
              <div className="flex justify-between gap-4">
                <span className="font-heading text-mist/45">日期</span>
                <span className="text-right font-heading text-pearl">
                  {order.seriesDates.map(formatDate).join(' / ')}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-heading text-mist/45">金額</span>
                <span className="text-right font-heading text-neon">
                  NT${order.amountValue.toLocaleString('en-US')}
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

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href={siteConfig.offersUrl} variant="primary">
              回到課程頁
            </Button>
            <Button
              href={siteConfig.lineUrl}
              variant="secondary"
              onClick={() =>
                trackLineCta({
                  cta_id: 'payment-result-line',
                  reference_id: referenceId,
                  order_status: order?.status ?? '',
                })
              }
            >
              加入 LINE 確認
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
