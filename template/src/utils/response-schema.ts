import { z } from '@hono/zod-openapi'

export const successSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
})

export const errorSchema = z.object({
  success: z.boolean(),
  code: z.string().or(z.number()),
  message: z.string(),
  error: z.any().optional(),
})
