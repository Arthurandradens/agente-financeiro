import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const banks = sqliteTable('banks', {
  id: integer('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull()
})
