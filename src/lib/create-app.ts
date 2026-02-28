import type { AppOpenAPI, AppType } from './types.js'
import { serveStatic } from '@hono/node-server/serve-static'
import { OpenAPIHono } from '@hono/zod-openapi'
import { pinoLog } from '../middleware/pino-logger.js'
import * as HttpStatusCodes from './http-status-codes.js'
import { fail } from './response.js'

export function createRouter(): AppOpenAPI {
  return new OpenAPIHono<AppType>({
    strict: false,
    defaultHook: (result, c) => {
      if (!result.success) {
        const { fieldErrors } = result.error.flatten()
        return fail(
          c,
          HttpStatusCodes.BAD_REQUEST,
          '参数校验失败',
          {
            name: result.error.name,
            issues: result.error.issues,
            fieldErrors,
          },
        )
      }
    },
  })
}

export default function createApp() {
  const app = createRouter()
  // notFound & onError
  app.notFound((c) => {
    return fail(c, HttpStatusCodes.NOT_FOUND, 'Not Found')
  })
  app.onError((err, c) => {
    c.var.logger.error(`Unhandled Error: ${err}`)
    return fail(c, HttpStatusCodes.INTERNAL_SERVER_ERROR, 'Internal Server Error')
  })
  // favicon.ico
  app.use('/favicon.ico', serveStatic({ root: './src/public' }))
  // log
  app.use(pinoLog())
  return app
}
