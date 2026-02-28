import type { UploadHandlerRoute } from './alioss.routes.js'
import type { AppRouteHandler } from '@/lib/types.js'
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import env from '@/env.js'
import * as HttpStatusCodes from '@/lib/http-status-codes.js'
import { fail, ok } from '@/lib/response.js'

const require = createRequire(import.meta.url)
const OSS = require('ali-oss') as typeof import('ali-oss')

function sanitizePathSegment(input: string) {
  const value = input.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
  if (value === '')
    return ''
  if (!/^[\w/-]+$/.test(value))
    return ''
  return value
}

function createObjectKey(fileName: string, dir?: string) {
  const extRaw = fileName.includes('.') ? fileName.split('.').pop() ?? '' : ''
  const ext = extRaw.replace(/[^a-z0-9]/gi, '').slice(0, 12)

  const now = new Date()
  const yyyy = `${now.getFullYear()}`
  const mm = `${now.getMonth() + 1}`.padStart(2, '0')
  const dd = `${now.getDate()}`.padStart(2, '0')

  const basePath = 'uploads'
  const safeDir = dir ? sanitizePathSegment(dir) : ''
  const parts = [basePath, safeDir, `${yyyy}/${mm}/${dd}`].filter(Boolean)
  const keyBase = `${parts.join('/')}/${randomUUID()}`

  return ext ? `${keyBase}.${ext}` : keyBase
}

function getOssClient() {
  const region = env.OSS_REGION
  const bucket = env.OSS_BUCKET
  const accessKeyId = env.OSS_ACCESS_KEY_ID
  const accessKeySecret = env.OSS_ACCESS_KEY_SECRET

  if (!region || !bucket || !accessKeyId || !accessKeySecret) {
    return { ok: false as const, message: 'OSS 未配置' }
  }

  const client = new OSS({
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    secure: true,
  })

  return { ok: true as const, client, bucket, region }
}

export const uploadHandler: AppRouteHandler<UploadHandlerRoute> = async (c) => {
  const oss = getOssClient()
  if (!oss.ok) {
    return fail(c, HttpStatusCodes.BAD_REQUEST, oss.message)
  }

  const form = await c.req.formData()
  const fileValue = form.get('file')
  if (!(fileValue instanceof File)) {
    return fail(c, HttpStatusCodes.INTERNAL_SERVER_ERROR, '请使用 multipart/form-data 上传 file')
  }

  const dirValue = form.get('dir')
  const dir = typeof dirValue === 'string' ? dirValue : undefined

  const key = createObjectKey(fileValue.name || 'file', dir)
  const arrayBuffer = await fileValue.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await oss.client.put(key, buffer, {
    headers: {
      'Content-Type': fileValue.type || 'application/octet-stream',
    },
  })

  const url = oss.client.signatureUrl(key, { expires: 3600 })

  return ok(c, {
    url,
    key,
    name: fileValue.name,
    size: fileValue.size,
    mime: fileValue.type || 'application/octet-stream',
  })
}
