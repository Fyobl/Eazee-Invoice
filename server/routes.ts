import { Express } from "express";
import { db } from "./db";
import { customers, products, invoices, quotes, statements, companies, recycleBin } from "@shared/schema";
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
      const [customer] = await db.update(customers)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(customers.id, id))
        .returning();
      res.json(customer);
    } catch (error) {
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
      
      const nextNumber = existingInvoices.length > 0 ? 
        Math.max(...existingInvoices.map(inv => {
          const match = inv.number.match(/INV-(\d+)/);
          return match ? parseInt(match[1]) : 99999;
        })) + 1 : 100000;
      
      const invoiceData = {
        ...bodyData,
        number: `INV-${nextNumber}`,
        date: new Date(bodyData.date),
        dueDate: new Date(bodyData.dueDate)
      };
      
      const [invoice] = await db.insert(invoices).values(invoiceData).returning();
      console.log('Invoice created successfully:', invoice);
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
      const [invoice] = await db.update(invoices)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(invoices.id, id))
        .returning();
      res.json(invoice);
    } catch (error) {
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
      
      const nextNumber = existingQuotes.length > 0 ? 
        Math.max(...existingQuotes.map(quote => {
          const match = quote.number.match(/QUO-(\d+)/);
          return match ? parseInt(match[1]) : 99999;
        })) + 1 : 100000;
      
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
      const [quote] = await db.update(quotes)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(eq(quotes.id, id))
        .returning();
      res.json(quote);
    } catch (error) {
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
      const [statement] = await db.insert(statements).values(req.body).returning();
      res.json(statement);
    } catch (error) {
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
}