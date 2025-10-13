import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { users } from './users.js'

export const statements = sqliteTable('statements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  periodStart: text('period_start').notNull(), // YYYY-MM-DD
  periodEnd: text('period_end').notNull(), // YYYY-MM-DD
  sourceFile: text('source_file').notNull(),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP')
})
