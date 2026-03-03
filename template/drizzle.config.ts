import process from 'node:process'

export default {
  schema: './src/db/schema.ts', // 表定义
  out: './src/db/migrations', // 迁移文件输出目录
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_FILE_URL ?? 'file:./dev.db', // 数据库文件路径
  },
}
