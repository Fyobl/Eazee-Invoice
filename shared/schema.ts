import { pgTable, text, timestamp, boolean, serial, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  companyName: text('company_name').notNull(),
  displayName: text('display_name'),
  trialStartDate: timestamp('trial_start_date').notNull(),
  isSubscriber: boolean('is_subscriber').default(false),
  isSuspended: boolean('is_suspended').default(false),
  isAdmin: boolean('is_admin').default(false),
  mustChangePassword: boolean('must_change_password').default(false),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  subscriptionStatus: text('subscription_status'),
  subscriptionCurrentPeriodEnd: timestamp('subscription_current_period_end'),
  subscriptionStartDate: timestamp('subscription_start_date'),
  lastLoginDate: timestamp('last_login_date'),
  isAdminGrantedSubscription: boolean('is_admin_granted_subscription').default(false),
  // Company branding fields
  companyLogo: text('company_logo'),
  companyAddress: text('company_address'),
  companyPhone: text('company_phone'),
  companyEmail: text('company_email'),
  companyVatNumber: text('company_vat_number'),
  companyRegistrationNumber: text('company_registration_number'),
  currency: text('currency').notNull().default('GBP'),
  dateFormat: text('date_format').notNull().default('DD/MM/YYYY'),
  country: text('country').default('GB'), // ISO country code
  // Bank details fields
  bankName: text('bank_name'),
  bankAccountName: text('bank_account_name'),
  bankAccountNumber: text('bank_account_number'),
  bankSortCode: text('bank_sort_code'),
  // Email sending fields
  senderEmail: text('sender_email'),
  isEmailVerified: boolean('is_email_verified').default(false),
  emailVerificationStatus: text('email_verification_status'), // pending, verified, failed
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  sid: text('sid').primaryKey(),
  sess: jsonb('sess').notNull(),
  expire: timestamp('expire').notNull(),
});

export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const onboardingProgress = pgTable('onboarding_progress', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  companyBrandingComplete: boolean('company_branding_complete').default(false),
  logoUploaded: boolean('logo_uploaded').default(false),
  firstCustomerAdded: boolean('first_customer_added').default(false),
  firstProductAdded: boolean('first_product_added').default(false),
  firstQuoteCreated: boolean('first_quote_created').default(false),
  firstInvoiceCreated: boolean('first_invoice_created').default(false),
  firstQuoteConverted: boolean('first_quote_converted').default(false),
  isOnboardingDismissed: boolean('is_onboarding_dismissed').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});



export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  name: text('name').notNull(), // Business Name
  contactName: text('contact_name'), // Contact Name
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address').notNull(), // Keep for backward compatibility
  addressLine1: text('address_line_1'),
  addressLine2: text('address_line_2'),
  town: text('town'),
  county: text('county'),
  postCode: text('post_code'),
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

export const statementInvoices = pgTable('statement_invoices', {
  id: serial('id').primaryKey(),
  statementId: text('statement_id').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  invoiceDate: timestamp('invoice_date').notNull(),
  invoiceDueDate: timestamp('invoice_due_date').notNull(),
  invoiceAmount: decimal('invoice_amount', { precision: 10, scale: 2 }).notNull(),
  invoiceStatus: text('invoice_status').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const recycleBin = pgTable('recycle_bin', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  originalId: text('original_id').notNull(),
  type: text('type').notNull(),
  data: jsonb('data').notNull(),
  deletedAt: timestamp('deleted_at').notNull().defaultNow(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  customers: many(customers),
  products: many(products),
  invoices: many(invoices),
  quotes: many(quotes),
  statements: many(statements),
  onboardingProgress: one(onboardingProgress),
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

export const statementsRelations = relations(statements, ({ one, many }) => ({
  user: one(users, { fields: [statements.uid], references: [users.uid] }),
  statementInvoices: many(statementInvoices),
}));

export const statementInvoicesRelations = relations(statementInvoices, ({ one }) => ({
  statement: one(statements, { fields: [statementInvoices.statementId], references: [statements.id] }),
}));

export const onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  user: one(users, { fields: [onboardingProgress.uid], references: [users.uid] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertProductSchema = createInsertSchema(products);
export const insertInvoiceSchema = createInsertSchema(invoices);
export const insertQuoteSchema = createInsertSchema(quotes);
export const insertStatementSchema = createInsertSchema(statements);
export const insertStatementInvoiceSchema = createInsertSchema(statementInvoices);
export const insertRecycleBinSchema = createInsertSchema(recycleBin);
export const insertSessionSchema = createInsertSchema(sessions);
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);
export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress);

// Select schemas
export const selectUserSchema = createSelectSchema(users);
export const selectCustomerSchema = createSelectSchema(customers);
export const selectProductSchema = createSelectSchema(products);
export const selectInvoiceSchema = createSelectSchema(invoices);
export const selectQuoteSchema = createSelectSchema(quotes);
export const selectStatementSchema = createSelectSchema(statements);
export const selectStatementInvoiceSchema = createSelectSchema(statementInvoices);
export const selectRecycleBinSchema = createSelectSchema(recycleBin);
export const selectSessionSchema = createSelectSchema(sessions);
export const selectPasswordResetTokenSchema = createSelectSchema(passwordResetTokens);
export const selectOnboardingProgressSchema = createSelectSchema(onboardingProgress);
export const insertSystemSettingSchema = createInsertSchema(systemSettings);
export const selectSystemSettingSchema = createSelectSchema(systemSettings);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
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
export type StatementInvoice = typeof statementInvoices.$inferSelect;
export type InsertStatementInvoice = typeof statementInvoices.$inferInsert;
export type RecycleBinItem = typeof recycleBin.$inferSelect;
export type InsertRecycleBinItem = typeof recycleBin.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = typeof onboardingProgress.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

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
