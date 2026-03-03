import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '@/lib/http-status-codes.js'
import jsonContent from '@/lib/json-content.js'
import { FormDataSchema, OssUrlSchema } from './schema/oss.schemas.js'

const tags = ['阿里云OSS服务接口']

export const uploadHandler = createRoute({
  path: '/common-upload',
  method: 'post',
  tags,
  request: FormDataSchema,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({
      success: z.boolean(),
      code: z.number(),
      message: z.string(),
      data: OssUrlSchema,
    }), 'OSS-上传接口'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        success: z.boolean(),
        code: z.string().or(z.number()),
        message: z.string(),
        error: z.any().optional(),
      }),
      '参数错误',
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        success: z.boolean(),
        code: z.number(),
        message: z.string(),
        error: z.any().optional(),
      }),
      '服务器错误',
    ),
  },
})

export type UploadHandlerRoute = typeof uploadHandler
