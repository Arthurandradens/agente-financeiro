import { pgTable, serial, integer, varchar, text } from 'drizzle-orm/pg-core'

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id').references(() => categories.id),
  name: varchar('name').notNull(),
  slug: varchar('slug').notNull().unique(),
  kind: varchar('kind').notNull().default('spend')
})
