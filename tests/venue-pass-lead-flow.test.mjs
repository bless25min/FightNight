import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('venue pass lead uses a dedicated flow instead of free-trial reservation', async () => {
  const pageSource = await readFile(
    new URL('../src/pages/SingleSessionEventPage.tsx', import.meta.url),
    'utf8',
  )
  const endpointSource = await readFile(
    new URL('../functions/api/venue-pass-lead.js', import.meta.url),
    'utf8',
  )
  const resultSource = await readFile(
    new URL('../src/pages/PaymentResultPage.tsx', import.meta.url),
    'utf8',
  )
  const paymentResultSource = await readFile(
    new URL('../src/lib/paymentResult.ts', import.meta.url),
    'utf8',
  )

  assert.equal(pageSource.includes('/api/venue-pass-lead'), true)
  assert.equal(pageSource.includes("? 'venue-pass' : 'free-trial'"), true)
  assert.equal(pageSource.includes('copy.venuePassLeadVenueLine'), true)

  assert.equal(endpointSource.includes("VENUE_PASS_LEAD_STATUS = 'venue_pass_lead'"), true)
  assert.equal(endpointSource.includes('createVenuePassLeadReferenceId'), true)
  assert.equal(endpointSource.includes('sendMetaFunnelEvent'), true)
  assert.doesNotMatch(endpointSource, /incrementReservedSeats/)
  assert.doesNotMatch(endpointSource, /FREE_TRIAL_SESSION_LIMIT/)
  assert.doesNotMatch(endpointSource, /getExistingFreeTrial/)

  assert.equal(paymentResultSource.includes("'venue-pass'"), true)
  assert.equal(resultSource.includes('venue_pass_lead'), true)
  assert.equal(resultSource.includes('場館七日通行登記完成'), true)
  assert.equal(resultSource.includes('isVenuePassResult'), true)
  assert.equal(resultSource.includes('buildVenuePassLineConfirmPath'), true)
  assert.equal(resultSource.includes('buildLiffStateUrl'), true)
  assert.equal(resultSource.includes('createVenuePassFallbackData'), true)
  assert.equal(resultSource.includes('venue-pass-line-confirm'), true)
  assert.doesNotMatch(resultSource, /將登記編號傳給同仁/)
  assert.match(resultSource, /LINE 快速自助確認/)
})
