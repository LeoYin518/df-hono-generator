import type { AppOpenAPI } from './types.js'
import { Scalar } from '@scalar/hono-api-reference'
import env from '@/env.js'
import { readFileSync } from 'node:fs'

const packageJSON = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
)

export function configureOpenAPI(app: AppOpenAPI) {
  if (env.NODE_ENV === 'development') {
    app.doc('/doc', {
      openapi: '3.0.0',
      info: {
        version: packageJSON.version,
        title: 'Hono-generator API',
        description: 'Hono App API Documentation',
      },
    })

    app.get('/scalar', Scalar({
      url: '/doc',
      theme: 'deepSpace',
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'fetch',
      },
    }))
  }
}
