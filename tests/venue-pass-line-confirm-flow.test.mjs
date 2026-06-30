import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('venue pass LINE confirmation has its own route and API endpoint', async () => {
  const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const pageSource = await readFile(
    new URL('../src/pages/LineVenuePassConfirmPage.tsx', import.meta.url),
    'utf8',
  )
  const endpointSource = await readFile(
    new URL('../functions/api/venue-pass-lead/line-confirm.js', import.meta.url),
    'utf8',
  )

  assert.match(appSource, /LineVenuePassConfirmPage/)
  assert.match(appSource, /\/line\/venue-pass-confirm/)
  assert.match(pageSource, /\/api\/venue-pass-lead\/line-confirm/)
  assert.match(pageSource, /venue_pass_line_confirm_success/)
  assert.match(pageSource, /場館七日通行/)
  assert.match(endpointSource, /confirmVenuePassLineReservation/)
  assert.match(endpointSource, /notifyLineVenuePassLead/)
})
