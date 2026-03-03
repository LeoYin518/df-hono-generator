import type { ZodSchema } from './types.js'

function jsonContent(schema: ZodSchema, description: string) {
  return {
    content: {
      'application/json': {
        schema,
      },
    },
    description,
  }
}

export default jsonContent
