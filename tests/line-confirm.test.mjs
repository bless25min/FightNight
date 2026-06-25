import assert from 'node:assert/strict'
import test from 'node:test'

import { confirmFreeTrialLineReservation } from '../functions/api/free-trial-reservation/line-confirm.js'

function createEnv(order) {
  const state = {
    order: { ...order },
    updateArgs: null,
  }

  return {
    state,
    env: {
      DB: {
        prepare(sql) {
          return {
            bind(...args) {
              return {
                async first() {
                  if (/FROM course_orders/i.test(sql)) return state.order
                  return null
                },
                async run() {
                  if (/UPDATE course_orders/i.test(sql)) {
                    state.updateArgs = args
                    state.order = {
                      ...state.order,
                      line_user_id: args[0],
                      line_display_name: args[1],
                      line_picture_url: args[2],
                      line_email: args[3],
                      line_email_verified: args[4],
                      line_is_friend: args[5],
                      line_context_json: args[6],
                    }
                    return { meta: { changes: 1 } }
                  }
                  return { meta: { changes: 0 } }
                },
              }
            },
          }
        },
      },
    },
  }
}

test('binds a free trial reservation to LINE and sends the confirmation card', async () => {
  const { env, state } = createEnv({
    reference_id: 'FR123',
    status: 'free_reserved',
    line_user_id: null,
  })
  const calls = {
    upserted: null,
    notified: null,
  }

  const result = await confirmFreeTrialLineReservation({
    env,
    referenceId: 'FR123',
    lineContext: {
      lineUserId: 'U123',
      displayName: 'LINE User',
      pictureUrl: 'https://example.com/u.jpg',
      email: 'line@example.com',
      emailVerified: true,
      isFriend: true,
    },
    upsertLineCustomer: async (_env, lineContext) => {
      calls.upserted = lineContext
    },
    notifyLineFreeTrialReservation: async (_env, referenceId, options) => {
      calls.notified = { referenceId, options }
      return { status: 'sent' }
    },
  })

  assert.equal(result.ok, true)
  assert.equal(result.lineNotify.status, 'sent')
  assert.equal(state.order.line_user_id, 'U123')
  assert.equal(JSON.parse(state.order.line_context_json).lineUserId, 'U123')
  assert.equal(calls.upserted.lineUserId, 'U123')
  assert.deepEqual(calls.notified, {
    referenceId: 'FR123',
    options: undefined,
  })
})

test('does not rebind a free trial reservation already linked to another LINE user', async () => {
  const { env, state } = createEnv({
    reference_id: 'FR123',
    status: 'free_reserved',
    line_user_id: 'U999',
  })

  const result = await confirmFreeTrialLineReservation({
    env,
    referenceId: 'FR123',
    lineContext: { lineUserId: 'U123' },
    upsertLineCustomer: async () => {
      throw new Error('upsert should not run')
    },
    notifyLineFreeTrialReservation: async () => {
      throw new Error('notify should not run')
    },
  })

  assert.equal(result.ok, false)
  assert.equal(result.status, 409)
  assert.equal(state.order.line_user_id, 'U999')
  assert.equal(state.updateArgs, null)
})
