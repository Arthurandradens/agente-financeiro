import { pgTable, serial, varchar } from 'drizzle-orm/pg-core'

export const banks = pgTable('banks', {
  id: serial('id').primaryKey(),
  code: varchar('code').notNull().unique(),
  name: varchar('name').notNull()
})
