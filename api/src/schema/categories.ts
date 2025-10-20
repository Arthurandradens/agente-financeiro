import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  parentId: integer('parent_id').references(() => categories.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // ex.: 'alimentacao', 'alimentacao/restaurante'
  kind: text('kind').notNull().default('spend') // 'spend' | 'income' | 'transfer' | 'invest' | 'fee'
})

