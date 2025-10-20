import { pgTable, serial, varchar, text } from 'drizzle-orm/pg-core'

export const paymentMethods = pgTable('payment_methods', {
  id: serial('id').primaryKey(),
  code: varchar('code').notNull().unique(),
  label: varchar('label').notNull(),
  aliases: text('aliases')
})
