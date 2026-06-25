import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('free trial reservation API does not reject training-plan course cards', async () => {
  const source = await readFile(
    new URL('../functions/api/free-trial-reservation.js', import.meta.url),
    'utf8',
  )

  assert.equal(
    source.includes("course.category !== 'SINGLE_SESSION'"),
    false,
    'all-free homepage mode sends TRAINING_PLAN cards through this API',
  )
  assert.equal(
    source.includes('免費體驗僅開放 UFC GYM 單堂體驗課程'),
    false,
    'the old single-session-only error blocks the current free booking funnel',
  )
})

test('catalog resolver treats the explicit weekly course category as bookable', async () => {
  const source = await readFile(
    new URL('../functions/api/shopline/checkout-session.js', import.meta.url),
    'utf8',
  )

  assert.equal(
    source.includes('courseCategory !== normalizeCourseCategory(baseCourse.category)'),
    true,
    'catalog category should be the source of truth before keyword heuristics',
  )
})
