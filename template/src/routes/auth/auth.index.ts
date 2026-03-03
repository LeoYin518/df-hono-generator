import { createRouter } from '@/lib/create-app.js'
import * as handlers from './auth.handler.js'
import * as routes from './auth.routes.js'

const router = createRouter()
  .openapi(routes.login, handlers.login)
  .openapi(routes.logout, handlers.logout)

export default router
