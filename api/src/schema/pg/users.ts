import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull().unique(),
  apiKey: varchar('api_key'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})
