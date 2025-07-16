import { Express } from "express";
import { db } from "./db";
import { customers, products, invoices, quotes, statements, companies, recycleBin, users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import multer from "multer";
import Papa from "papaparse";
import Stripe from "stripe";
import { storage } from "./storage";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});

export async function setupRoutes(app: Express) {
  
  // Customers routes
  app.get('/api/customers', async (req, res) => {
    try {
      const uid = req.query.uid as string;
      if (!uid) {
        return res.status(400).json({ error: 'uid is required' });
      }
      
      const result = await db.select().from(customers)
        .where(and(eq(customers.uid, uid), eq(customers.isDeleted, false)))
        .orderBy(desc(customers.createdAt));
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const [customer] = await db.insert(customers).values(req.body).returning();
      res.json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [customer] = await db.update(customers)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(customers.id, id))
        .returning();
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // First, get the customer data before soft deleting
      const [customer] = await db.select().from(customers).where(eq(customers.id, id));
      
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Add to recycle bin
      await db.insert(recycleBin).values({
        uid: customer.uid,
        type: 'customer',
        originalId: id,
        data: customer,
        deletedAt: new Date()
      });

      // Soft delete the customer
      const [deletedCustomer] = await db.update(customers)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(customers.id, id))
        .returning();
      
      res.json(deletedCustomer);
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  });

  // Products routes
  app.get('/api/products', async (req, res) => {
    try {
      const uid = req.query.uid as string;
      if (!uid) {
        return res.status(400).json({ error: 'uid is required' });
      }
      
      const result = await db.select().from(products)
        .where(and(eq(products.uid, uid), eq(products.isDeleted, false)))
        .orderBy(desc(products.createdAt));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const [product] = await db.insert(products).values(req.body).returning();
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [product] = await db.update(products)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [product] = await db.update(products)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Companies routes
  app.get('/api/companies', async (req, res) => {
    try {
      const uid = req.query.uid as string;
      if (!uid) {
        return res.status(400).json({ error: 'uid is required' });
      }
      
      const result = await db.select().from(companies)
        .where(eq(companies.uid, uid))
        .orderBy(desc(companies.createdAt));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  });

  app.post('/api/companies', async (req, res) => {
    try {
      const [company] = await db.insert(companies).values(req.body).returning();
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create company' });
    }
  });

  app.put('/api/companies/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [company] = await db.update(companies)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(companies.id, id))
        .returning();
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update company' });
    }
  });

  // Invoices routes
  app.get('/api/invoices', async (req, res) => {
    try {
      const uid = req.query.uid as string;
      if (!uid) {
        return res.status(400).json({ error: 'uid is required' });
      }
      
      const result = await db.select().from(invoices)
        .where(and(eq(invoices.uid, uid), eq(invoices.isDeleted, false)))
        .orderBy(desc(invoices.createdAt));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  app.post('/api/invoices', async (req, res) => {
    try {
      console.log('Creating invoice with data:', JSON.stringify(req.body, null, 2));
      
      // Parse date strings to Date objects for PostgreSQL
      // Remove any fields that shouldn't be in the insert
      const { createdAt, updatedAt, ...bodyData } = req.body;
      
      // Generate sequential invoice number starting from 100000
      const existingInvoices = await db.select().from(invoices)
        .where(eq(invoices.uid, bodyData.uid))
        .orderBy(desc(invoices.id));
      
      // Find the highest number from INV-100000 format only, ignore old format
      const newFormatNumbers = existingInvoices
        .map(inv => {
          const match = inv.number.match(/INV-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            return num >= 100000 ? num : null; // Only count numbers >= 100000
          }
          return null;
        })
        .filter(num => num !== null);
      
      const nextNumber = newFormatNumbers.length > 0 ? 
        Math.max(...newFormatNumbers) + 1 : 100000;
      
      const invoiceData = {
        ...bodyData,
        number: `INV-${nextNumber}`,
        date: new Date(bodyData.date),
        dueDate: new Date(bodyData.dueDate)
      };
      
      const [invoice] = await db.insert(invoices).values(invoiceData).returning();
      console.log('Invoice created successfully:', invoice);
      
      // If this invoice was created from a quote, mark the quote as converted
      if (bodyData.quoteId) {
        await db.update(quotes)
          .set({ status: 'converted', updatedAt: new Date() })
          .where(eq(quotes.id, bodyData.quoteId));
        console.log('Quote marked as converted:', bodyData.quoteId);
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      console.error('Error details:', (error as Error).message);
      res.status(500).json({ error: 'Failed to create invoice', details: (error as Error).message });
    }
  });

  app.put('/api/invoices/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [invoice] = await db.update(invoices)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(invoices.id, id))
        .returning();
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  });

  app.delete('/api/invoices/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // First, get the invoice data before soft deleting
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Add to recycle bin
      await db.insert(recycleBin).values({
        uid: invoice.uid,
        type: 'invoice',
        originalId: id,
        data: invoice,
        deletedAt: new Date()
      });

      // Soft delete the invoice
      const [deletedInvoice] = await db.update(invoices)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(invoices.id, id))
        .returning();
      
      res.json(deletedInvoice);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      res.status(500).json({ error: 'Failed to delete invoice' });
    }
  });

  // Quotes routes
  app.get('/api/quotes', async (req, res) => {
    try {
      const uid = req.query.uid as string;
      if (!uid) {
        return res.status(400).json({ error: 'uid is required' });
      }
      
      const result = await db.select().from(quotes)
        .where(and(eq(quotes.uid, uid), eq(quotes.isDeleted, false)))
        .orderBy(desc(quotes.createdAt));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  });

  app.post('/api/quotes', async (req, res) => {
    try {
      console.log('Creating quote with data:', JSON.stringify(req.body, null, 2));
      
      // Parse date strings to Date objects for PostgreSQL
      // Remove any fields that shouldn't be in the insert
      const { createdAt, updatedAt, ...bodyData } = req.body;
      
      // Generate sequential quote number starting from 100000
      const existingQuotes = await db.select().from(quotes)
        .where(eq(quotes.uid, bodyData.uid))
        .orderBy(desc(quotes.id));
      
      // Find the highest number from QUO-100000 format only, ignore old format
      const newFormatNumbers = existingQuotes
        .map(quote => {
          const match = quote.number.match(/QUO-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            return num >= 100000 ? num : null; // Only count numbers >= 100000
          }
          return null;
        })
        .filter(num => num !== null);
      
      const nextNumber = newFormatNumbers.length > 0 ? 
        Math.max(...newFormatNumbers) + 1 : 100000;
      
      const quoteData = {
        ...bodyData,
        number: `QUO-${nextNumber}`,
        date: new Date(bodyData.date),
        validUntil: new Date(bodyData.validUntil)
      };
      
      console.log('Processed quote data:', JSON.stringify(quoteData, null, 2));
      console.log('Date field type:', typeof quoteData.date, quoteData.date instanceof Date);
      console.log('ValidUntil field type:', typeof quoteData.validUntil, quoteData.validUntil instanceof Date);
      
      const [quote] = await db.insert(quotes).values(quoteData).returning();
      console.log('Quote created successfully:', quote);
      res.json(quote);
    } catch (error) {
      console.error('Error creating quote:', error);
      console.error('Error details:', (error as Error).message);
      console.error('Error stack:', (error as Error).stack);
      res.status(500).json({ error: 'Failed to create quote', details: (error as Error).message });
    }
  });

  app.put('/api/quotes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [quote] = await db.update(quotes)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(quotes.id, id))
        .returning();
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update quote' });
    }
  });

  app.delete('/api/quotes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // First, get the quote data before soft deleting
      const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
      
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Add to recycle bin
      await db.insert(recycleBin).values({
        uid: quote.uid,
        type: 'quote',
        originalId: id,
        data: quote,
        deletedAt: new Date()
      });

      // Soft delete the quote
      const [deletedQuote] = await db.update(quotes)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(quotes.id, id))
        .returning();
      
      res.json(deletedQuote);
    } catch (error) {
      console.error('Error deleting quote:', error);
      res.status(500).json({ error: 'Failed to delete quote' });
    }
  });

  // Statements routes
  app.get('/api/statements', async (req, res) => {
    try {
      const uid = req.query.uid as string;
      if (!uid) {
        return res.status(400).json({ error: 'uid is required' });
      }
      
      const result = await db.select().from(statements)
        .where(and(eq(statements.uid, uid), eq(statements.isDeleted, false)))
        .orderBy(desc(statements.createdAt));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch statements' });
    }
  });

  app.post('/api/statements', async (req, res) => {
    try {
      console.log('Creating statement with data:', req.body);
      
      // Generate statement number
      const existingStatements = await db.select({ number: statements.number })
        .from(statements)
        .where(eq(statements.uid, req.body.uid))
        .orderBy(desc(statements.createdAt));
      
      // Find the highest number >= 100000 for this user
      let nextNumber = 100000;
      if (existingStatements.length > 0) {
        for (const stmt of existingStatements) {
          if (stmt.number && stmt.number.startsWith('STM-')) {
            const numberPart = parseInt(stmt.number.substring(4));
            if (numberPart >= 100000 && numberPart >= nextNumber) {
              nextNumber = numberPart + 1;
            }
          }
        }
      }
      
      const statementNumber = `STM-${nextNumber}`;
      
      const statementData = {
        uid: req.body.uid,
        number: statementNumber,
        customerId: req.body.customerId,
        customerName: req.body.customerName,
        date: new Date(req.body.date),
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        period: req.body.period,
        notes: req.body.notes || '',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Processed statement data:', statementData);
      
      const [statement] = await db.insert(statements).values(statementData).returning();
      console.log('Statement created successfully:', statement);
      res.json(statement);
    } catch (error) {
      console.error('Error creating statement:', error);
      res.status(500).json({ error: 'Failed to create statement' });
    }
  });

  app.put('/api/statements/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [statement] = await db.update(statements)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(statements.id, id))
        .returning();
      res.json(statement);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update statement' });
    }
  });

  app.delete('/api/statements/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [statement] = await db.update(statements)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(statements.id, id))
        .returning();
      res.json(statement);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete statement' });
    }
  });

  // Recycle bin routes
  app.get('/api/recycle-bin', async (req, res) => {
    try {
      const uid = req.query.uid as string;
      if (!uid) {
        return res.status(400).json({ error: 'uid is required' });
      }
      
      const result = await db.select().from(recycleBin)
        .where(eq(recycleBin.uid, uid))
        .orderBy(desc(recycleBin.deletedAt));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recycle bin items' });
    }
  });

  app.post('/api/recycle-bin', async (req, res) => {
    try {
      const [item] = await db.insert(recycleBin).values(req.body).returning();
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create recycle bin item' });
    }
  });

  app.delete('/api/recycle-bin/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(recycleBin).where(eq(recycleBin.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete recycle bin item' });
    }
  });

  // User management routes for admin panel
  app.get('/api/users', async (req, res) => {
    try {
      const result = await db.select().from(users)
        .orderBy(desc(users.createdAt));
      res.json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const userData = {
        ...req.body,
        trialStartDate: new Date(req.body.trialStartDate),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Handle subscriptionEndDate if provided
      if (req.body.subscriptionEndDate) {
        userData.subscriptionEndDate = new Date(req.body.subscriptionEndDate);
      }
      
      const [user] = await db.insert(users).values(userData).returning();
      res.json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.put('/api/users/:uid', async (req, res) => {
    try {
      const uid = req.params.uid;
      const [user] = await db.update(users)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(users.uid, uid))
        .returning();
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.delete('/api/users/:uid', async (req, res) => {
    try {
      const uid = req.params.uid;
      await db.delete(users).where(eq(users.uid, uid));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // CSV Upload endpoint
  app.post('/api/csv-upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { type, userId } = req.body;
      const csvData = req.file.buffer.toString('utf8');

      // Parse CSV data
      const parseResult = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => value.trim()
      });

      if (parseResult.errors.length > 0) {
        return res.status(400).json({ 
          error: 'CSV parsing failed', 
          details: parseResult.errors 
        });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const [index, row] of parseResult.data.entries()) {
        try {
          if (type === 'customers') {
            // Validate customer data
            const customerData = row as any;
            if (!customerData.name || !customerData.email) {
              throw new Error(`Row ${index + 1}: Name and email are required`);
            }

            // Insert customer
            await db.insert(customers).values({
              uid: userId,
              name: customerData.name,
              email: customerData.email,
              phone: customerData.phone || '',
              address: customerData.address || '',
              city: customerData.city || '',
              country: customerData.country || '',
              taxNumber: customerData.taxNumber || '',
              createdAt: new Date(),
              updatedAt: new Date(),
              isDeleted: false
            });

            successCount++;
          } else if (type === 'products') {
            // Validate product data
            const productData = row as any;
            if (!productData.name || !productData.description || !productData.unitPrice || !productData.taxRate) {
              throw new Error(`Row ${index + 1}: Name, description, unitPrice, and taxRate are required`);
            }

            const unitPrice = parseFloat(productData.unitPrice);
            const taxRate = parseFloat(productData.taxRate);

            if (isNaN(unitPrice) || isNaN(taxRate)) {
              throw new Error(`Row ${index + 1}: unitPrice and taxRate must be valid numbers`);
            }

            // Insert product
            await db.insert(products).values({
              uid: userId,
              name: productData.name,
              description: productData.description,
              unitPrice: unitPrice,
              taxRate: taxRate,
              category: productData.category || '',
              createdAt: new Date(),
              updatedAt: new Date(),
              isDeleted: false
            });

            successCount++;
          }
        } catch (error) {
          errorCount++;
          errors.push(error.message);
          console.error(`CSV import error for row ${index + 1}:`, error);
        }
      }

      res.json({
        success: true,
        successCount,
        errorCount,
        errors: errors.slice(0, 10), // Limit error messages
        message: `Successfully imported ${successCount} items. ${errorCount} errors encountered.`
      });

    } catch (error) {
      console.error('CSV upload error:', error);
      res.status(500).json({ error: 'Failed to process CSV upload' });
    }
  });

  // User synchronization endpoint
  app.post('/api/sync-user', async (req, res) => {
    try {
      const { uid, email, firstName, lastName, companyName, displayName } = req.body;
      
      if (!uid || !email) {
        return res.status(400).json({ error: 'uid and email are required' });
      }

      let user = await storage.getUser(uid);
      if (!user) {
        // Create user in PostgreSQL if not exists
        const userData = {
          uid,
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          companyName: companyName || '',
          displayName: displayName || email,
          trialStartDate: new Date(),
          isSubscriber: false,
          isSuspended: false,
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        user = await storage.createUser(userData);
      }

      res.json(user);
    } catch (error) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  // Stripe subscription endpoints
  
  // Create or retrieve subscription
  app.post('/api/create-subscription', async (req, res) => {
    try {
      const { uid, email, firstName, lastName } = req.body;
      
      if (!uid || !email) {
        return res.status(400).json({ error: 'uid and email are required' });
      }

      let user = await storage.getUser(uid);
      console.log('Create subscription - looking for user:', uid, 'found:', !!user);
      
      if (!user) {
        console.log('User not found, creating new user with data:', { uid, email, firstName, lastName });
        // Auto-create user if not exists
        const userData = {
          uid,
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          companyName: '',
          displayName: `${firstName || ''} ${lastName || ''}`.trim() || email,
          trialStartDate: new Date(),
          isSubscriber: false,
          isSuspended: false,
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        try {
          user = await storage.createUser(userData);
          console.log('User created successfully:', user);
        } catch (createError) {
          console.error('Error creating user:', createError);
          return res.status(500).json({ error: 'Failed to create user' });
        }
      }

      // If user already has a subscription, return existing subscription info
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
          const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
          if (latestInvoice.payment_intent && typeof latestInvoice.payment_intent === 'object') {
            const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;
            return res.json({
              subscriptionId: subscription.id,
              clientSecret: paymentIntent.client_secret,
              status: subscription.status
            });
          }
        }
      }

      // Create Stripe customer if not exists
      let stripeCustomer;
      if (user.stripeCustomerId) {
        stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        stripeCustomer = await stripe.customers.create({
          email: email,
          name: `${firstName} ${lastName}`,
          metadata: {
            uid: uid
          }
        });
      }

      // First create a product
      const product = await stripe.products.create({
        name: 'Eazee Invoice Pro',
        description: 'Monthly subscription to Eazee Invoice Pro'
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{
          price_data: {
            currency: 'gbp',
            product: product.id,
            unit_amount: 1999, // £19.99 in pence
            recurring: {
              interval: 'month'
            }
          }
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      // Update user with Stripe info
      await storage.updateUserStripeInfo(uid, stripeCustomer.id, subscription.id);

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        status: subscription.status
      });

    } catch (error) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ error: 'Failed to create subscription: ' + error.message });
    }
  });

  // Stripe webhook endpoint
  app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // In production, you should set STRIPE_WEBHOOK_SECRET
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if (customer && !customer.deleted && customer.metadata?.uid) {
          await storage.updateUserSubscriptionStatus(
            customer.metadata.uid,
            subscription.status,
            new Date(subscription.current_period_end * 1000)
          );
        }
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const deletedCustomer = await stripe.customers.retrieve(deletedSubscription.customer as string);
        
        if (deletedCustomer && !deletedCustomer.deleted && deletedCustomer.metadata?.uid) {
          await storage.updateUserSubscriptionStatus(
            deletedCustomer.metadata.uid,
            'canceled'
          );
        }
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const invoiceSubscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const invoiceCustomer = await stripe.customers.retrieve(invoiceSubscription.customer as string);
          
          if (invoiceCustomer && !invoiceCustomer.deleted && invoiceCustomer.metadata?.uid) {
            await storage.updateUserSubscriptionStatus(
              invoiceCustomer.metadata.uid,
              invoiceSubscription.status,
              new Date(invoiceSubscription.current_period_end * 1000)
            );
          }
        }
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        if (failedInvoice.subscription) {
          const failedSubscription = await stripe.subscriptions.retrieve(failedInvoice.subscription as string);
          const failedCustomer = await stripe.customers.retrieve(failedSubscription.customer as string);
          
          if (failedCustomer && !failedCustomer.deleted && failedCustomer.metadata?.uid) {
            await storage.updateUserSubscriptionStatus(
              failedCustomer.metadata.uid,
              'past_due',
              new Date(failedSubscription.current_period_end * 1000)
            );
          }
        }
        break;
    }

    res.json({ received: true });
  });

  // Get user subscription status
  app.get('/api/subscription-status', async (req, res) => {
    try {
      const uid = req.query.uid as string;
      if (!uid) {
        return res.status(400).json({ error: 'uid is required' });
      }

      let user = await storage.getUser(uid);
      console.log('Subscription status - looking for user:', uid, 'found:', !!user);
      
      if (!user) {
        console.log('User not found in subscription status, creating minimal user');
        // Auto-create user if not exists - this can happen during authentication
        const userData = {
          uid,
          email: '', // Will be updated when more info is available
          firstName: '',
          lastName: '',
          companyName: '',
          displayName: 'User',
          trialStartDate: new Date(),
          isSubscriber: false,
          isSuspended: false,
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        try {
          user = await storage.createUser(userData);
          console.log('Minimal user created successfully:', user);
        } catch (createError) {
          console.error('Error creating minimal user:', createError);
          return res.status(500).json({ error: 'Failed to create user' });
        }
      }

      let subscriptionInfo = {
        isSubscriber: user.isSubscriber,
        status: user.subscriptionStatus,
        currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId
      };

      // If user has a Stripe subscription, get latest info
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          subscriptionInfo.status = subscription.status;
          subscriptionInfo.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          subscriptionInfo.isSubscriber = subscription.status === 'active';
          
          // Update database with latest info
          await storage.updateUserSubscriptionStatus(
            uid,
            subscription.status,
            new Date(subscription.current_period_end * 1000)
          );
        } catch (error) {
          console.error('Error fetching subscription from Stripe:', error);
        }
      }

      res.json(subscriptionInfo);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
  });

  // Fake payment endpoint for testing
  app.post('/api/fake-payment', async (req, res) => {
    try {
      const { uid } = req.body;
      
      if (!uid) {
        return res.status(400).json({ error: 'uid is required' });
      }

      const user = await storage.getUser(uid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Simulate successful payment by updating user subscription status
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // Add 1 month

      await storage.updateUserSubscriptionStatus(uid, 'active', currentPeriodEnd);

      res.json({ 
        success: true, 
        message: 'Fake payment successful - subscription activated',
        status: 'active',
        currentPeriodEnd: currentPeriodEnd
      });

    } catch (error) {
      console.error('Error processing fake payment:', error);
      res.status(500).json({ error: 'Failed to process fake payment' });
    }
  });

  // Cancel subscription
  app.post('/api/cancel-subscription', async (req, res) => {
    try {
      const { uid } = req.body;
      
      if (!uid) {
        return res.status(400).json({ error: 'uid is required' });
      }

      const user = await storage.getUser(uid);
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ error: 'No subscription found' });
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      await storage.updateUserSubscriptionStatus(
        uid,
        subscription.status,
        new Date(subscription.current_period_end * 1000)
      );

      res.json({ 
        success: true, 
        message: 'Subscription will be canceled at the end of the current period',
        cancelAt: new Date(subscription.current_period_end * 1000)
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });
}