import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { statements } from "./statements";
import { categories } from "./categories";
import { paymentMethods } from "./payment-methods";
import { banks } from "./banks";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  statement_id: integer("statement_id").references(() => statements.id),
  date: varchar("date").notNull(), // YYYY-MM-DD
  description: text("description").notNull(),
  merchant: text("merchant"),
  type: varchar("type", { enum: ["income", "spend"] }).notNull(),
  amount: real("amount").notNull(),
  category_id: integer("category_id").references(() => categories.id),
  subcategory_id: integer("subcategory_id").references(() => categories.id),
  is_internal_transfer: integer("is_internal_transfer").notNull().default(0),
  is_card_bill_payment: integer("is_card_bill_payment").notNull().default(0),
  is_investment: integer("is_investment").notNull().default(0),
  payment_method_id: integer("payment_method_id").references(
    () => paymentMethods.id,
  ),
  payment_method: text("payment_method"), // DEPRECATED - será removido futuramente
  bank_id: integer("bank_id").references(() => banks.id),
  bank_name: text("bank_name"), // DEPRECATED - manter para compatibilidade
  created_at: timestamp("created_at").notNull().defaultNow(),
});
