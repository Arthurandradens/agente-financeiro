import { pgTable, serial, integer, varchar, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const statements = pgTable('statements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  periodStart: varchar('period_start').notNull(),
  periodEnd: varchar('period_end').notNull(),
  sourceFile: varchar('source_file').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})
