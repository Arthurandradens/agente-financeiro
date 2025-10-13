import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  apiKey: text('api_key'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP')
})
