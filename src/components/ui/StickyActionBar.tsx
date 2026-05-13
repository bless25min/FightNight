type Props = {
  eyebrow?: string
  title: string
  detail?: string
  actionLabel: string
  onAction: () => void
}

export function StickyActionBar({
  eyebrow,
  title,
  detail,
  actionLabel,
  onAction,
}: Props) {
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
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-xl bg-gradient-to-r from-blaze to-neon px-4 py-3 text-sm font-heading font-bold text-white shadow-lg shadow-blaze/25"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
