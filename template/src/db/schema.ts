import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// 用户表
export const user = sqliteTable('user', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 展示账号（可选）
  username: text('username').unique(),
  // 本地密码（第三方用户可为空）
  password: text('password'),
  // 邮箱
  email: text('email').unique(),
  // 手机号
  mobile: text('mobile').unique(),
  // 昵称
  nickname: text('nickname'),
  // 头像
  avatar: text('avatar'),
  // 性别 0: 男，1: 女
  gender: integer('gender').notNull().default(0),
  // 生日
  birthday: text('birthday'),
  // 地区
  region: text('region'),
  // 个性签名
  signature: text('signature'),
  // 角色 0: 管理员，1: 普通用户，2: VIP用户
  role: integer('role').notNull().default(1),
  // 状态 0: 禁用，1: 启用，2: 锁定，3: 删除
  status: integer('status').notNull().default(1),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  remark: text('remark'),
})
