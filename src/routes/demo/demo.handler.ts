import type { AddRoute, ListRoute } from './demo.routes.js'
import type { AppRouteHandler } from '@/lib/types.js'
import db from '@/db/index.js'
import { test } from '@/db/schema.js'
import { ok } from '@/lib/response.js'

export const list: AppRouteHandler<ListRoute> = (c) => {
  return ok(c, [
    { id: 1001, title: 'Demo 1' },
    { id: 1002, title: 'Demo 2' },
    { id: 1003, title: 'Demo 3' },
  ])
}

export const add: AppRouteHandler<AddRoute> = async (c) => {
  const { username, gender } = await c.req.json()
  await db.insert(test).values({
    username,
    gender,
  })
  return ok(c, null)
}
