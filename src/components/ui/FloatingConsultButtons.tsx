import { siteConfig } from '../../data/landingContent'
import { useTracking } from '../../hooks/useTracking'

type FloatingConsultButtonsProps = {
  placement?: string
}

export function FloatingConsultButtons({
  placement = 'floating_consult',
}: FloatingConsultButtonsProps) {
  const { track, trackLineCta } = useTracking()
  const baseClass =
    'flex h-14 w-14 items-center justify-center rounded-full border border-pearl/15 bg-abyss/82 shadow-[0_18px_42px_rgba(0,0,0,0.38)] backdrop-blur transition hover:-translate-y-0.5 hover:border-neon/45 hover:bg-abyss focus:outline-none focus-visible:ring-2 focus-visible:ring-neon/70'
  const iconClass = 'h-10 w-10 rounded-full object-cover'

  return (
    <div
      data-section="floating-consult"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-3 z-[85] flex flex-col gap-2 sm:bottom-5 sm:right-5"
    >
      <a
        href={siteConfig.lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClass}
        data-cta="floating-line-consult"
        data-interaction-hint
        aria-label="LINE 諮詢"
        onClick={() =>
          trackLineCta({
            cta_id: 'floating-line-consult',
            placement,
            surface: 'floating_consult',
            channel: 'line',
          })
        }
      >
        <img src="/icons/line-icon.jpg" alt="" className={iconClass} />
      </a>
      <a
        href={siteConfig.messengerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClass}
        data-cta="floating-messenger-consult"
        data-interaction-hint
        aria-label="Messenger 私訊"
        onClick={() =>
          track({
            event: 'messenger_consult_click',
            params: {
              cta_id: 'floating-messenger-consult',
              placement,
              surface: 'floating_consult',
              channel: 'messenger',
            },
            metaStandardEvent: 'Lead',
          })
        }
      >
        <img src="/icons/messenger-icon.png" alt="" className={iconClass} />
      </a>
    </div>
  )
}
