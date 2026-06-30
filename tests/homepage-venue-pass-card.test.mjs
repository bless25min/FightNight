import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('homepage adds a venue seven-day pass card without showing the paid-pass safety block', async () => {
  const source = await readFile(
    new URL('../src/pages/SingleSessionEventPage.tsx', import.meta.url),
    'utf8',
  )

  assert.match(source, /venueSevenDayPassCards = \[/)
  assert.match(source, /venue-pass-strength-floor\.jpg/)
  assert.match(source, /venue-pass-recovery\.jpg/)
  assert.match(source, /venue-pass-dumbbells\.jpg/)
  assert.match(source, /venue-pass-gym-floor\.jpg/)
  assert.match(source, /venue-pass-cardio\.jpg/)
  assert.match(source, /venue-pass-octagon\.jpg/)
  assert.match(source, /venue-pass-bag-zone\.jpg/)
  assert.match(source, /venue-pass-runway\.jpg/)
  assert.match(source, /venue-pass-machine-zone\.jpg/)
  assert.match(source, /venuePassCount: '9 張照片'/)
  assert.match(source, /venuePassCount: '9 photos'/)
  assert.match(source, /function VenueSevenDayPassCard/)
  assert.match(source, /場館七日通行/)
  assert.match(source, /登記領取場館七日通行/)
  assert.match(source, /頂級訓練器材/)
  assert.match(source, /淋浴更衣設備/)
  assert.match(source, /感應式私人置物櫃/)
  assert.match(source, /飯店級盥洗用品/)
  assert.doesNotMatch(source, /先不用決定拳擊或泰拳/)
  assert.doesNotMatch(source, /venuePassBody/)
  assert.match(source, /送出登記，領取七日通行/)
  assert.match(source, /venue_seven_day_pass_lead/)
  assert.match(source, /data-cta="event-venue-seven-day-pass"/)

  assert.doesNotMatch(
    source,
    /<EventProofSection locale=\{locale\} \/>\s*<EventSafetySection locale=\{locale\} \/>/,
  )
  assert.match(source, /!isFreeTrialBookingMode \? \(\s*<EventSafetySection locale=\{locale\} \/>/)
})
