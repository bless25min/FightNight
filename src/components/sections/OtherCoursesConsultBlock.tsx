import { Button } from '../ui/Button'

const consultUrl = 'https://s.no8.io/link/channels/zGX7ApSAv6'

type Props = {
  className?: string
}

export function OtherCoursesConsultBlock({ className = '' }: Props) {
  return (
    <div
      data-section="other-courses-consult"
      className={`mx-auto max-w-4xl rounded-lg border border-pearl/10 bg-pearl/[0.04] p-4 md:p-5 ${className}`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-base font-heading font-bold text-pearl md:text-lg">
            想瞭解其他課程、服務、時間嗎?
          </p>
          <p className="mt-2 text-sm leading-relaxed text-mist/78 md:text-base">
            UFC GYM 每月提供將近{' '}
            <span className="font-heading font-bold text-neon">400 堂</span>{' '}
            的專項特色與團體課程。
          </p>
          <p className="mt-1 text-sm leading-relaxed text-mist/70">
            讓我們帥氣／甜美的同仁為您推薦。
          </p>
        </div>

        <Button
          href={consultUrl}
          variant="secondary"
          className="w-full shrink-0 md:w-auto"
          data-cta="other-courses-consult"
        >
          立即諮詢
        </Button>
      </div>
    </div>
  )
}
