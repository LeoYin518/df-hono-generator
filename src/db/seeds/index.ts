import process from 'node:process'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { reset, seed } from 'drizzle-seed'
import env from '@/env.js'
import { test } from '../schema.js'

async function main() {
  const db = drizzle(env.DB_FILE_URL) // 例如 "./src/db/sqlite.db"
  await reset(db, { test }) // 每次重置表数据，也就是截断
  await seed(db, { test }, { count: 50 })
  console.log('✅ 种子执行成功')
}

main().catch((err) => {
  console.error('❌ 种子执行失败', err)
  process.exit(1)
})
