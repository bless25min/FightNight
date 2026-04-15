// 事件追蹤 hook — 預留 GA4 / Meta Pixel / LINE Tag 接口

type TrackingEvent = {
  event: string
  params?: Record<string, string | number | boolean>
}

export function useTracking() {
  const track = ({ event, params }: TrackingEvent) => {
    // 開發模式列印
    if (import.meta.env.DEV) {
      console.log('[Track]', event, params)
    }

    // GA4
    if (typeof window !== 'undefined' && 'gtag' in window) {
      ;(window as any).gtag('event', event, params)
    }

    // Meta Pixel
    if (typeof window !== 'undefined' && 'fbq' in window) {
      ;(window as any).fbq('trackCustom', event, params)
    }
  }

  const trackHeroCta = () => track({ event: 'hero_cta_click' })
  const trackSecondaryCta = () => track({ event: 'secondary_cta_click' })
  const trackTicketView = () => track({ event: 'ticket_view' })
  const trackTicketCta = (ticketId: string) =>
    track({ event: 'ticket_cta_click', params: { ticket_id: ticketId } })
  const trackFaqExpand = (faqId: string) =>
    track({ event: 'faq_expand', params: { faq_id: faqId } })
  const trackLineCta = () => track({ event: 'line_cta_click' })

  return {
    track,
    trackHeroCta,
    trackSecondaryCta,
    trackTicketView,
    trackTicketCta,
    trackFaqExpand,
    trackLineCta,
  }
}
