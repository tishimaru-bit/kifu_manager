import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { sessionSecret } from './env.ts'
import { parseKifuInput } from './kifuInput.ts'
import { createSession, readSession } from './session.ts'

process.env.SESSION_SECRET = 'test-secret-value-not-the-example!!'

describe('sessionSecret', () => {
  it('例の値と短い値は拒否する', () => {
    const previous = process.env.SESSION_SECRET
    try {
      process.env.SESSION_SECRET = 'change-me-to-a-long-random-string'
      assert.throws(() => sessionSecret(), /例の値は使えません/)
      process.env.SESSION_SECRET = 'short-secret'
      assert.throws(() => sessionSecret(), /例の値は使えません/)
    } finally {
      process.env.SESSION_SECRET = previous
    }
  })
})

describe('session', () => {
  const previous = process.env.VERCEL
  after(() => {
    process.env.VERCEL = previous
  })

  it('署名した Cookie からセッションを読む', () => {
    const token = createSession('user-1', 'session-1')
    assert.deepEqual(readSession(`session=${token}`), { sub: 'user-1', sid: 'session-1' })
  })

  it('改ざんした Cookie は拒否する', () => {
    const token = createSession('user-1', 'session-1')
    assert.equal(readSession(`session=${token}x`), null)
  })
})

describe('parseKifuInput', () => {
  const valid = {
    title: '対局',
    sente: '先手',
    gote: '後手',
    event: '',
    played_at: '',
    move_count: 0,
    kif: '棋譜\n',
  }

  it('空の開始日時は null にする', () => {
    const parsed = parseKifuInput(valid)
    assert.equal(parsed.ok, true)
    if (parsed.ok) assert.equal(parsed.value.playedAt, null)
  })

  it('1MB を超える KIF は拒否する', () => {
    const parsed = parseKifuInput({ ...valid, kif: 'あ'.repeat(400_000) })
    assert.equal(parsed.ok, false)
  })
})
