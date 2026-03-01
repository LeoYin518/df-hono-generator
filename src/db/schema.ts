import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core'

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

// 第三方账号表
export const oauthAccount = sqliteTable('oauth_account', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 关联用户
  userId: integer('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  // 登录提供方 wechat | github | google | etc
  provider: text('provider').notNull(),
  // 第三方平台返回的唯一ID，微信：unionid 或 openid，GitHub：id
  providerUserId: text('provider_user_id').notNull(),
  nickname: text('nickname'),  // 第三方平台昵称
  avatar: text('avatar'),      // 第三方头像
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: text('expires_at'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
}, (table) => [
  // 保证同一个第三方账号在系统里只能绑定一个用户，防止重复绑定和登录混乱
  unique().on(table.provider, table.providerUserId),
]
)

// 类别表
export const category = sqliteTable('category', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 类别名称
  title: text('title').notNull(),
  // 类别描述
  description: text('description'),
  // 类别作者ID
  userId: integer('user_id').references(() => user.id),
  sort: integer('sort').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  remark: text('remark'),
})

// 课程表
export const course = sqliteTable('course', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 课程标题
  title: text('title').notNull(),
  // 课程封面
  cover: text('cover'),
  // 课程分类
  categoryId: integer('category_id').notNull().references(() => category.id),
  // 课程标签
  tags: text('tags', { mode: 'json' }),
  // 课程描述
  description: text('description'),
  // 付费类型 -- 0: 免费, 1: 收费
  type: integer('type').notNull().default(0),
  // 价格 -- 单位：分
  price: integer('price').notNull().default(0),
  // 状态 -- 0：草稿 1：已发布 2：删除
  status: integer('status').notNull().default(0),
  // 课程作者
  userId: integer('user_id').references(() => user.id),
  sort: integer('sort').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  remark: text('remark'),
})

// 章节表
export const chapter = sqliteTable('chapter', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 章节标题
  title: text('title').notNull(),
  // 章节内容
  content: text('content'),
  // 所属课程
  courseId: integer('course_id').notNull().references(() => course.id),
  // 章节视频
  video: text('video'),
  // 状态 -- 0: 草稿,1: 已发布 ,2：删除
  status: integer('status').notNull().default(0),
  // 排序
  sort: integer('sort').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  remark: text('remark'),
})

// 博客表
export const blog = sqliteTable('blog', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 博客标题
  title: text('title').notNull(),
  // 博客内容
  content: text('content'),
  // 博客作者
  userId: integer('user_id').references(() => user.id),
  // 状态 -- 0: 草稿,1: 已发布 ,2：删除
  status: integer('status').notNull().default(0),
  // 排序
  sort: integer('sort').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  remark: text('remark'),
})

// 系统通知表
export const notice = sqliteTable('notice', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 通知标题
  title: text('title').notNull(),
  // 通知内容
  content: text('content'),
  // 通知作者
  userId: integer('user_id').references(() => user.id),
  // 通知状态 -- 0: 草稿,1: 已发布 ,2：删除
  status: integer('status').notNull().default(0),
  // 排序
  sort: integer('sort').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  remark: text('remark'),
})

// 课程收藏表
export const courseCollect = sqliteTable('course_collect', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 用户ID
  userId: integer('user_id').notNull().references(() => user.id),
  // 课程ID
  courseId: integer('course_id').notNull().references(() => course.id),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
})
