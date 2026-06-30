import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('venue pass LINE card uses a dedicated confirmation template', async () => {
  const source = await readFile(
    new URL('../functions/api/shopline/line-notify.js', import.meta.url),
    'utf8',
  )

  assert.match(source, /notifyLineVenuePassLead/)
  assert.match(source, /buildVenuePassConfirmationCard/)
  assert.match(source, /venue_pass_confirmation/)
  assert.match(source, /venue_pass_lead/)
  assert.match(source, /場館七日通行登記完成/)
  assert.match(source, /createLineMessageId\('lms_venue'\)/)
})
