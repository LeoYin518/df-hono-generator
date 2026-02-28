import type { UploadHandlerRoute } from './alioss.routes.js'
import type { AppRouteHandler } from '@/lib/types.js'
import * as HttpStatusCodes from '@/lib/http-status-codes.js'
import { fail, ok } from '@/lib/response.js'
import { uploadFileToOss } from './alioss.service.js'

export const uploadHandler: AppRouteHandler<UploadHandlerRoute> = async (c) => {
  const form = await c.req.formData()
  const fileValue = form.get('file')
  if (!(fileValue instanceof File)) {
    return fail(c, HttpStatusCodes.INTERNAL_SERVER_ERROR, 'Please upload file with multipart/form-data')
  }

  const dirValue = form.get('dir')
  const dir = typeof dirValue === 'string' ? dirValue : undefined

  const result = await uploadFileToOss({
    file: fileValue,
    dir,
  })

  if (!result.ok) {
    return fail(c, HttpStatusCodes.BAD_REQUEST, result.message)
  }

  return ok(c, result.data)
}
