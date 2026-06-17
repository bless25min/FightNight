import { siteConfig } from '../../data/landingContent'
import { useTracking } from '../../hooks/useTracking'
import { Button } from '../ui/Button'

type Props = {
  className?: string
}

export function OtherCoursesConsultBlock({ className = '' }: Props) {
  const { track, trackLineCta } = useTracking()

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
        <div className="flex w-full shrink-0 flex-col gap-2 md:w-auto md:flex-row">
          <Button
            href={siteConfig.lineUrl}
            variant="secondary"
            className="w-full md:w-auto"
            data-cta="other-courses-consult"
            onClick={() =>
              trackLineCta({
                cta_id: 'other-courses-consult',
                placement: 'other_courses_consult',
                channel: 'line',
              })
            }
          >
            LINE 諮詢
          </Button>
          <Button
            href={siteConfig.messengerUrl}
            variant="secondary"
            className="w-full md:w-auto"
            data-cta="other-courses-messenger-consult"
            onClick={() =>
              track({
                event: 'messenger_consult_click',
                params: {
                  cta_id: 'other-courses-messenger-consult',
                  placement: 'other_courses_consult',
                  channel: 'messenger',
                },
                metaStandardEvent: 'Lead',
              })
            }
          >
            Messenger 私訊
          </Button>
        </div>
      </div>
    </div>
  )
}
