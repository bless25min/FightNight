type Props = {
  eyebrow?: string
  title: string
  detail?: string
  actionLabel: string
  onAction: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

export function StickyActionBar({
  eyebrow,
  title,
  detail,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: Props) {
  const hasSecondaryAction = secondaryActionLabel && onSecondaryAction

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-pearl/10 bg-abyss/95 px-3 py-3 shadow-[0_-18px_60px_rgba(0,0,0,0.45)] backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[10px] font-heading tracking-[0.2em] text-neon/75 uppercase">
              {eyebrow}
            </p>
          )}
          <p className="truncate text-sm font-heading font-semibold text-pearl">
            {title}
          </p>
          {detail && (
            <p className="truncate text-xs text-mist/65">
              {detail}
            </p>
          )}
        </div>
        {hasSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            data-interaction-hint
            className="interaction-hint shrink-0 rounded-xl border border-pearl/15 bg-pearl/5 px-3 py-3 text-xs font-heading font-bold text-pearl"
          >
            {secondaryActionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onAction}
          data-interaction-hint
          className="interaction-hint shrink-0 rounded-xl bg-gradient-to-r from-blaze to-neon px-4 py-3 text-sm font-heading font-bold text-white shadow-lg shadow-blaze/25"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
