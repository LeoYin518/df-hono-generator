import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '@/lib/http-status-codes.js'
import jsonContent from '@/lib/json-content.js'

const tags = ['Demo']

export const list = createRoute({
  path: '/demo',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        code: z.number(),
        message: z.string(),
        data: z.array(z.object({
          id: z.number(),
          title: z.string(),
        })),
      }),
      '接口描述',
    ),
  },
})

export const add = createRoute({
  path: '/demoAdd',
  method: 'post',
  tags,
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string({ message: 'title 必须是字符串' }),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        code: z.number(),
        message: z.string(),
        data: z.null(),
      }),
      '接口描述',
    ),
  },
})

export type ListRoute = typeof list
export type AddRoute = typeof add
