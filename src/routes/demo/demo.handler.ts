import type { AddRoute, ListRoute } from './demo.routes.js'
import type { AppRouteHandler } from '@/lib/types.js'
import * as HttpStatusCodes from '@/lib/http-status-codes.js'

export const list: AppRouteHandler<ListRoute> = (c) => {
  return c.json({
    code: HttpStatusCodes.OK,
    message: '操作成功',
    data: [
      { id: 1001, title: 'Demo 1' },
      { id: 1002, title: 'Demo 2' },
      { id: 1003, title: 'Demo 3' },
    ],
  }, HttpStatusCodes.OK)
}

export const add: AppRouteHandler<AddRoute> = async (c) => {
  const { title } = await c.req.json()
  c.var.logger.info(title)
  return c.json({
    code: HttpStatusCodes.OK,
    message: '操作成功',
  }, HttpStatusCodes.OK)
}
