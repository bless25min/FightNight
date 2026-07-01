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
  assert.match(source, /場館七日通行優惠已保留/)
  assert.match(source, /請點擊下方按鈕確認領取/)
  assert.match(source, /確認領取/)
  assert.doesNotMatch(source, /七日通行確認卡已建立/)
  assert.match(source, /createLineMessageId\('lms_venue'\)/)
})
