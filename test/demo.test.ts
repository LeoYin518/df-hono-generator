import assert from 'node:assert/strict'
import { before, describe, it } from 'node:test'

let app: { request: (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response> }


before(async () => {
  process.env.OSS_ACCESS_KEY_ID = process.env.OSS_ACCESS_KEY_ID || 'test-key-id'
  process.env.OSS_ACCESS_KEY_SECRET = process.env.OSS_ACCESS_KEY_SECRET || 'test-key-secret'
  process.env.OSS_BUCKET = process.env.OSS_BUCKET || 'test-bucket'
  process.env.OSS_REGION = process.env.OSS_REGION || 'oss-cn-hangzhou'
  process.env.OSS_BASE_URL = process.env.OSS_BASE_URL || 'https://example.com'

  const mod = await import('@/app.js')
  app = mod.default
})

describe('Demo routes', () => {
  it('GET /test/demo should return demo list', async () => {
    const res = await app.request('/test/demo')
    assert.equal(res.status, 200)

    const body = await res.json() as {
      success: boolean
      code: number
      message: string
      data: Array<{ id: number, title: string }>
    }

    assert.equal(body.success, true)
    assert.equal(body.code, 0)
    assert.equal(Array.isArray(body.data), true)
    assert.equal(body.data.length, 3)
  })

  it('POST /test/demoAdd should accept valid payload', async () => {
    const res = await app.request('/test/demoAdd', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'hello test' }),
    })

    assert.equal(res.status, 200)

    const body = await res.json() as {
      success: boolean
      code: number
      message: string
      data: null
    }

    assert.equal(body.success, true)
    assert.equal(body.code, 0)
    assert.equal(body.data, null)
  })

  it('POST /test/demoAdd should reject invalid payload', async () => {
    const res = await app.request('/test/demoAdd', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })

    assert.equal(res.status, 400)

    const body = await res.json() as {
      success: boolean
      code: number
      message: string
      error?: unknown
    }

    assert.equal(body.success, false)
    assert.equal(body.code, 400)
    assert.equal(body.message, '参数校验失败')
  })
})