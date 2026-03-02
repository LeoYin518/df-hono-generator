import type { LoginRoute, LogoutRoute } from './auth.routes.js'
import type { AppRouteHandler } from '@/lib/types.js'
import { eq, or } from 'drizzle-orm'
import db from '@/db/index.js'
import { user } from '@/db/schema.js'
import env from '@/env.js'
import * as HttpStatusCodes from '@/lib/http-status-codes.js'
import { fail, ok } from '@/lib/response.js'
import { AuthRole, AuthStatus, createJwt, JwtAudience, revokeJwt, verifyJwt } from '@/utils/jwt.js'
import { verifyPassword } from '@/utils/passwordAuth.js'

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const { account, password } = await c.req.json()
  // 数据库查询用户
  const rows = await db.select()
    .from(user)
    .where(
      or(eq(user.email, account), eq(user.mobile, account)),
    )
  if (rows.length === 0) {
    return fail(c, HttpStatusCodes.NOT_FOUND, '用户不存在')
  }

  const found = rows[0]
  if (found.role !== AuthRole.ADMIN) {
    return fail(c, HttpStatusCodes.FORBIDDEN, '登录失败，非管理员账号')
  }

  if (found.status !== AuthStatus.ENABLED) {
    if (found.status === AuthStatus.DISABLED) {
      return fail(c, HttpStatusCodes.FORBIDDEN, '登录失败，用户被禁用')
    }
    if (found.status === AuthStatus.LOCKED) {
      return fail(c, HttpStatusCodes.FORBIDDEN, '登录失败，用户被锁定')
    }
    if (found.status === AuthStatus.DELETED) {
      return fail(c, HttpStatusCodes.FORBIDDEN, '登录失败，用户被删除')
    }
  }

  const passwordValid = verifyPassword(password, found.password!)
  if (!passwordValid.ok) {
    return fail(c, HttpStatusCodes.BAD_REQUEST, '密码错误')
  }

  // 生成 jwt token 设定过期时间
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = env.JWT_ADMIN_EXPIRES_IN_SECONDS
  const token = createJwt({
    sub: String(found.id),
    aud: JwtAudience.ADMIN,
    role: found.role,
    iat: now,
    exp: now + expiresIn,
  }, env.JWT_ADMIN_SECRET)

  return ok(c, { token, expiresIn })
}

export const logout: AppRouteHandler<LogoutRoute> = async (c) => {
  const raw = c.req.header('authorization') || c.req.header('Authorization')
  const m = raw?.match(/^Bearer\s+(\S+)$/i)
  const token = m?.[1]?.trim()
  if (!token)
    return fail(c, HttpStatusCodes.UNAUTHORIZED, '用户未登录')

  const verified = verifyJwt(token, env.JWT_ADMIN_SECRET)
  if (!verified.ok)
    return fail(c, HttpStatusCodes.BAD_REQUEST, verified.message)
  if (verified.payload.aud !== JwtAudience.ADMIN)
    return fail(c, HttpStatusCodes.FORBIDDEN, 'token 类型不匹配')

  revokeJwt(token, verified.payload.exp)
  return ok(c, null)
}
