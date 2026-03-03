import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import env from '@/env.js'

const sqlite = new Database(env.DB_FILE_URL)
const db = drizzle({ client: sqlite })

export default db
