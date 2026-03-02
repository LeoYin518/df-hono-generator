import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '@/lib/http-status-codes.js'
import jsonContent from '@/lib/json-content.js'

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
    [HttpStatusCodes.OK]: jsonContent(z.object({
      token: z.string().min(1),
      expiresIn: z.int().min(1),
    }), '登录'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(z.object({
      success: z.boolean(),
      code: z.string().or(z.number()),
      message: z.string(),
      error: z.any().optional(),
    }), '用户不存在'),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(z.object({
      success: z.boolean(),
      code: z.string().or(z.number()),
      message: z.string(),
      error: z.any().optional(),
    }), '登录失败，非管理员账号'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(z.object({
      success: z.boolean(),
      code: z.string().or(z.number()),
      message: z.string(),
      error: z.any().optional(),
    }), '密码错误'),
  },
})

export const logout = createRoute({
  path: '/logout',
  method: 'post',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({
      success: z.boolean(),
      code: z.number(),
      message: z.string(),
      data: z.null(),
    }), '管理员-退出登录'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(z.object({
      success: z.boolean(),
      code: z.number(),
      message: z.string(),
      data: z.null(),
    }), '用户未登录'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(z.object({
      success: z.boolean(),
      code: z.number(),
      message: z.string(),
      data: z.null(),
    }), 'TOKEN 校验失败'),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(z.object({
      success: z.boolean(),
      code: z.number(),
      message: z.string(),
      data: z.null(),
    }), 'token 类型不匹配'),
  },
})

export type LoginRoute = typeof login
export type LogoutRoute = typeof logout
