import type { MiddlewareHandler } from 'hono'
import env from '@/env.js'
import * as HttpStatusCodes from '@/lib/http-status-codes.js'
import { fail } from '@/lib/response.js'
import { JwtAudience, verifyJwt } from '@/utils/jwt.js'

/**
 * 从请求头 Authorization 里解析 Bearer token。
 *
 * 期望格式：Authorization: Bearer <token>
 * - 如果请求头不存在或格式不正确，返回 undefined
 * - 如果格式正确，返回去掉首尾空白的 token 字符串
 */
function getBearerToken(c: any) {
  const raw = c.req.header('authorization') || c.req.header('Authorization')
  if (!raw)
    return undefined
  const m = raw.match(/^Bearer\s+(\S+)$/i)
  return m?.[1]?.trim()
}

type JwtAudienceType = 'ADMIN' | 'CLIENT'

function requireJwtAuth(options: {
  aud: JwtAudienceType
  secret: string
  skipPathPrefixes?: string[]
}): MiddlewareHandler {
  return async (c, next) => {
    const skipPrefixes = options.skipPathPrefixes ?? []
    if (skipPrefixes.length > 0) {
      const path = c.req.path
      if (skipPrefixes.some(p => path.startsWith(p))) {
        return next()
      }
    }

    const token = getBearerToken(c)
    if (!token)
      return fail(c, HttpStatusCodes.UNAUTHORIZED, '用户未登录')

    const verified = verifyJwt(token, options.secret)
    if (!verified.ok)
      return fail(c, HttpStatusCodes.BAD_REQUEST, verified.message)
    if (verified.payload.aud !== options.aud)
      return fail(c, HttpStatusCodes.FORBIDDEN, 'token 类型不匹配')

    c.set('auth', {
      userId: Number(verified.payload.sub),
      aud: verified.payload.aud,
      role: verified.payload.role,
    })
    return next()
  }
}

/**
 * 仅允许携带 admin token 的请求继续执行。
 *
 * 行为：
 * - /admin/auth/* 视为登录相关接口，直接放行（不做鉴权）
 * - 其他 /admin/* 请求必须携带 Bearer token
 * - token 必须能用 JWT_ADMIN_SECRET 验签且 aud === 'admin'
 * - 验证通过后，把鉴权信息写入上下文 c.set('auth', ...)
 */
export function requireAdminAuth(): MiddlewareHandler {
  return requireJwtAuth({
    aud: JwtAudience.ADMIN,
    secret: env.JWT_ADMIN_SECRET,
    skipPathPrefixes: ['/admin/auth/'],
  })
}

/**
 * 仅允许携带 client token 的请求继续执行。
 *
 * 行为：
 * - 请求必须携带 Bearer token
 * - token 必须能用 JWT_CLIENT_SECRET 验签且 aud === 'client'
 * - 验证通过后，把鉴权信息写入上下文 c.set('auth', ...)
 */
export function requireClientAuth(): MiddlewareHandler {
  return requireJwtAuth({
    aud: JwtAudience.CLIENT,
    secret: env.JWT_CLIENT_SECRET,
    skipPathPrefixes: ['/client/auth/'],
  })
}

/**
 * 历史兼容命名：以前用于“admin 或 client 任意一种鉴权”。
 *
 * 当前实现支持 admin 或 client 任意一种 token。
 */
export function requireEitherAuth(): MiddlewareHandler {
  return async (c, next) => {
    const token = getBearerToken(c)
    if (!token)
      return fail(c, HttpStatusCodes.UNAUTHORIZED, '未登录')

    const adminVerified = verifyJwt(token, env.JWT_ADMIN_SECRET)
    if (adminVerified.ok) {
      if (adminVerified.payload.aud !== JwtAudience.ADMIN)
        return fail(c, HttpStatusCodes.FORBIDDEN, 'token 类型不匹配')
      c.set('auth', {
        userId: Number(adminVerified.payload.sub),
        aud: adminVerified.payload.aud,
        role: adminVerified.payload.role,
      })
      return next()
    }

    const clientVerified = verifyJwt(token, env.JWT_CLIENT_SECRET!)
    if (clientVerified.ok) {
      if (clientVerified.payload.aud !== JwtAudience.CLIENT)
        return fail(c, HttpStatusCodes.FORBIDDEN, 'token 类型不匹配')
      c.set('auth', {
        userId: Number(clientVerified.payload.sub),
        aud: clientVerified.payload.aud,
        role: clientVerified.payload.role,
      })
      return next()
    }

    return fail(c, HttpStatusCodes.FORBIDDEN, adminVerified.message)
  }
}
