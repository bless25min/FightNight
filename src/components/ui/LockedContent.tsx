import type { ReactNode } from 'react'
import type { LiffGateState } from '../../hooks/useLiffGate'
import { Button } from './Button'

type Props = {
  children: ReactNode
  gateState: LiffGateState
  title: string
  onGateAction?: () => void
  liffUrl?: string
  lockedEyebrow?: string
  className?: string
}

function getActionLabel(gateState: LiffGateState) {
  if (gateState.status === 'missing-config') return null
  if (gateState.status === 'not-friend') return '加入 LINE 好友解鎖'
  if (gateState.status === 'error') return '重新驗證'
  return 'LINE 快速登入'
}

export function LockedContent({
  children,
  gateState,
  title,
  onGateAction,
  liffUrl,
  lockedEyebrow = 'LINE 會員專屬內容',
  className = '',
}: Props) {
  if (gateState.status === 'unlocked') {
    return <>{children}</>
  }

  const actionLabel = getActionLabel(gateState)
  const shouldUseLiffLink =
    liffUrl && ['loading', 'logged-out'].includes(gateState.status)

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-pearl/10 bg-obsidian/80 px-5 py-7 text-center shadow-[0_30px_80px_rgba(0,0,0,0.35)] md:px-8 md:py-10 ${className}`}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(191,90,242,0.16),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(255,59,92,0.12),transparent_42%)]" />

      <div className="relative mx-auto max-w-2xl">
        <p className="text-xs md:text-sm font-heading tracking-[0.3em] text-neon/80 uppercase">
          {lockedEyebrow}
        </p>
        <h3 className="mt-3 text-2xl md:text-3xl font-heading font-bold text-pearl">
          {title}
        </h3>

        {actionLabel && (
          shouldUseLiffLink ? (
            <Button
              size="lg"
              className="mt-6"
              href={liffUrl}
              target="_self"
              data-cta="liff-gate-link"
            >
              {actionLabel}
            </Button>
          ) : (
            onGateAction && (
              <Button
                size="lg"
                className="mt-6"
                onClick={onGateAction}
                data-cta="liff-gate-action"
              >
                {actionLabel}
              </Button>
            )
          )
        )}
      </div>
    </div>
  )
}
