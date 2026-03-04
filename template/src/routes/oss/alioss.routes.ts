import { createRoute } from '@hono/zod-openapi'
import * as HttpStatusCodes from '@/lib/http-status-codes.js'
import jsonContent from '@/lib/json-content.js'
import { errorSchema, successSchema } from '@/utils/response-schema.js'
import { FormDataSchema, OssUrlSchema } from './schema/oss.schemas.js'

const tags = ['阿里云OSS服务接口']

export const uploadHandler = createRoute({
  path: '/common-upload',
  method: 'post',
  tags,
  request: FormDataSchema,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(successSchema.extend({
      data: OssUrlSchema,
    }), 'OSS-上传接口'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(errorSchema, '参数错误'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(errorSchema, '服务器错误'),
  },
})

export type UploadHandlerRoute = typeof uploadHandler
