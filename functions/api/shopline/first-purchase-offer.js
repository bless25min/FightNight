import {
  ensureTables,
  getFirstPurchaseOfferEligibility,
  resolveLineContext,
  upsertLineCustomerFromCheckout,
} from './checkout-session.js'
import {
  FIRST_PURCHASE_OFFER_CODE,
  FIRST_PURCHASE_OFFER_LABEL,
  FIRST_PURCHASE_OFFER_END_AT_TW,
} from '../../../src/lib/coursePricing.ts'

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...init.headers,
    },
  })
}

const offerProbeCourse = {
  id: 'first-purchase-offer-probe',
  category: 'FIGHT_NIGHT',
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)

  try {
    await ensureTables(env)
    const lineContext = await resolveLineContext(body?.lineContext, env)

    if (!lineContext?.lineUserId) {
      return json({
        eligible: false,
        reason: 'line_login_required',
        code: FIRST_PURCHASE_OFFER_CODE,
        label: FIRST_PURCHASE_OFFER_LABEL,
        endsAt: FIRST_PURCHASE_OFFER_END_AT_TW,
      })
    }

    await upsertLineCustomerFromCheckout(env, lineContext)

    const eligibility = await getFirstPurchaseOfferEligibility(
      env,
      lineContext,
      offerProbeCourse,
      1,
    )

    return json({
      ...eligibility,
      code: FIRST_PURCHASE_OFFER_CODE,
      label: FIRST_PURCHASE_OFFER_LABEL,
      endsAt: FIRST_PURCHASE_OFFER_END_AT_TW,
    })
  } catch (error) {
    return json(
      {
        eligible: false,
        reason: 'offer_check_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
