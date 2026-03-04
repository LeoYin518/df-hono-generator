import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '@/lib/http-status-codes.js'
import jsonContent from '@/lib/json-content.js'
import { errorSchema, successSchema } from '@/utils/response-schema.js'

const tags = ['登录接口']

export const login = createRoute({
  path: '/login',
  method: 'post',
  tags,
  request: {
    body: jsonContent(z.object({
      account: z.string().min(3),
      password: z.string().min(3),
    }), '登录参数'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(successSchema.extend({
      data: z.object({
        token: z.string().min(1),
        expiresIn: z.int().min(1),
      }),
    }), '登录'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(errorSchema, '用户不存在'),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(errorSchema, '登录失败，非管理员账号'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, '密码错误'),
  },
})

export const logout = createRoute({
  path: '/logout',
  method: 'post',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(successSchema.extend({
      data: z.null(),
    }), '管理员-退出登录'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(errorSchema, '用户未登录'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, 'TOKEN 校验失败'),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(errorSchema, 'token 类型不匹配'),
  },
})

export type LoginRoute = typeof login
export type LogoutRoute = typeof logout
