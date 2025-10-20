import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const paymentMethods = sqliteTable('payment_methods', {
  id: integer('id').primaryKey(),
  code: text('code').notNull().unique(),
  label: text('label').notNull(),
  aliases: text('aliases') // JSON com variações
})
