import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const statements = pgTable("statements", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  period_start: varchar("period_start").notNull(),
  period_end: varchar("period_end").notNull(),
  source_file: varchar("source_file").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
