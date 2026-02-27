import type { AppOpenAPI } from './types.js'
import { Scalar } from '@scalar/hono-api-reference'
import packageJSON from '../../package.json' with { type: 'json' }

export function configureOpenAPI(app: AppOpenAPI) {
  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: packageJSON.version,
      title: '南声社区OpenAPI',
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
