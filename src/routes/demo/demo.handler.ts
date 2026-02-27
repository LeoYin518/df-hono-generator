import type { AddRoute, ListRoute } from './demo.routes.js'
import type { AppRouteHandler } from '@/lib/types.js'
import { ok } from '@/lib/response.js'

export const list: AppRouteHandler<ListRoute> = (c) => {
  return ok(c, [
    { id: 1001, title: 'Demo 1' },
    { id: 1002, title: 'Demo 2' },
    { id: 1003, title: 'Demo 3' },
  ])
}

export const add: AppRouteHandler<AddRoute> = async (c) => {
  const { title } = await c.req.json()
  c.var.logger.info(title)
  return ok(c, null)
}
