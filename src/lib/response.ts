import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { AppType } from './types.js'
import * as HttpStatusCodes from './http-status-codes.js'

export interface SuccessResponse<T> {
  success: true
  code: number
  message: string
  data: T
}

export interface ErrorResponse {
  success: false
  code: string | number
  message: string
  error?: unknown
}

export function ok<T>(
  c: Context<AppType>,
  data: T,
  message = '操作成功',
) {
  return c.json<SuccessResponse<T>, 200>({
    success: true,
    code: 0,
    message,
    data,
  }, HttpStatusCodes.OK as 200)
}

export function fail(
  c: Context<AppType>,
  code: string | number,
  message: string,
  error?: unknown,
  status: ContentfulStatusCode = HttpStatusCodes.BAD_REQUEST as ContentfulStatusCode,
) {
  return c.json<ErrorResponse>({
    success: false,
    code,
    message,
    error,
  }, status)
}
