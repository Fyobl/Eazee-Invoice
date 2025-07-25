import { Express, Request, Response, NextFunction } from "express";
import { db, executeWithRetry } from "./db";
import { customers, products, invoices, quotes, statements, recycleBin, users, type User } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import multer from "multer";
import Papa from "papaparse";
import Stripe from "stripe";
import { storage } from "./storage";

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: User;
}

const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const sessionId = req.session?.userId;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const user = await storage.getUser(sessionId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  if (user.isSuspended) {
    return res.status(403).json({ error: 'Account suspended' });
  }
  
  req.user = user;
  next();
};

const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

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
  
  // Authentication routes
  app.post('/api/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, companyName } = req.body;
      
      if (!email || !password || !firstName || !lastName || !companyName) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }
      
      const user = await storage.registerUser(email, password, firstName, lastName, companyName);
      
      // Create session
      req.session.userId = user.uid;
      
      res.json({ user: { ...user, passwordHash: undefined } });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });
  
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const user = await storage.loginUser(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Set session
      req.session.userId = user.uid;
      
      res.json({ user: { ...user, passwordHash: undefined } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });
  
  app.post('/api/logout', async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });
  
  app.post('/api/change-password', requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new passwords are required' });
      }
      
      const success = await storage.updatePassword(req.user!.uid, currentPassword, newPassword);
      if (!success) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Password change failed' });
    }
  });
  
  app.post('/api/delete-account', requireAuth, async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }
      
      // For now, we'll just return success as account deletion isn't implemented
      // In a real app, you'd verify password and delete the account
      res.json({ success: true });
    } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({ error: 'Account deletion failed' });
    }
  });
  
  app.get('/api/me', requireAuth, async (req, res) => {
    res.json({ user: { ...req.user!, passwordHash: undefined } });
  });
  
  // Customers routes
  app.get('/api/customers', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await db.select().from(customers)
        .where(and(eq(customers.uid, req.user!.uid), eq(customers.isDeleted, false)))
        .orderBy(desc(customers.createdAt));
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  app.post('/api/customers', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const customerData = {
        ...req.body,
        uid: req.user!.uid
      };
      const [customer] = await db.insert(customers).values(customerData).returning();
      res.json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  });

  app.put('/api/customers/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const [customer] = await db.update(customers)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(customers.id, id), eq(customers.uid, req.user!.uid)))
        .returning();
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  app.delete('/api/customers/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // First, get the customer data before soft deleting
      const [customer] = await db.select().from(customers)
        .where(and(eq(customers.id, id), eq(customers.uid, req.user!.uid)));
      
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
        .where(and(eq(customers.id, id), eq(customers.uid, req.user!.uid)))
        .returning();
      
      res.json(deletedCustomer);
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  });

  // Products routes
  app.get('/api/products', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await db.select().from(products)
        .where(and(eq(products.uid, req.user!.uid), eq(products.isDeleted, false)))
        .orderBy(desc(products.createdAt));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.post('/api/products', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const productData = {
        ...req.body,
        uid: req.user!.uid
      };
      const [product] = await db.insert(products).values(productData).returning();
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const [product] = await db.update(products)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(products.id, id), eq(products.uid, req.user!.uid)))
        .returning();
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const [product] = await db.update(products)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(and(eq(products.id, id), eq(products.uid, req.user!.uid)))
        .returning();
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Invoices routes
  app.get('/api/invoices', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await db.select().from(invoices)
        .where(and(eq(invoices.uid, req.user!.uid), eq(invoices.isDeleted, false)))
        .orderBy(desc(invoices.createdAt));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  app.post('/api/invoices', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('Creating invoice with data:', JSON.stringify(req.body, null, 2));
      
      // Parse date strings to Date objects for PostgreSQL
      // Remove any fields that shouldn't be in the insert
      const { createdAt, updatedAt, ...bodyData } = req.body;
      
      // Generate sequential invoice number starting from 100000
      const existingInvoices = await db.select().from(invoices)
        .where(eq(invoices.uid, req.user!.uid))
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
        uid: req.user!.uid,
        number: `INV-${nextNumber}`,
        date: new Date(bodyData.date),
        dueDate: new Date(bodyData.dueDate)
      };
      
      const [invoice] = await db.insert(invoices).values(invoiceData).returning();
      console.log('Invoice created successfully:', invoice);
      
      // If this invoice was created from a quote, mark the quote as converted
      if (bodyData.quoteId) {
        await db.update(quotes)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(quotes.id, bodyData.quoteId));
        console.log('Quote marked as accepted:', bodyData.quoteId);
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      console.error('Error details:', (error as Error).message);
      res.status(500).json({ error: 'Failed to create invoice', details: (error as Error).message });
    }
  });

  app.put('/api/invoices/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const [invoice] = await db.update(invoices)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(invoices.id, id), eq(invoices.uid, req.user!.uid)))
        .returning();
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  });

  app.delete('/api/invoices/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // First, get the invoice data before soft deleting
      const [invoice] = await db.select().from(invoices)
        .where(and(eq(invoices.id, id), eq(invoices.uid, req.user!.uid)));
      
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
        .where(and(eq(invoices.id, id), eq(invoices.uid, req.user!.uid)))
        .returning();
      
      res.json(deletedInvoice);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      res.status(500).json({ error: 'Failed to delete invoice' });
    }
  });

  // Quotes routes
  app.get('/api/quotes', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await db.select().from(quotes)
        .where(and(eq(quotes.uid, req.user!.uid), eq(quotes.isDeleted, false)))
        .orderBy(desc(quotes.createdAt));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  });

  app.post('/api/quotes', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('Creating quote with data:', JSON.stringify(req.body, null, 2));
      
      // Parse date strings to Date objects for PostgreSQL
      // Remove any fields that shouldn't be in the insert
      const { createdAt, updatedAt, ...bodyData } = req.body;
      
      // Generate sequential quote number starting from 100000
      const existingQuotes = await db.select().from(quotes)
        .where(eq(quotes.uid, req.user!.uid))
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
        uid: req.user!.uid,
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

  app.put('/api/quotes/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const [quote] = await db.update(quotes)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(quotes.id, id), eq(quotes.uid, req.user!.uid)))
        .returning();
      res.json(quote);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update quote' });
    }
  });

  app.delete('/api/quotes/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // First, get the quote data before soft deleting
      const [quote] = await db.select().from(quotes)
        .where(and(eq(quotes.id, id), eq(quotes.uid, req.user!.uid)));
      
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
        .where(and(eq(quotes.id, id), eq(quotes.uid, req.user!.uid)))
        .returning();
      
      res.json(deletedQuote);
    } catch (error) {
      console.error('Error deleting quote:', error);
      res.status(500).json({ error: 'Failed to delete quote' });
    }
  });

  // Statements routes
  app.get('/api/statements', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await db.select().from(statements)
        .where(and(eq(statements.uid, req.user!.uid), eq(statements.isDeleted, false)))
        .orderBy(desc(statements.createdAt));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch statements' });
    }
  });

  app.post('/api/statements', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('Creating statement with data:', req.body);
      
      // Generate statement number
      const existingStatements = await db.select({ number: statements.number })
        .from(statements)
        .where(eq(statements.uid, req.user!.uid))
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
        uid: req.user!.uid,
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

  app.put('/api/statements/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const [statement] = await db.update(statements)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(statements.id, id), eq(statements.uid, req.user!.uid)))
        .returning();
      res.json(statement);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update statement' });
    }
  });

  app.delete('/api/statements/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const [statement] = await db.update(statements)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(and(eq(statements.id, id), eq(statements.uid, req.user!.uid)))
        .returning();
      res.json(statement);
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete statement' });
    }
  });

  // Recycle bin routes
  app.get('/api/recycle-bin', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await db.select().from(recycleBin)
        .where(eq(recycleBin.uid, req.user!.uid))
        .orderBy(desc(recycleBin.deletedAt));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recycle bin items' });
    }
  });

  app.post('/api/recycle-bin', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const itemData = {
        ...req.body,
        uid: req.user!.uid
      };
      const [item] = await db.insert(recycleBin).values(itemData).returning();
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create recycle bin item' });
    }
  });

  app.delete('/api/recycle-bin/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(recycleBin).where(and(eq(recycleBin.id, id), eq(recycleBin.uid, req.user!.uid)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete recycle bin item' });
    }
  });

  // User management routes for admin panel
  app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = await db.select().from(users)
        .orderBy(desc(users.createdAt));
      res.json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { email, password, firstName, lastName, companyName, isSubscriber, subscriptionEndDate } = req.body;
      
      if (!email || !password || !firstName || !lastName || !companyName) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }
      
      // Create user using storage interface for proper password hashing
      const user = await storage.registerUser(email, password, firstName, lastName, companyName);
      
      // Update additional fields for admin-created users
      const updateData: any = {
        mustChangePassword: true  // Force password change for admin-created users
      };
      if (isSubscriber) {
        updateData.isSubscriber = isSubscriber;
        updateData.isAdminGrantedSubscription = true;  // Mark as admin-granted subscription
      }
      if (subscriptionEndDate) updateData.subscriptionCurrentPeriodEnd = new Date(subscriptionEndDate);
      
      const [updatedUser] = await db.update(users)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(users.uid, user.uid))
        .returning();
      res.json(updatedUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.put('/api/users/:uid', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const uid = req.params.uid;
      const updateData = { ...req.body, updatedAt: new Date() };
      
      // Check if user is updating their own profile or if they're an admin
      if (req.user!.uid !== uid && !req.user!.isAdmin) {
        return res.status(403).json({ error: 'You can only update your own profile' });
      }
      
      // Convert date strings to Date objects for timestamp fields
      const dateFields = ['subscriptionCurrentPeriodEnd', 'trialStartDate', 'createdAt', 'updatedAt'];
      for (const field of dateFields) {
        if (updateData[field] && typeof updateData[field] === 'string') {
          updateData[field] = new Date(updateData[field]);
        }
      }
      
      const [user] = await db.update(users)
        .set(updateData)
        .where(eq(users.uid, uid))
        .returning();
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.delete('/api/users/:uid', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const uid = req.params.uid;
      
      // Prevent admin from deleting themselves
      if (req.user?.uid === uid) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }
      
      const success = await storage.deleteUser(uid);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to delete user' });
      }
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

            // Additional validation
            if (!customerData.name.trim()) {
              throw new Error(`Row ${index + 1}: Name cannot be empty`);
            }
            
            if (!customerData.email.trim()) {
              throw new Error(`Row ${index + 1}: Email cannot be empty`);
            }

            // Insert customer
            await db.insert(customers).values({
              uid: userId,
              name: customerData.name.trim(),
              email: customerData.email.trim(),
              phone: customerData.phone?.trim() || '',
              address: customerData.address?.trim() || '',
              city: customerData.city?.trim() || '',
              country: customerData.country?.trim() || '',
              taxNumber: customerData.taxNumber?.trim() || '',
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
      } else {
        // Update subscription status based on current time
        const now = new Date();
        const hasActiveSubscription = user.subscriptionCurrentPeriodEnd && 
          new Date(user.subscriptionCurrentPeriodEnd) > now;
        
        // Only update if subscription status has changed
        if (user.isSubscriber !== hasActiveSubscription) {
          user = await storage.updateUserSubscriptionStatus(
            uid, 
            hasActiveSubscription ? 'active' : 'expired', 
            user.subscriptionCurrentPeriodEnd
          );
        }
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

      // Check if subscription is still active (must not be cancelled and must be within period)
      const now = new Date();
      const isActiveSubscription = user.isSubscriber && 
        user.subscriptionStatus !== 'cancelled' &&
        user.subscriptionCurrentPeriodEnd && 
        new Date(user.subscriptionCurrentPeriodEnd) > now;

      let subscriptionInfo = {
        isSubscriber: isActiveSubscription,
        status: user.subscriptionStatus,
        currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId
      };

      // Only check Stripe if we don't have an active subscription in the database
      if (user.stripeSubscriptionId && !isActiveSubscription) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          // Only update if the Stripe subscription is actually active
          if (subscription.status === 'active') {
            subscriptionInfo.status = subscription.status;
            subscriptionInfo.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
            subscriptionInfo.isSubscriber = true;
            
            // Update database with latest info
            await storage.updateUserSubscriptionStatus(
              uid,
              subscription.status,
              new Date(subscription.current_period_end * 1000)
            );
          }
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

      // Update both subscription status and isSubscriber flag
      await storage.updateUserSubscriptionStatus(uid, 'active', currentPeriodEnd);
      
      // Also update the isSubscriber flag in the database
      await executeWithRetry(async () => {
        await db.update(users)
          .set({ 
            isSubscriber: true,
            subscriptionStatus: 'active',
            subscriptionCurrentPeriodEnd: currentPeriodEnd,
            isAdminGrantedSubscription: false,  // Mark as paid subscription
            updatedAt: new Date()
          })
          .where(eq(users.uid, uid));
      });

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

      // Cancel the subscription immediately on Stripe
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Immediately revoke access by setting subscription status to cancelled and isSubscriber to false
      await executeWithRetry(async () => {
        await db.update(users)
          .set({ 
            isSubscriber: false,
            subscriptionStatus: 'cancelled',
            subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            updatedAt: new Date()
          })
          .where(eq(users.uid, uid));
      });

      res.json({ 
        success: true, 
        message: 'Subscription has been cancelled. Access has been revoked immediately.',
        cancelAt: new Date(subscription.current_period_end * 1000)
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });
}