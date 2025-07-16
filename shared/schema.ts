import { pgTable, text, timestamp, boolean, serial, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  companyName: text('company_name').notNull(),
  displayName: text('display_name'),
  trialStartDate: timestamp('trial_start_date').notNull(),
  isSubscriber: boolean('is_subscriber').default(false),
  isSuspended: boolean('is_suspended').default(false),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  logo: text('logo'),
  address: text('address').notNull(),
  vatNumber: text('vat_number'),
  registrationNumber: text('registration_number'),
  currency: text('currency').notNull().default('GBP'),
  dateFormat: text('date_format').notNull().default('DD/MM/YYYY'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address').notNull(),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).notNull(),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  number: text('number').notNull(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  date: timestamp('date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  items: jsonb('items').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull(),
  notes: text('notes'),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  number: text('number').notNull(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  date: timestamp('date').notNull(),
  validUntil: timestamp('valid_until').notNull(),
  items: jsonb('items').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull(),
  notes: text('notes'),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const statements = pgTable('statements', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  number: text('number').notNull(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  date: timestamp('date').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  period: text('period').notNull(), // '7', '30', or 'custom'
  notes: text('notes'),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const recycleBin = pgTable('recycle_bin', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  originalId: text('original_id').notNull(),
  type: text('type').notNull(),
  data: jsonb('data').notNull(),
  deletedAt: timestamp('deleted_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  customers: many(customers),
  products: many(products),
  invoices: many(invoices),
  quotes: many(quotes),
  statements: many(statements),
}));

export const customersRelations = relations(customers, ({ one }) => ({
  user: one(users, { fields: [customers.uid], references: [users.uid] }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  user: one(users, { fields: [products.uid], references: [users.uid] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  user: one(users, { fields: [invoices.uid], references: [users.uid] }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  user: one(users, { fields: [quotes.uid], references: [users.uid] }),
}));

export const statementsRelations = relations(statements, ({ one }) => ({
  user: one(users, { fields: [statements.uid], references: [users.uid] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertCompanySchema = createInsertSchema(companies);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertProductSchema = createInsertSchema(products);
export const insertInvoiceSchema = createInsertSchema(invoices);
export const insertQuoteSchema = createInsertSchema(quotes);
export const insertStatementSchema = createInsertSchema(statements);
export const insertRecycleBinSchema = createInsertSchema(recycleBin);

// Select schemas
export const selectUserSchema = createSelectSchema(users);
export const selectCompanySchema = createSelectSchema(companies);
export const selectCustomerSchema = createSelectSchema(customers);
export const selectProductSchema = createSelectSchema(products);
export const selectInvoiceSchema = createSelectSchema(invoices);
export const selectQuoteSchema = createSelectSchema(quotes);
export const selectStatementSchema = createSelectSchema(statements);
export const selectRecycleBinSchema = createSelectSchema(recycleBin);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;
export type Statement = typeof statements.$inferSelect;
export type InsertStatement = typeof statements.$inferInsert;
export type RecycleBinItem = typeof recycleBin.$inferSelect;
export type InsertRecycleBinItem = typeof recycleBin.$inferInsert;

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export type DocumentType = 'invoice' | 'quote' | 'statement';
