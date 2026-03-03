import process from 'node:process'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import env from '@/env.js'
import { hashPassword } from '@/utils/passwordAuth.js'
import { user } from '../schema.js'

async function main() {
  const db = drizzle(env.DB_FILE_URL) // 例如 "./src/db/sqlite.db"

  // 插入一个固定的管理员账号
  await db.insert(user).values({
    username: 'dafei',
    password: hashPassword('123'),
    email: 'admin@qq.com',
    mobile: '13333333333',
    nickname: '大飞',
    avatar: null,
    gender: 0,
    birthday: null,
    region: 'CN',
    signature: '热爱你的热爱',
    role: 0,
    status: 1,
  })

  console.log('✅ 种子执行成功')
}

main().catch((err) => {
  console.error('❌ 种子执行失败', err)
  process.exit(1)
})
