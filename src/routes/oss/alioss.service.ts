import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import env from '@/env.js'

const require = createRequire(import.meta.url)
const OSS = require('ali-oss') as typeof import('ali-oss')

interface UploadToOssInput {
  file: File
  dir?: string
}

interface OssUploadData {
  url: string
  key: string
  name: string
  size: number
  mime: string
}

type UploadToOssResult = | { ok: true, data: OssUploadData }
  | { ok: false, message: string }

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
    return { ok: false as const, message: 'OSS is not configured' }
  }

  const client = new OSS({
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    secure: true,
  })

  return { ok: true as const, client }
}

export async function uploadFileToOss({ file, dir }: UploadToOssInput): Promise<UploadToOssResult> {
  const oss = getOssClient()
  if (!oss.ok) {
    return { ok: false, message: oss.message }
  }

  const key = createObjectKey(file.name || 'file', dir)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mime = file.type || 'application/octet-stream'

  await oss.client.put(key, buffer, {
    headers: {
      'Content-Type': mime,
    },
  })

  const url = oss.client.signatureUrl(key, { expires: 3600 })

  return {
    ok: true,
    data: {
      url,
      key,
      name: file.name,
      size: file.size,
      mime,
    },
  }
}
