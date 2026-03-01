import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const test = sqliteTable('test', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull(),
  gender: integer('gender').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})
