import type { AppOpenAPI, AppType } from './types.js'
import { serveStatic } from '@hono/node-server/serve-static'
import { OpenAPIHono } from '@hono/zod-openapi'
import { pinoLog } from '../middleware/pino-logger.js'

export function createRouter(): AppOpenAPI {
  return new OpenAPIHono<AppType>({
    strict: false,
  })
}

export default function createApp() {
  const app = createRouter()
  // notFound & onError
  app.notFound((c) => {
    return c.json({ message: 'Not Found' }, 404)
  })
  app.onError((err, c) => {
    console.error('Unhandled Error:', err)
    return c.json({ message: 'Internal Server Error' }, 500)
  })
  // favicon.ico
  app.use('/favicon.ico', serveStatic({ root: './src/public' }))
  // log
  app.use(pinoLog())
  return app
}
