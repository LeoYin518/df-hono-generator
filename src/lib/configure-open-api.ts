import type { AppOpenAPI } from './types.js'
import { Scalar } from '@scalar/hono-api-reference'
import packageJSON from '../../package.json' with { type: 'json' }
import env from '@/env.js'

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
