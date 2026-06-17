import { useCallback } from 'react'
import {
  trackAnalyticsEvent,
  type MetaStandardEvent,
  type TrackingParams,
} from '../lib/analytics'

type TrackingEvent = {
  event: string
  params?: TrackingParams
  metaStandardEvent?: MetaStandardEvent
  metaEventId?: string
  lineEventName?: string
}

export type CoursePurchaseTrackingParams = TrackingParams & {
  course_id: string
  course_name: string
  category: string
  venue_id: string
  venue_name: string
  date: string
  start_time: string
  coach: string
  package_size: number
  value: number
  currency: 'TWD'
  remaining: number
}

export function useTracking() {
  const track = useCallback(
    ({
      event,
      params,
      metaStandardEvent,
      metaEventId,
      lineEventName,
    }: TrackingEvent) => {
      if (import.meta.env.DEV) {
        console.log('[Track]', event, params)
      }

      trackAnalyticsEvent(event, params, {
        metaStandardEvent,
        metaEventId,
        lineEventName,
      })
    },
    [],
  )

  const trackHeroCta = useCallback(
    () =>
      track({
        event: 'hero_cta_click',
      }),
    [track],
  )

  const trackSecondaryCta = useCallback(
    () => track({ event: 'secondary_cta_click' }),
    [track],
  )

  const trackTicketView = useCallback(
    () =>
      track({
        event: 'ticket_view',
        metaStandardEvent: 'ViewContent',
        lineEventName: 'TicketView',
      }),
    [track],
  )

  const trackTicketCta = useCallback(
    (ticketId: string) =>
      track({
        event: 'ticket_cta_click',
        params: { ticket_id: ticketId },
      }),
    [track],
  )

  const trackFaqExpand = useCallback(
    (faqId: string) =>
      track({ event: 'faq_expand', params: { faq_id: faqId } }),
    [track],
  )

  const trackLineCta = useCallback(
    (params?: TrackingParams) =>
      track({
        event: 'line_cta_click',
        params,
        metaStandardEvent: 'Lead',
        lineEventName: 'LeadClick',
      }),
    [track],
  )

  const trackGateAccess = useCallback(
    (surface: string, status: string) =>
      track({
        event: 'gate_access_click',
        params: { surface, status },
        metaStandardEvent: 'Contact',
        lineEventName: 'LineLoginClick',
      }),
    [track],
  )

  const trackCoursePurchaseClick = useCallback(
    (params: CoursePurchaseTrackingParams) =>
      track({
        event: 'course_purchase_click',
        params,
        metaStandardEvent: 'AddToCart',
        lineEventName: 'AddToCart',
      }),
    [track],
  )

  return {
    track,
    trackHeroCta,
    trackSecondaryCta,
    trackTicketView,
    trackTicketCta,
    trackFaqExpand,
    trackLineCta,
    trackGateAccess,
    trackCoursePurchaseClick,
  }
}
