import { Buffer } from 'node:buffer'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * 最小化实现的 HS256 JWT 工具：
 * - createJwt：生成形如 header.payload.signature 的 token
 * - verifyJwt：校验签名与过期时间，并返回解析后的 payload
 *
 * 说明：
 * - 这里没有做 “nbf”、“iss”、“jti” 等字段校验；如业务需要可自行扩展。
 * - 这里使用 base64url 编码（RFC 7515 / 7519），即把 +/ 替换为 -_，并移除末尾 =
 */
interface JwtHeader {
  alg: 'HS256'
  typ: 'JWT'
}

export interface JwtPayload {
  /**
   * subject：通常放用户 id（字符串）。
   */
  sub: string
  /**
   * audience：token 的目标受众（例如 'admin' / 'client'）。
   */
  aud: string
  /**
   * issued at：签发时间（秒级时间戳）。
   */
  iat: number
  /**
   * expiration time：过期时间（秒级时间戳）。
   */
  exp: number
  [key: string]: unknown
}

/**
 * base64url 编码：
 * - 标准 base64 的 '+'、'/' 分别替换为 '-'、'_'
 * - 去掉 '=' padding
 */
function base64UrlEncode(input: string | Buffer) {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

/**
 * base64url 解码为 Buffer：
 * - 还原 '-'、'_' 为标准 base64 的 '+'、'/'
 * - 按 4 的倍数补齐 '=' padding
 */
function base64UrlDecodeToBuffer(input: string) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=')
  return Buffer.from(padded, 'base64')
}

/**
 * 使用 HMAC-SHA256 计算签名（HS256），并返回 base64url 的签名串。
 */
function signHS256(data: string, secret: string) {
  const mac = createHmac('sha256', secret).update(data).digest()
  return base64UrlEncode(mac)
}

/**
 * 生成 JWT（HS256）。
 *
 * - payload 中必须提供 sub / aud
 * - iat / exp 可选；不传则使用当前时间与默认 1 小时过期
 */
export function createJwt(payload: Omit<JwtPayload, 'iat' | 'exp'> & { iat?: number, exp?: number }, secret: string) {
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JwtPayload = {
    ...payload,
    sub: payload.sub as string,
    aud: payload.aud as string,
    iat: payload.iat ?? now,
    exp: payload.exp ?? now + 60 * 60,
  }

  // JWT 的 header / payload 都是 JSON，再进行 base64url 编码
  const head = base64UrlEncode(JSON.stringify(header))
  const body = base64UrlEncode(JSON.stringify(fullPayload))
  const signingInput = `${head}.${body}`
  // signature = HMAC-SHA256(base64url(header) + "." + base64url(payload), secret)
  const sig = signHS256(signingInput, secret)
  return `${signingInput}.${sig}`
}

export type VerifyJwtResult
  = | { ok: true, payload: JwtPayload }
    | { ok: false, message: string }

const revokedTokens = new Map<string, number>()

function cleanupRevokedTokens() {
  const now = Date.now()
  for (const [token, expiresAtMs] of revokedTokens.entries()) {
    if (expiresAtMs <= now)
      revokedTokens.delete(token)
  }
}

/**
 * 退出 JWT。
 *
 * - 退出 JWT 后，将不能再使用此 JWT 访问受保护的资源。
 * - 退出 JWT 后，此 JWT 将不能再被使用
 * @param token 要撤销的 token
 * @param expSeconds 过期时间，单位秒
 */
export function revokeJwt(token: string, expSeconds: number) {
  cleanupRevokedTokens()
  const expiresAtMs = expSeconds * 1000
  if (expiresAtMs <= Date.now())
    return
  revokedTokens.set(token, expiresAtMs)
}

/**
 * 校验 JWT（HS256）并解析 payload。
 *
 * 校验项：
 * - token 结构必须是 3 段：header.payload.signature
 * - header 必须是 HS256 JWT
 * - signature 必须匹配（用 timingSafeEqual 做常量时间比较）
 * - exp 必须是数字且未过期
 * - sub / aud 必须是非空字符串
 */
export function verifyJwt(token: string, secret: string): VerifyJwtResult {
  // 1) 切分三段
  const parts = token.split('.')
  if (parts.length !== 3)
    return { ok: false, message: 'token 格式错误' }

  const [headB64, bodyB64, sigB64] = parts
  if (!headB64 || !bodyB64 || !sigB64)
    return { ok: false, message: 'token 格式错误' }

  // 2) 解码 header / payload 的 JSON
  let header: JwtHeader
  let payload: JwtPayload
  try {
    header = JSON.parse(base64UrlDecodeToBuffer(headB64).toString('utf8'))
    payload = JSON.parse(base64UrlDecodeToBuffer(bodyB64).toString('utf8'))
  }
  catch {
    return { ok: false, message: 'token 解析失败' }
  }

  // 3) 限制算法与类型，避免接受不支持/不期望的 token
  if (header.alg !== 'HS256' || header.typ !== 'JWT') {
    return { ok: false, message: 'token header 不支持' }
  }

  // 4) 重新计算签名并与 token 中的签名比较
  const signingInput = `${headB64}.${bodyB64}`
  const expectedSig = signHS256(signingInput, secret)

  // timingSafeEqual 需要等长 Buffer；不等长直接判失败
  const a = Buffer.from(expectedSig)
  const b = Buffer.from(sigB64)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, message: 'token 签名无效' }
  }

  // 5) 校验 exp（过期时间）
  const now = Math.floor(Date.now() / 1000)
  if (typeof payload.exp !== 'number' || payload.exp <= now) {
    return { ok: false, message: 'token 已过期' }
  }

  cleanupRevokedTokens()
  const revokedExpiresAtMs = revokedTokens.get(token)
  if (typeof revokedExpiresAtMs === 'number' && revokedExpiresAtMs > Date.now()) {
    return { ok: false, message: 'token 已退出' }
  }

  // 6) 最小字段校验：sub / aud 必须是非空字符串
  if (typeof payload.sub !== 'string' || payload.sub.trim() === '') {
    return { ok: false, message: 'token sub 无效' }
  }

  if (typeof payload.aud !== 'string' || payload.aud.trim() === '') {
    return { ok: false, message: 'token aud 无效' }
  }

  return { ok: true, payload }
}

// 登录角色
export const AuthRole = {
  ADMIN: 0,
  COMMON: 1,
  VIP: 2,
} as const

// JWT payload
export const JwtAudience = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
} as const

// 用户状态
export const AuthStatus = {
  DISABLED: 0,
  ENABLED: 1,
  LOCKED: 2,
  DELETED: 3,
} as const
