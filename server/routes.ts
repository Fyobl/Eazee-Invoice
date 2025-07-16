import { Express } from "express";
import { db } from "./db";
import { customers, products, invoices, quotes, statements, companies, recycleBin, users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

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
      const [user] = await db.insert(users).values(req.body).returning();
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
}