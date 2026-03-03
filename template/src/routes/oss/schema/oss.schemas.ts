import { z } from '@hono/zod-openapi'

export const OssUrlSchema = z.object({
  url: z.string(),
  key: z.string(),
  name: z.string(),
  size: z.number(),
  mime: z.string(),
})

export const FormDataSchema = {
  body: {
    content: {
      'multipart/form-data': {
        schema: z.object({
          file: z.any().openapi({ type: 'string', format: 'binary' }),
        }),
      },
    },
  },
}
