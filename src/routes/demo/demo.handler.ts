import type { AddRoute, ListRoute } from './demo.routes.js'
import type { AppRouteHandler } from '@/lib/types.js'
import { eq } from 'drizzle-orm'
import db from '@/db/index.js'
import { test } from '@/db/schema.js'
import { ok } from '@/lib/response.js'
import { getKey, setKey } from '@/utils/redis.cache.js'

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const cacheKey = 'demo1'
  let cacheResult = await getKey(cacheKey)
  if (cacheResult) {
    console.log('命中缓存')
    return ok(c, cacheResult)
  }
  console.log('未命中缓存：查询数据库')
  cacheResult = await db.select().from(test).where(eq(test.id, 2))
  await setKey(cacheKey, cacheResult)
  return ok(c, cacheResult)
}

export const add: AppRouteHandler<AddRoute> = async (c) => {
  const { username, gender } = await c.req.json()
  // returning 表示返回插入的数据，数组中每个元素都是一个对象
  const result = await db.insert(test).values({
    username,
    gender,
  }).returning()
  const cacheKey = `demo2`
  await setKey(cacheKey, result)
  return ok(c, null)
}
