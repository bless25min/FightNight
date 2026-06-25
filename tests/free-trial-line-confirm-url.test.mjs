import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

async function importFreeTrialLineConfirm() {
  let source = await readFile(
    new URL('../src/lib/freeTrialLineConfirm.ts', import.meta.url),
    'utf8',
  )
  source = source
    .replace(
      'const buildTimeEventLiffId = import.meta.env.VITE_EVENT_LINE_LIFF_ID',
      "const buildTimeEventLiffId = ''",
    )
    .replace(
      'const buildTimeDefaultLiffId = import.meta.env.VITE_LINE_LIFF_ID',
      "const buildTimeDefaultLiffId = ''",
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

test('builds LINE app LIFF URL without duplicating the endpoint path', async () => {
  const { buildFreeTrialLineConfirmPath, buildLiffUrl } =
    await importFreeTrialLineConfirm()
  const returnPath = buildFreeTrialLineConfirmPath('FR123')

  assert.equal(returnPath, '/line/free-trial-confirm?referenceId=FR123')
  assert.equal(
    buildLiffUrl('2009987027-MnsDjd6l', returnPath),
    'https://line.me/R/app/2009987027-MnsDjd6l?referenceId=FR123',
  )
})
