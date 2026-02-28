import { createRouter } from '@/lib/create-app.js'
import * as handlers from './alioss.handler.js'
import * as routes from './alioss.routes.js'

const router = createRouter()
  .openapi(routes.uploadHandler, handlers.uploadHandler)

export default router
