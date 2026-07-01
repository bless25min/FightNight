import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

async function importStatusHelpers() {
  const source = await readFile(
    new URL('../src/lib/freeTrialLineConfirmStatus.ts', import.meta.url),
    'utf8',
  )
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  })

  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
  )
}

test('normalizes the LIFF confirm URL only after liff.init reads LINE query params', async () => {
  const source = await readFile(
    new URL('../src/pages/LineFreeTrialConfirmPage.tsx', import.meta.url),
    'utf8',
  )
  const initIndex = source.indexOf('await liff.init')
  const normalizeIndex = source.indexOf('normalizeConfirmLocation(referenceId)')

  assert.notEqual(initIndex, -1)
  assert.notEqual(normalizeIndex, -1)
  assert.ok(
    normalizeIndex > initIndex,
    'LINE liff.* query params must not be removed before liff.init completes',
  )
})

test('classifies in-progress LINE notify status as pending, not delivered', async () => {
  const { isLineNotifyDelivered, isLineNotifyPending } = await importStatusHelpers()

  assert.equal(isLineNotifyDelivered('sent'), true)
  assert.equal(isLineNotifyDelivered('skipped_already_sent'), true)
  assert.equal(isLineNotifyDelivered('skipped_in_progress_or_sent'), false)
  assert.equal(isLineNotifyPending('skipped_in_progress_or_sent'), true)
})

test('free trial LIFF endpoint routes venue pass references to venue pass confirmation', async () => {
  const source = await readFile(
    new URL('../src/pages/LineFreeTrialConfirmPage.tsx', import.meta.url),
    'utf8',
  )

  assert.match(source, /isVenuePassReferenceId/)
  assert.match(source, /\/api\/venue-pass-lead\/line-confirm/)
  assert.match(source, /Only free trial reservations can be confirmed through this flow/)
  assert.match(source, /登記編號/)
  assert.match(source, /venue_pass_line_confirm_success/)
})
