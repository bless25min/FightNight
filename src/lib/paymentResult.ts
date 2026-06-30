export type PaymentResultMode = 'payment' | 'free-trial' | 'venue-pass'

export function buildPaymentResultUrl(
  referenceId: string,
  mode: PaymentResultMode = 'payment',
) {
  const params = new URLSearchParams({
    referenceId,
  })

  if (mode !== 'payment') {
    params.set('mode', mode)
  }

  return `/payment/success?${params.toString()}`
}
