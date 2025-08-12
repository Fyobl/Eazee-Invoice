import { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { db, executeWithRetry } from "./db";
import { customers, products, invoices, quotes, statements, statementInvoices, recycleBin, users, systemSettings, onboardingProgress, type User } from "@shared/schema";
import { eq, and, desc, sql, ne } from "drizzle-orm";
import multer from "multer";
import Papa from "papaparse";
import Stripe from "stripe";
import { storage } from "./storage";
import { sendPasswordResetEmail, sendWelcomeEmail } from "./emailService";
import { sendSubscriptionNotification } from "./pushNotifications";
import { sendEmailWithBrevo, replaceEmailVariables, generateEmailHTML } from "./emailSender";
import * as geoip from 'geoip-lite';
import bcrypt from "bcrypt";

// Extend session interface to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Utility function to get user's country from IP
function getUserCountryFromIP(req: Request): string {
  // Get the real IP address, considering proxies and load balancers
  const ip = req.headers['x-forwarded-for'] as string || 
             req.headers['x-real-ip'] as string ||
             req.connection.remoteAddress ||
             req.socket.remoteAddress ||
             (req.connection as any)?.socket?.remoteAddress ||
             req.ip;
  
  console.log('Detecting country for IP:', ip);
  
  // Handle IPv6 localhost and development environments
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1') || ip.includes('::ffff:127.0.0.1')) {
    console.log('Local IP detected, defaulting to GB');
    return 'GB'; // Default to UK for local development
  }
  
  // Clean up the IP (remove port if present)
  const cleanIP = ip.split(',')[0].trim().replace(/^::ffff:/, '');
  
  try {
    const geo = geoip.lookup(cleanIP);
    if (geo && geo.country) {
      console.log(`IP ${cleanIP} resolved to country: ${geo.country}`);
      return geo.country;
    }
  } catch (error) {
    console.warn('GeoIP lookup failed:', error);
  }
  
  console.log('Country detection failed, defaulting to GB');
  return 'GB'; // Default to UK if detection fails
}

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: User;
}

const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const sessionId = req.session?.userId;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const user = await storage.getUserById(sessionId);
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

// Initialize Stripe - support both test and live modes  
const USE_TEST_MODE = process.env.STRIPE_USE_TEST_MODE === 'true';
const STRIPE_SECRET_KEY = USE_TEST_MODE 
  ? process.env.STRIPE_TEST_SECRET_KEY 
  : process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  const keyType = USE_TEST_MODE ? 'STRIPE_TEST_SECRET_KEY (test)' : 'STRIPE_SECRET_KEY (live)';
  throw new Error(`Missing required Stripe secret: ${keyType}`);
}

console.log('🔑 Server Stripe Mode:', USE_TEST_MODE ? 'TEST' : 'LIVE');
console.log('🔑 Server Stripe Secret Key (first 20 chars):', STRIPE_SECRET_KEY?.substring(0, 20));

// Add account verification check for live mode
if (!USE_TEST_MODE) {
  console.log('🔍 Running in LIVE mode - checking account capabilities...');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

// Function to check Stripe account status
async function checkStripeAccountStatus() {
  if (USE_TEST_MODE) {
    console.log('✅ Test mode - skipping account verification checks');
    return { status: 'test_mode', ready: true };
  }

  try {
    const account = await stripe.accounts.retrieve();
    console.log('🏢 Account ID:', account.id);
    console.log('💳 Charges enabled:', account.charges_enabled);
    console.log('💰 Payouts enabled:', account.payouts_enabled);
    console.log('🔧 Capabilities:', JSON.stringify(account.capabilities, null, 2));
    
    const issues = [];
    if (!account.charges_enabled) issues.push('Charges not enabled');
    if (!account.payouts_enabled) issues.push('Payouts not enabled');
    if (!account.capabilities?.card_payments || account.capabilities.card_payments !== 'active') {
      issues.push('Card payments not active');
    }
    
    if (issues.length > 0) {
      console.log('⚠️ Account issues found:', issues.join(', '));
      return { status: 'restricted', issues, ready: false };
    }
    
    console.log('✅ Stripe account verified and ready for live payments');
    return { status: 'active', ready: true };
  } catch (error) {
    console.error('❌ Stripe account check failed:', (error as Error).message);
    return { status: 'error', error: (error as Error).message, ready: false };
  }
}

// Check account status on startup
checkStripeAccountStatus();

// Helper function to automatically detect onboarding completion status
async function updateOnboardingCompletionStatus(uid: string) {
  try {
    // Get current progress
    let progress = await storage.getOnboardingProgress(uid);
    if (!progress) {
      progress = await storage.createOnboardingProgress(uid);
    }

    // Get user data
    const user = await storage.getUser(uid);
    if (!user) return progress;

    // Check if company branding is complete
    const companyBrandingComplete = !!(user.companyName && user.companyAddress);
    const logoUploaded = !!user.companyLogo;

    // Check if user has added customers
    const customerCount = await db.select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(and(eq(customers.uid, uid), eq(customers.isDeleted, false)));
    const firstCustomerAdded = customerCount[0].count > 0;

    // Check if user has added products  
    const productCount = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.uid, uid), eq(products.isDeleted, false)));
    const firstProductAdded = productCount[0].count > 0;

    // Check if user has created quotes
    const quoteCount = await db.select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(and(eq(quotes.uid, uid), eq(quotes.isDeleted, false)));
    const firstQuoteCreated = quoteCount[0].count > 0;

    // Check if user has created invoices
    const invoiceCount = await db.select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(and(eq(invoices.uid, uid), eq(invoices.isDeleted, false)));
    const firstInvoiceCreated = invoiceCount[0].count > 0;

    // Check if user has converted quotes to invoices (check if any invoice has same customer as quote)
    const quotesData = await db.select().from(quotes)
      .where(and(eq(quotes.uid, uid), eq(quotes.isDeleted, false)));
    const invoicesData = await db.select().from(invoices)
      .where(and(eq(invoices.uid, uid), eq(invoices.isDeleted, false)));
    
    const firstQuoteConverted = quotesData.some(quote => 
      invoicesData.some(invoice => invoice.customerId === quote.customerId)
    );

    // Update progress with detected values
    const updates = {
      companyBrandingComplete,
      logoUploaded,
      firstCustomerAdded,
      firstProductAdded,
      firstQuoteCreated,
      firstInvoiceCreated,
      firstQuoteConverted
    };

    return await storage.updateOnboardingProgress(uid, updates);
  } catch (error) {
    console.error('Error updating onboarding completion status:', error);
    // Return existing progress or create new one
    let fallbackProgress = await storage.getOnboardingProgress(uid);
    if (!fallbackProgress) {
      fallbackProgress = await storage.createOnboardingProgress(uid);
    }
    return fallbackProgress;
  }
}

export async function setupRoutes(app: Express) {
  // Health check endpoints for deployment - must be first to avoid being intercepted
  app.get('/health', (_req, res) => {
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  // Deployment readiness endpoint
  app.get('/ready', async (_req, res) => {
    try {
      // Test database connection using the existing pool from db.ts
      const { pool } = await import('./db');
      await pool.query('SELECT 1');
      res.status(200).json({ 
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: 'connected'
      });
    } catch (error) {
      res.status(503).json({ 
        status: 'not ready',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: (error as Error).message
      });
    }
  });
  
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
      
      // Detect user's country from IP address
      const country = getUserCountryFromIP(req);
      
      const user = await storage.registerUser(email, password, firstName, lastName, companyName, country);
      
      // Send welcome email (don't block registration if email fails)
      try {
        await sendWelcomeEmail(email, firstName, companyName);
        console.log(`Welcome email sent successfully to ${email}`);
      } catch (emailError) {
        console.error('Welcome email failed (registration continued):', emailError);
      }
      
      // Create session
      req.session.userId = user.id;
      
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
      
      // Update last login date
      await storage.updateLastLoginDate(user.uid);
      
      // Set session
      req.session.userId = user.id;
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'Session save failed' });
        }
        res.json({ user: { ...user, passwordHash: undefined } });
      });
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
  
  app.post('/api/change-password', requireAuth, async (req: AuthenticatedRequest, res) => {
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
  
  app.get('/api/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    res.json({ user: { ...req.user!, passwordHash: undefined } });
  });

  // Onboarding routes
  app.get('/api/onboarding-progress', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const uid = req.user!.uid;
      let progress = await storage.getOnboardingProgress(uid);
      
      if (!progress) {
        // Create initial progress if it doesn't exist
        progress = await storage.createOnboardingProgress(uid);
      }

      // Auto-detect completion status
      progress = await updateOnboardingCompletionStatus(uid);
      
      res.json(progress);
    } catch (error) {
      console.error('Error fetching onboarding progress:', error);
      res.status(500).json({ error: 'Failed to fetch onboarding progress' });
    }
  });

  app.put('/api/onboarding-progress', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const uid = req.user!.uid;
      const updates = req.body;
      
      const progress = await storage.updateOnboardingProgress(uid, updates);
      res.json(progress);
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
      res.status(500).json({ error: 'Failed to update onboarding progress' });
    }
  });

  app.post('/api/onboarding-dismiss', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const uid = req.user!.uid;
      const progress = await storage.dismissOnboarding(uid);
      res.json(progress);
    } catch (error) {
      console.error('Error dismissing onboarding:', error);
      res.status(500).json({ error: 'Failed to dismiss onboarding' });
    }
  });

  // Password reset routes
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ 
          success: true, 
          message: 'If an account with this email exists, you will receive a password reset link.' 
        });
      }

      // Generate reset token
      const resetToken = await storage.createPasswordResetToken(email);
      
      // Get base URL for reset link
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? `https://${req.get('host')}` 
        : `http://${req.get('host')}`;

      // Send reset email
      const emailSent = await sendPasswordResetEmail(email, resetToken, baseUrl);
      
      if (!emailSent) {
        console.error('Failed to send password reset email to:', email);
        return res.status(500).json({ error: 'Failed to send reset email' });
      }

      res.json({ 
        success: true, 
        message: 'If an account with this email exists, you will receive a password reset link.' 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      // Validate token and reset password
      const success = await storage.resetPasswordWithToken(token, newPassword);
      
      if (!success) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      res.json({ 
        success: true, 
        message: 'Password reset successful. You can now log in with your new password.' 
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  app.get('/api/validate-reset-token/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const resetToken = await storage.validatePasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      res.json({ 
        valid: true, 
        email: resetToken.email 
      });
    } catch (error) {
      console.error('Validate reset token error:', error);
      res.status(500).json({ error: 'Failed to validate reset token' });
    }
  });

  // Admin password management routes
  // Verify password route for email changes
  app.post('/api/verify-password', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      const user = await storage.getUser(req.user!.uid);
      if (!user || !user.passwordHash) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid password' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Password verification error:', error);
      res.status(500).json({ error: 'Failed to verify password' });
    }
  });

  app.post('/api/admin/send-password-reset', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { userUid } = req.body;
      
      if (!userUid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Get the target user
      const targetUser = await storage.getUser(userUid);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate reset token
      const resetToken = await storage.createPasswordResetToken(targetUser.email);
      
      // Get base URL for reset link
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? `https://${req.get('host')}` 
        : `http://${req.get('host')}`;

      // Send reset email
      const emailSent = await sendPasswordResetEmail(targetUser.email, resetToken, baseUrl);
      
      if (!emailSent) {
        console.error('Failed to send admin-initiated password reset email to:', targetUser.email);
        return res.status(500).json({ error: 'Failed to send reset email' });
      }

      res.json({ 
        success: true, 
        message: `Password reset email sent to ${targetUser.email}` 
      });
    } catch (error) {
      console.error('Admin password reset error:', error);
      res.status(500).json({ error: 'Failed to send password reset email' });
    }
  });

  app.post('/api/admin/set-user-password', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { userUid, newPassword } = req.body;
      
      if (!userUid || !newPassword) {
        return res.status(400).json({ error: 'User ID and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      // Get the target user
      const targetUser = await storage.getUser(userUid);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Set the new password
      const success = await storage.adminSetUserPassword(userUid, newPassword);
      
      if (!success) {
        return res.status(500).json({ error: 'Failed to set password' });
      }

      res.json({ 
        success: true, 
        message: `Password updated for ${targetUser.email}` 
      });
    } catch (error) {
      console.error('Admin set password error:', error);
      res.status(500).json({ error: 'Failed to set user password' });
    }
  });

  // Meta Data Management routes
  app.get('/api/meta-settings', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const metaSettings = await db.select().from(systemSettings)
        .where(sql`key LIKE 'meta_%'`);
      
      const settingsObj: Record<string, string> = {};
      metaSettings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      
      // Provide defaults if not set
      const defaultSettings = {
        meta_title: 'Eazee Invoice - Professional Invoice Management for Freelancers & Small Business',
        meta_description: 'Professional invoicing software for freelancers and small businesses. Create unlimited invoices, quotes, and statements with PDF generation, email integration, and comprehensive business analytics. Start your 7-day free trial today.',
        meta_keywords: 'invoice software, freelance invoicing, small business billing, professional quotes, invoice generator, PDF invoices, business management, accounting software',
        meta_og_title: 'Eazee Invoice - Professional Invoice Management for Freelancers & Small Business',
        meta_og_description: 'Professional invoicing software for freelancers and small businesses. Create unlimited invoices, quotes, and statements with PDF generation, email integration, and comprehensive business analytics. Start your 7-day free trial today.',
        meta_twitter_title: 'Eazee Invoice - Professional Invoice Management for Freelancers & Small Business',
        meta_twitter_description: 'Professional invoicing software for freelancers and small businesses. Create unlimited invoices, quotes, and statements with PDF generation, email integration, and comprehensive business analytics. Start your 7-day free trial today.',
        meta_author: 'Eazee Invoice',
        meta_site_name: 'Eazee Invoice',
        meta_canonical_url: 'https://eazeeinvoice.replit.app/'
      };
      
      // Merge defaults with saved settings
      const finalSettings = { ...defaultSettings, ...settingsObj };
      
      res.json(finalSettings);
    } catch (error) {
      console.error('Error fetching meta settings:', error);
      res.status(500).json({ error: 'Failed to fetch meta settings' });
    }
  });

  app.put('/api/meta-settings', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const allowedKeys = [
        'meta_title', 'meta_description', 'meta_keywords',
        'meta_og_title', 'meta_og_description',
        'meta_twitter_title', 'meta_twitter_description',
        'meta_author', 'meta_site_name', 'meta_canonical_url'
      ];
      
      const updates = req.body;
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedKeys.includes(key) && typeof value === 'string') {
          // Check if setting exists
          const existing = await db.select().from(systemSettings)
            .where(eq(systemSettings.key, key))
            .limit(1);
          
          if (existing.length > 0) {
            // Update existing
            await db.update(systemSettings)
              .set({ value: value as string, updatedAt: new Date() })
              .where(eq(systemSettings.key, key));
          } else {
            // Insert new
            await db.insert(systemSettings)
              .values({ key, value: value as string });
          }
        }
      }
      
      res.json({ success: true, message: 'Meta settings updated successfully' });
    } catch (error) {
      console.error('Error updating meta settings:', error);
      res.status(500).json({ error: 'Failed to update meta settings' });
    }
  });

  // Public meta data route (no auth required)
  app.get('/api/meta-data', async (req, res) => {
    try {
      const metaSettings = await db.select().from(systemSettings)
        .where(sql`key LIKE 'meta_%'`);
      
      const settingsObj: Record<string, string> = {};
      metaSettings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      
      // Provide defaults if not set
      const defaultSettings = {
        meta_title: 'Eazee Invoice - Professional Invoice Management for Freelancers & Small Business',
        meta_description: 'Professional invoicing software for freelancers and small businesses. Create unlimited invoices, quotes, and statements with PDF generation, email integration, and comprehensive business analytics. Start your 7-day free trial today.',
        meta_keywords: 'invoice software, freelance invoicing, small business billing, professional quotes, invoice generator, PDF invoices, business management, accounting software',
        meta_og_title: 'Eazee Invoice - Professional Invoice Management for Freelancers & Small Business',
        meta_og_description: 'Professional invoicing software for freelancers and small businesses. Create unlimited invoices, quotes, and statements with PDF generation, email integration, and comprehensive business analytics. Start your 7-day free trial today.',
        meta_twitter_title: 'Eazee Invoice - Professional Invoice Management for Freelancers & Small Business',
        meta_twitter_description: 'Professional invoicing software for freelancers and small businesses. Create unlimited invoices, quotes, and statements with PDF generation, email integration, and comprehensive business analytics. Start your 7-day free trial today.',
        meta_author: 'Eazee Invoice',
        meta_site_name: 'Eazee Invoice',
        meta_canonical_url: 'https://eazeeinvoice.replit.app/'
      };
      
      // Merge defaults with saved settings
      const finalSettings = { ...defaultSettings, ...settingsObj };
      
      res.json(finalSettings);
    } catch (error) {
      console.error('Error fetching public meta data:', error);
      // Return defaults on error
      res.json({
        meta_title: 'Eazee Invoice - Professional Invoice Management for Freelancers & Small Business',
        meta_description: 'Professional invoicing software for freelancers and small businesses. Create unlimited invoices, quotes, and statements with PDF generation, email integration, and comprehensive business analytics. Start your 7-day free trial today.',
        meta_keywords: 'invoice software, freelance invoicing, small business billing, professional quotes, invoice generator, PDF invoices, business management, accounting software',
        meta_og_title: 'Eazee Invoice - Professional Invoice Management for Freelancers & Small Business',
        meta_og_description: 'Professional invoicing software for freelancers and small businesses. Create unlimited invoices, quotes, and statements with PDF generation, email integration, and comprehensive business analytics. Start your 7-day free trial today.',
        meta_twitter_title: 'Eazee Invoice - Professional Invoice Management for Freelancers & Small Business',
        meta_twitter_description: 'Professional invoicing software for freelancers and small businesses. Create unlimited invoices, quotes, and statements with PDF generation, email integration, and comprehensive business analytics. Start your 7-day free trial today.',
        meta_author: 'Eazee Invoice',
        meta_site_name: 'Eazee Invoice',
        meta_canonical_url: 'https://eazeeinvoice.replit.app/'
      });
    }
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
        originalId: id.toString(),
        data: customer
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
        originalId: id.toString(),
        data: invoice
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
        originalId: id.toString(),
        data: quote
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
      
      const customerIdInt = parseInt(req.body.customerId);
      const statementData = {
        uid: req.user!.uid,
        number: statementNumber,
        customerId: customerIdInt,
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
      
      const [statement] = await db.insert(statements).values({
        uid: statementData.uid,
        number: statementData.number,
        customerId: statementData.customerId.toString(),
        customerName: statementData.customerName,
        date: statementData.date,
        startDate: statementData.startDate,
        endDate: statementData.endDate,
        period: statementData.period,
        notes: statementData.notes,
        isDeleted: statementData.isDeleted
      }).returning();
      console.log('Statement created successfully:', statement);
      
      // Capture invoice snapshot data at the time of statement creation
      const unpaidInvoices = await db.select().from(invoices)
        .where(and(
          eq(invoices.uid, req.user!.uid),
          eq(invoices.customerId, customerIdInt.toString()),
          eq(invoices.isDeleted, false)
        ));
      
      console.log(`Found ${unpaidInvoices.length} invoices for customer ${req.body.customerId}:`, 
        unpaidInvoices.map(inv => ({ number: inv.number, date: inv.date, status: inv.status, customerId: inv.customerId })));
      
      // Filter invoices within the statement period and with unpaid/overdue status
      const relevantInvoices = unpaidInvoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        
        // Set end date to end of day to include invoices on the end date
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const statusMatch = invoice.status === 'unpaid' || invoice.status === 'overdue';
        const dateMatch = invoiceDate >= startDate && invoiceDate <= endOfDay;
        
        console.log(`Invoice ${invoice.number}: date=${invoice.date}, status=${invoice.status}, statusMatch=${statusMatch}, dateMatch=${dateMatch} (comparing ${invoiceDate.toISOString()} between ${startDate.toISOString()} and ${endOfDay.toISOString()})`);
        
        return statusMatch && dateMatch;
      });
      
      console.log(`Filtered to ${relevantInvoices.length} relevant invoices:`, 
        relevantInvoices.map(inv => ({ number: inv.number, date: inv.date, status: inv.status })));
      
      // Store snapshot data for each relevant invoice
      if (relevantInvoices.length > 0) {
        const snapshotData = relevantInvoices.map(invoice => ({
          statementId: statement.id.toString(),
          invoiceNumber: invoice.number,
          invoiceDate: new Date(invoice.date),
          invoiceDueDate: new Date(invoice.dueDate),
          invoiceAmount: invoice.total,
          invoiceStatus: invoice.status,
          createdAt: new Date()
        }));
        
        await db.insert(statementInvoices).values(snapshotData);
        console.log(`Stored ${snapshotData.length} invoice snapshots for statement ${statement.id}`);
      }
      
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
      
      // For statements, perform hard delete (complete removal)
      // First delete the associated statement invoices
      await db.delete(statementInvoices)
        .where(eq(statementInvoices.statementId, id.toString()));
      
      // Then delete the statement itself
      const [statement] = await db.delete(statements)
        .where(and(eq(statements.id, id), eq(statements.uid, req.user!.uid)))
        .returning();
      
      console.log(`Statement ${id} and its invoice snapshots permanently deleted`);
      res.json(statement);
    } catch (error) {
      console.error('Error deleting statement:', error);
      res.status(500).json({ error: 'Failed to delete statement' });
    }
  });

  // Get statement invoice snapshots
  app.get('/api/statements/:id/invoices', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const statementId = req.params.id;
      
      // First verify the statement belongs to the user
      const [statement] = await db.select().from(statements)
        .where(and(eq(statements.id, parseInt(statementId)), eq(statements.uid, req.user!.uid)));
      
      if (!statement) {
        return res.status(404).json({ error: 'Statement not found' });
      }
      
      // Get the snapshot invoice data
      const snapshotInvoices = await db.select().from(statementInvoices)
        .where(eq(statementInvoices.statementId, statementId))
        .orderBy(desc(statementInvoices.invoiceDate));
      
      res.json(snapshotInvoices);
    } catch (error) {
      console.error('Error fetching statement invoices:', error);
      res.status(500).json({ error: 'Failed to fetch statement invoices' });
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
      
      // Detect country for admin-created users too
      const country = getUserCountryFromIP(req);
      
      // Create user using storage interface for proper password hashing
      const user = await storage.registerUser(email, password, firstName, lastName, companyName, country);
      
      // Update additional fields for admin-created users
      const updateData: any = {
        mustChangePassword: true  // Force password change for admin-created users
      };
      if (isSubscriber) {
        updateData.isSubscriber = isSubscriber;
        updateData.isAdminGrantedSubscription = true;  // Mark as admin-granted subscription
        updateData.subscriptionStartDate = new Date(); // Set subscription start date for admin-granted subscriptions
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

      // If email is being updated, check for uniqueness
      if (updateData.email) {
        const existingUser = await db.select()
          .from(users)
          .where(and(
            eq(users.email, updateData.email),
            ne(users.uid, uid)  // Exclude current user
          ))
          .limit(1);
        
        if (existingUser.length > 0) {
          return res.status(400).json({ error: 'Email address is already in use' });
        }
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

  // One-time migration endpoint to backfill subscription start dates
  app.post('/api/admin/backfill-subscription-dates', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.backfillSubscriptionStartDates();
      res.json({ success: true, message: 'Subscription start dates updated for existing users' });
    } catch (error) {
      console.error('Backfill subscription dates error:', error);
      res.status(500).json({ error: 'Failed to backfill subscription dates' });
    }
  });

  // Get user statistics endpoint for admin
  app.get('/api/users/:uid/stats', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const uid = req.params.uid;
      
      // Get counts for all user data (excluding deleted items)
      const [invoicesCount] = await db.select({ count: sql<number>`count(*)` }).from(invoices).where(and(eq(invoices.uid, uid), eq(invoices.isDeleted, false)));
      const [quotesCount] = await db.select({ count: sql<number>`count(*)` }).from(quotes).where(and(eq(quotes.uid, uid), eq(quotes.isDeleted, false)));
      const [statementsCount] = await db.select({ count: sql<number>`count(*)` }).from(statements).where(and(eq(statements.uid, uid), eq(statements.isDeleted, false)));
      const [customersCount] = await db.select({ count: sql<number>`count(*)` }).from(customers).where(and(eq(customers.uid, uid), eq(customers.isDeleted, false)));
      const [productsCount] = await db.select({ count: sql<number>`count(*)` }).from(products).where(and(eq(products.uid, uid), eq(products.isDeleted, false)));
      
      // Get user details including subscription and login information
      const user = await storage.getUser(uid);
      
      let subscriptionInfo = null;
      if (user && user.isSubscriber) {
        if (user.stripeSubscriptionId) {
          try {
            // Get subscription details from Stripe
            const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
            subscriptionInfo = {
              subscriptionDate: user.subscriptionStartDate ? user.subscriptionStartDate.toISOString() : new Date(subscription.created * 1000).toISOString(),
              nextBillingDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
              status: subscription.status,
              billingCycle: subscription.items.data[0]?.price?.recurring?.interval || 'unknown',
              amount: subscription.items.data[0]?.price?.unit_amount || 0,
              currency: subscription.items.data[0]?.price?.currency || 'gbp'
            };
          } catch (stripeError) {
            console.error('Error fetching Stripe subscription:', stripeError);
            subscriptionInfo = {
              error: 'Could not fetch subscription details from Stripe'
            };
          }
        } else {
          // Handle subscribers without Stripe subscription (manually granted or legacy)
          // Calculate billing cycle from subscription period if available
          let billingCycle = 'unknown';
          if (user.subscriptionStartDate && user.subscriptionCurrentPeriodEnd) {
            const startDate = new Date(user.subscriptionStartDate);
            const endDate = new Date(user.subscriptionCurrentPeriodEnd);
            const diffInDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            
            console.log(`User ${user.email}: ${diffInDays} days between ${startDate.toISOString().split('T')[0]} and ${endDate.toISOString().split('T')[0]}`);
            
            if (diffInDays >= 350 && diffInDays <= 380) {
              billingCycle = 'year';
            } else if (diffInDays >= 28 && diffInDays <= 35) {
              billingCycle = 'month';
            } else if (diffInDays > 1000) {
              billingCycle = 'permanent';
            }
          }
          
          subscriptionInfo = {
            subscriptionDate: user.subscriptionStartDate ? user.subscriptionStartDate.toISOString() : (user.trialStartDate ? user.trialStartDate.toISOString() : null),
            nextBillingDate: user.subscriptionCurrentPeriodEnd ? user.subscriptionCurrentPeriodEnd.toISOString() : null,
            status: user.isAdminGrantedSubscription ? 'admin_granted' : 'active',
            billingCycle: user.isAdminGrantedSubscription ? 'admin_managed' : billingCycle,
            amount: billingCycle === 'year' ? 6469 : (billingCycle === 'month' ? 599 : 0), // £64.69 yearly, £5.99 monthly in pence
            currency: 'gbp'
          };
        }
      }
      
      res.json({
        // Existing counts
        invoices: invoicesCount.count || 0,
        quotes: quotesCount.count || 0,
        statements: statementsCount.count || 0,
        customers: customersCount.count || 0,
        products: productsCount.count || 0,
        
        // User account information
        userDetails: {
          email: user?.email || 'Unknown',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          companyName: user?.companyName || '',
          registrationDate: user?.trialStartDate || null,
          lastLoginDate: user?.lastLoginDate || null,
          isSubscriber: user?.isSubscriber || false,
          isAdminGrantedSubscription: user?.isAdminGrantedSubscription || false,
          isSuspended: user?.isSuspended || false,
          country: user?.country || 'Unknown'
        },
        
        // Subscription information
        subscription: subscriptionInfo
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user statistics' });
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
        transform: (value: any) => value.trim()
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

      for (const [index, row] of Array.from((parseResult.data as any[]).entries())) {
        try {
          if (type === 'customers') {
            // Validate customer data - support both old and new CSV formats
            const customerData = row as any;
            const businessName = customerData['Business Name'] || customerData['Customer Name'] || customerData.name;
            const contactName = customerData['Contact Name'] || customerData.contactName;
            const email = customerData['Email'] || customerData.email;
            
            if (!businessName || !email) {
              throw new Error(`Row ${index + 1}: Business Name and Email are required`);
            }

            // Additional validation
            if (!businessName.trim()) {
              throw new Error(`Row ${index + 1}: Business Name cannot be empty`);
            }
            
            if (!email.trim()) {
              throw new Error(`Row ${index + 1}: Email cannot be empty`);
            }

            // Build address from separate components (new format) or use single address field (old format)
            let fullAddress = '';
            if (customerData['Address Line 1']) {
              // New format with separate address components
              const addressParts = [
                customerData['Address Line 1']?.trim(),
                customerData['Address Line 2']?.trim(),
                customerData['Town']?.trim(),
                customerData['County']?.trim(),
                customerData['Post Code']?.trim()
              ].filter(part => part && part.length > 0);
              
              fullAddress = addressParts.join('\n');
            } else {
              // Old format with single address field
              fullAddress = customerData.address?.trim() || '';
            }

            // Get phone from either format
            const phone = customerData['Phone'] || customerData.phone || '';

            // Extract individual address components for new schema
            const addressLine1 = customerData['Address Line 1']?.trim() || '';
            const addressLine2 = customerData['Address Line 2']?.trim() || '';
            const town = customerData['Town']?.trim() || '';
            const county = customerData['County']?.trim() || '';
            const postCode = customerData['Post Code']?.trim() || '';

            // Insert customer
            await db.insert(customers).values({
              uid: userId,
              name: businessName.trim(),
              contactName: contactName?.trim() || null,
              email: email.trim(),
              phone: phone.trim(),
              address: fullAddress,
              addressLine1: addressLine1 || null,
              addressLine2: addressLine2 || null,
              town: town || null,
              county: county || null,
              postCode: postCode || null
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
              unitPrice: unitPrice.toString(),
              taxRate: taxRate.toString()
            });

            successCount++;
          }
        } catch (error) {
          errorCount++;
          errors.push((error as Error).message);
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
        // Detect user's country from IP address
        const country = getUserCountryFromIP(req);
        
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
          country: country,
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
            user.subscriptionCurrentPeriodEnd || undefined
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

      // If user already has a subscription, try to return existing subscription info
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
            const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
            if ((latestInvoice as any).payment_intent && typeof (latestInvoice as any).payment_intent === 'object') {
              const paymentIntent = (latestInvoice as any).payment_intent as Stripe.PaymentIntent;
              return res.json({
                subscriptionId: subscription.id,
                clientSecret: paymentIntent.client_secret,
                status: subscription.status
              });
            }
          }
        } catch (stripeError: any) {
          // If subscription doesn't exist (e.g., switching from test to live keys), clear the old data
          if (stripeError.code === 'resource_missing') {
            console.log('Old subscription not found in live mode, clearing user data...');
            await storage.updateUserStripeInfo(uid, null as any, null as any);
            user.stripeCustomerId = null;
            user.stripeSubscriptionId = null;
          } else {
            throw stripeError;
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

      // Use a fixed price ID or create a reusable price
      let priceId = process.env.STRIPE_PRICE_ID;
      
      if (!priceId) {
        // Create or find existing product
        const products = await stripe.products.list({ limit: 100 });
        let product = products.data.find(p => p.name === 'Eazee Invoice Pro');
        
        if (!product) {
          product = await stripe.products.create({
            name: 'Eazee Invoice Pro',
            description: 'Monthly subscription to Eazee Invoice Pro'
          });
        }
        
        // Create or find existing price
        const prices = await stripe.prices.list({
          product: product.id,
          currency: 'gbp',
          recurring: { interval: 'month' },
          limit: 100
        });
        
        // Look for both monthly and yearly prices
        let monthlyPrice = prices.data.find(p => p.unit_amount === 599 && p.recurring?.interval === 'month');
        let yearlyPrice = prices.data.find(p => p.unit_amount === 6469 && p.recurring?.interval === 'year');
        
        if (!monthlyPrice) {
          monthlyPrice = await stripe.prices.create({
            currency: 'gbp',
            product: product.id,
            unit_amount: 599, // £5.99 in pence
            recurring: {
              interval: 'month'
            }
          });
        }
        
        if (!yearlyPrice) {
          yearlyPrice = await stripe.prices.create({
            currency: 'gbp',
            product: product.id,
            unit_amount: 6469, // £64.69 in pence
            recurring: {
              interval: 'year'
            }
          });
        }
        
        // Use monthly price by default (this might need to be dynamic based on user selection)
        let price = monthlyPrice;
        
        priceId = price.id;
      }

      // First create a SetupIntent to collect payment method
      const setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomer.id,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          uid: uid,
          purpose: 'subscription_setup'
        }
      });
      
      console.log('SetupIntent created with ID:', setupIntent.id);
      console.log('SetupIntent client_secret:', setupIntent.client_secret ? 'present' : 'missing');
      console.log('SetupIntent customer:', setupIntent.customer);
      console.log('Stripe Secret Key (first 20 chars):', process.env.STRIPE_SECRET_KEY?.substring(0, 20));
      console.log('SetupIntent client_secret (first 30 chars):', setupIntent.client_secret?.substring(0, 30));

      // Update user with Stripe info (subscription will be created after payment method is confirmed)
      await storage.updateUserStripeInfo(uid, stripeCustomer.id, null as any);

      // Return the setup intent for collecting payment method
      res.json({
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        customerId: stripeCustomer.id,
        priceId: priceId,
        isSetupIntent: true
      });

    } catch (error) {
      console.error('Subscription creation error:', error);
      
      // More detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Check if it's a Stripe error
      if ((error as any).type) {
        console.error('Stripe error type:', (error as any).type);
        console.error('Stripe error code:', (error as any).code);
        console.error('Stripe error param:', (error as any).param);
      }
      
      res.status(500).json({ 
        error: 'Failed to create subscription', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stripeError: (error as any).type ? {
          type: (error as any).type,
          code: (error as any).code,
          param: (error as any).param
        } : null
      });
    }
  });

  // Complete subscription after SetupIntent confirmation
  app.post('/api/complete-subscription', async (req, res) => {
    try {
      const { setupIntentId, customerId, priceId, uid } = req.body;
      
      if (!setupIntentId || !customerId || !priceId || !uid) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Retrieve the SetupIntent to get the payment method
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      
      if (setupIntent.status !== 'succeeded') {
        return res.status(400).json({ error: 'SetupIntent not succeeded' });
      }
      
      const paymentMethodId = setupIntent.payment_method;
      
      // Create the subscription with the confirmed payment method
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: priceId
        }],
        default_payment_method: paymentMethodId as string,
        collection_method: 'charge_automatically'
      });
      
      console.log('Subscription completed with ID:', subscription.id);
      
      // Update user with subscription info and set subscription start date
      await storage.updateUserStripeInfo(uid, customerId, subscription.id);
      await storage.updateSubscriptionStartDate(uid, new Date());
      
      res.json({
        subscriptionId: subscription.id,
        status: subscription.status,
        success: true
      });
      
    } catch (error) {
      console.error('Complete subscription error:', error);
      res.status(500).json({ 
        error: 'Failed to complete subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Cancel subscription endpoint
  app.post('/api/cancel-subscription', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const uid = req.user!.uid;
      const user = await storage.getUser(uid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't allow canceling admin-granted subscriptions
      if (user.isAdminGrantedSubscription) {
        return res.status(400).json({ error: 'Cannot cancel admin-granted subscription' });
      }

      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ error: 'No active subscription found' });
      }

      // Cancel the Stripe subscription at the end of the current period
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      console.log(`Subscription ${subscription.id} set to cancel at period end`);

      // Update user's subscription status
      await storage.updateUserSubscriptionStatus(
        uid, 
        'cancelled', 
        (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : undefined
      );

      res.json({ 
        success: true, 
        message: 'Subscription cancelled successfully',
        accessUntil: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ 
        error: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Stripe webhook endpoint
  app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // In production, you should set STRIPE_WEBHOOK_SECRET
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err) {
      console.error('Webhook signature verification failed:', (err as Error).message);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        const newSubscription = event.data.object as Stripe.Subscription;
        const newCustomer = await stripe.customers.retrieve(newSubscription.customer as string);
        
        if (newCustomer && !newCustomer.deleted && newCustomer.metadata?.uid) {
          await storage.updateUserSubscriptionStatus(
            newCustomer.metadata.uid,
            newSubscription.status,
            new Date((newSubscription as any).current_period_end * 1000)
          );
          
          // Send push notification for new subscriptions only
          const customerName = newCustomer.name || 'Unknown Customer';
          const customerEmail = newCustomer.email || 'No email';
          const amount = newSubscription.items.data[0]?.price?.unit_amount ? 
            (newSubscription.items.data[0].price.unit_amount / 100) : 5.99;
          const currency = newSubscription.items.data[0]?.price?.currency?.toUpperCase() || 'GBP';
          
          // Send notification in background (don't block webhook response)
          sendSubscriptionNotification(customerEmail, customerName, amount, currency)
            .catch(error => console.error('Notification failed:', error));
        }
        break;
        
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        const updatedCustomer = await stripe.customers.retrieve(updatedSubscription.customer as string);
        
        if (updatedCustomer && !updatedCustomer.deleted && updatedCustomer.metadata?.uid) {
          await storage.updateUserSubscriptionStatus(
            updatedCustomer.metadata.uid,
            updatedSubscription.status,
            new Date((updatedSubscription as any).current_period_end * 1000)
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
        if ((invoice as any).subscription) {
          const invoiceSubscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
          const invoiceCustomer = await stripe.customers.retrieve(invoiceSubscription.customer as string);
          
          if (invoiceCustomer && !invoiceCustomer.deleted && invoiceCustomer.metadata?.uid) {
            await storage.updateUserSubscriptionStatus(
              invoiceCustomer.metadata.uid,
              invoiceSubscription.status,
              new Date((invoiceSubscription as any).current_period_end * 1000)
            );
          }
        }
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        if ((failedInvoice as any).subscription) {
          const failedSubscription = await stripe.subscriptions.retrieve((failedInvoice as any).subscription as string);
          const failedCustomer = await stripe.customers.retrieve(failedSubscription.customer as string);
          
          if (failedCustomer && !failedCustomer.deleted && failedCustomer.metadata?.uid) {
            await storage.updateUserSubscriptionStatus(
              failedCustomer.metadata.uid,
              'past_due',
              new Date((failedSubscription as any).current_period_end * 1000)
            );
          }
        }
        break;
    }

    res.json({ received: true });
  });

  // Test notification endpoint (admin only)
  app.post('/api/test-notification', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { billingFrequency = 'monthly' } = req.body;
      const { sendTestNotification } = await import('./pushNotifications');
      await sendTestNotification(billingFrequency);
      res.json({ success: true, message: `Test notification sent successfully (${billingFrequency} billing)` });
    } catch (error) {
      console.error('Test notification failed:', error);
      res.status(500).json({ error: 'Failed to send test notification' });
    }
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
            subscriptionInfo.currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
            subscriptionInfo.isSubscriber = true;
            
            // Update database with latest info
            await storage.updateUserSubscriptionStatus(
              uid,
              subscription.status,
              new Date((subscription as any).current_period_end * 1000)
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
            subscriptionCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            updatedAt: new Date()
          })
          .where(eq(users.uid, uid));
      });

      res.json({ 
        success: true, 
        message: 'Subscription has been cancelled. Access has been revoked immediately.',
        cancelAt: new Date((subscription as any).current_period_end * 1000)
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  // FRESH STRIPE PAYMENTINTENT ENDPOINTS - Clean implementation
  app.post('/api/create-payment-intent', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { billingFrequency = 'monthly' } = req.body;
      console.log('🔄 Creating fresh PaymentIntent for user:', user.uid, 'billing:', billingFrequency);
      
      // Calculate amount based on billing frequency
      const amount = billingFrequency === 'yearly' ? 6469 : 599; // £64.69 or £5.99 in pence
      
      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        console.log('🆕 Creating new Stripe customer');
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.displayName || undefined,
          metadata: { userId: user.uid }
        });
        stripeCustomerId = customer.id;
        
        await db.update(users)
          .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
          .where(eq(users.uid, user.uid));
        console.log('✅ Stripe customer created:', stripeCustomerId);
      }
      
      // Create PaymentIntent for subscription payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'gbp',
        customer: stripeCustomerId,
        setup_future_usage: 'off_session',
        automatic_payment_methods: {
          enabled: true
        },
        metadata: {
          userId: user.uid,
          type: 'subscription_payment',
          billingFrequency
        }
      });
      
      console.log('✅ PaymentIntent created:', paymentIntent.id, 'amount:', amount, 'pence');
      console.log('🔑 Client secret (first 30 chars):', paymentIntent.client_secret?.substring(0, 30));
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        billingFrequency
      });
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  // Confirm subscription after successful payment
  app.post('/api/confirm-subscription', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { paymentIntentId } = req.body;
      const user = req.user!;

      if (!paymentIntentId) {
        return res.status(400).json({ error: 'Payment intent ID is required' });
      }

      console.log('🔄 Confirming subscription for user:', user.uid, 'paymentIntent:', paymentIntentId);

      // Retrieve the payment intent from Stripe to verify payment
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: 'Payment not completed' });
      }

      // Get billing frequency from metadata
      const billingFrequency = paymentIntent.metadata?.billingFrequency || 'monthly';
      
      // Calculate subscription end date
      const endDate = new Date();
      if (billingFrequency === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Update user subscription status in database
      await storage.updateUserSubscriptionStatus(user.uid, 'active', endDate);
      
      // Also update the isSubscriber flag
      await db.update(users)
        .set({ 
          isSubscriber: true,
          subscriptionStatus: 'active',
          subscriptionCurrentPeriodEnd: endDate,
          isAdminGrantedSubscription: false,
          updatedAt: new Date()
        })
        .where(eq(users.uid, user.uid));

      console.log('✅ Subscription confirmed for user:', user.uid, 'until:', endDate);

      // Send push notification for manual subscription confirmation
      const customerName = user.displayName || 'Unknown Customer';
      const customerEmail = user.email || 'No email';
      const amount = billingFrequency === 'yearly' ? 64.69 : 5.99;
      
      // Send notification in background (don't block response)
      import('./pushNotifications').then(({ sendSubscriptionNotification }) => {
        sendSubscriptionNotification(customerEmail, customerName, amount, 'GBP', billingFrequency)
          .catch(error => console.error('Notification failed:', error));
      });

      res.json({ 
        success: true,
        message: 'Subscription activated successfully',
        subscriptionEndDate: endDate
      });

    } catch (error) {
      console.error('❌ Error confirming subscription:', error);
      res.status(500).json({ 
        error: 'Failed to confirm subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // System settings endpoints (admin only)
  app.get('/api/system-settings/:key', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSystemSetting(key);
      res.json(setting ? { key: setting.key, value: setting.value } : null);
    } catch (error) {
      console.error('Error getting system setting:', error);
      res.status(500).json({ error: 'Failed to get system setting' });
    }
  });

  app.post('/api/system-settings', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { key, value } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key and value are required' });
      }
      
      const setting = await storage.setSystemSetting(key, value);
      res.json({ key: setting.key, value: setting.value });
    } catch (error) {
      console.error('Error setting system setting:', error);
      res.status(500).json({ error: 'Failed to set system setting' });
    }
  });

  // Get current stripe mode endpoint (admin only)
  app.get('/api/stripe-mode', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const setting = await storage.getSystemSetting('stripe_mode');
      const currentMode = setting?.value || 'live'; // Default to live mode
      res.json({ mode: currentMode });
    } catch (error) {
      console.error('Error getting stripe mode:', error);
      res.status(500).json({ error: 'Failed to get stripe mode' });
    }
  });

  // Toggle stripe mode endpoint (admin only)
  app.post('/api/stripe-mode', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { mode } = req.body;
      if (!mode || !['live', 'test'].includes(mode)) {
        return res.status(400).json({ error: 'Mode must be "live" or "test"' });
      }
      
      await storage.setSystemSetting('stripe_mode', mode);
      res.json({ 
        success: true, 
        mode,
        message: `Stripe mode updated to ${mode}. Restart the server for changes to take effect.`
      });
    } catch (error) {
      console.error('Error setting stripe mode:', error);
      res.status(500).json({ error: 'Failed to set stripe mode' });
    }
  });

  // Web Analytics endpoints (admin only)
  app.get('/api/admin/analytics', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { range = '30d' } = req.query;
      const rangeDays = range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30;
      
      const { getAnalyticsData } = await import('./analytics');
      const analyticsData = getAnalyticsData(rangeDays);
      
      res.json(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  // Test notifications endpoint (admin only)
  app.post('/api/test-notifications', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { service } = req.body;
      
      if (service === 'pushover') {
        const { sendTestNotification } = await import('./pushNotifications');
        await sendTestNotification();
        res.json({ success: true, message: 'Test notification sent via Pushover' });
      } else {
        res.status(400).json({ error: 'Invalid notification service' });
      }
    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  });

  // Email setup route
  app.post('/api/setup-auto-email', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { senderEmail } = req.body;
      const uid = req.user!.uid;

      if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
        return res.status(400).json({ error: 'Valid email address required' });
      }

      // Check if Brevo API key is available
      if (!process.env.BREVO_API_KEY) {
        return res.status(500).json({ error: 'Email service not configured' });
      }

      try {
        // First check if sender already exists to avoid duplicate emails
        const existingSenderResponse = await fetch('https://api.brevo.com/v3/senders', {
          headers: { 'api-key': process.env.BREVO_API_KEY }
        });
        
        let existingSender = null;
        if (existingSenderResponse.ok) {
          const sendersData = await existingSenderResponse.json();
          existingSender = sendersData.senders?.find((s: any) => s.email === senderEmail);
        }

        let verificationStatus = 'pending';
        
        if (existingSender) {
          console.log('📧 Sender already exists:', { id: existingSender.id, active: existingSender.active });
          if (existingSender.active) {
            verificationStatus = 'verified';
          } else {
            verificationStatus = 'pending';
            console.log('📧 Sender exists but not verified, OTP was already sent during creation');
          }
        } else {
          // Create new sender only if it doesn't exist
          console.log('🔄 Creating new sender for:', senderEmail);
          const brevoResponse = await fetch('https://api.brevo.com/v3/senders', {
            method: 'POST',
            headers: {
              'api-key': process.env.BREVO_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: req.user!.companyName || req.user!.displayName,
              email: senderEmail,
              ips: []
            })
          });

          if (brevoResponse.ok) {
            console.log('✅ New sender created, OTP sent');
            verificationStatus = 'pending';
          } else {
            const errorData = await brevoResponse.json();
            console.error('Brevo sender creation failed:', errorData);
            return res.status(400).json({ error: 'Failed to register email with service' });
          }
        }

        // Update user with sender email and verification status
        await storage.updateUserEmailSettings(uid, senderEmail, verificationStatus);

        if (verificationStatus === 'verified') {
          res.json({ 
            success: true, 
            message: 'Email is already verified! You can now send emails.',
            verificationStatus,
            requiresOtp: false,
            senderEmail: senderEmail
          });
        } else {
          res.json({ 
            success: true, 
            message: existingSender ? 
              'Enter the 6-digit verification code that was sent to your email during initial setup.' : 
              'Email setup initiated. Check your email for a 6-digit verification code.',
            verificationStatus,
            requiresOtp: true,
            senderEmail: senderEmail
          });
        }

      } catch (brevoError) {
        console.error('Brevo API error:', brevoError);
        res.status(500).json({ error: 'Failed to setup email service' });
      }

    } catch (error) {
      console.error('Setup auto email error:', error);
      res.status(500).json({ error: 'Failed to setup auto email' });
    }
  });

  // Send email route with PDF attachment
  app.post('/api/send-email', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { to, toName, subject, body, pdfBase64, pdfFilename, templateType } = req.body;

      // Validate required fields
      if (!to || !subject || !body) {
        return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
      }

      // Check if user has email setup complete
      if (!user.isEmailVerified || !user.senderEmail) {
        return res.status(400).json({ error: 'Email sending not setup. Please complete email verification first.' });
      }

      // Replace template variables in subject and body
      const variables = {
        customerName: toName || to,
        companyName: user.companyName || 'Your Company',
        senderName: user.displayName || user.companyName || 'Eazee Invoice'
      };

      const processedSubject = replaceEmailVariables(subject, variables);
      const processedBody = replaceEmailVariables(body, variables);

      // Generate HTML email content
      const htmlContent = generateEmailHTML(processedBody, user);

      // Prepare attachment if provided
      let attachment;
      if (pdfBase64 && pdfFilename) {
        attachment = {
          content: pdfBase64,
          name: pdfFilename,
          type: 'application/pdf'
        };
      }

      // Send email via Brevo
      await sendEmailWithBrevo(user, {
        to,
        toName,
        subject: processedSubject,
        htmlContent,
        attachment
      });

      res.json({ 
        success: true, 
        message: 'Email sent successfully',
        sentFrom: user.senderEmail 
      });

    } catch (error) {
      console.error('Send email error:', error);
      res.status(500).json({ 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Verify sender with OTP route
  app.post('/api/verify-sender-otp', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { otp } = req.body;
      const user = req.user!;

      console.log('🔍 OTP Verification attempt:', { 
        userEmail: user.senderEmail, 
        otpLength: otp?.length,
        otp: otp?.replace(/\d/g, '*') // Hide actual digits for security
      });

      if (!otp || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({ error: 'Valid 6-digit OTP required' });
      }

      if (!user.senderEmail) {
        return res.status(400).json({ error: 'No sender email setup found' });
      }

      // Get sender ID from Brevo
      const sendersResponse = await fetch(`https://api.brevo.com/v3/senders?email=${user.senderEmail}`, {
        headers: {
          'api-key': process.env.BREVO_API_KEY || ''
        }
      });

      if (!sendersResponse.ok) {
        console.error('❌ Failed to get senders from Brevo:', sendersResponse.status);
        return res.status(400).json({ error: 'Sender not found in Brevo' });
      }

      const sendersData = await sendersResponse.json();
      console.log('📨 Brevo senders response:', JSON.stringify(sendersData, null, 2));
      
      const sender = sendersData.senders?.find((s: any) => s.email === user.senderEmail);

      if (!sender) {
        console.error('❌ Sender not found in response for email:', user.senderEmail);
        return res.status(400).json({ error: 'Sender not found' });
      }

      console.log('📧 Found sender:', { id: sender.id, email: sender.email, active: sender.active });

      // Based on OPTIONS response: PUT method is allowed for /v3/senders/{id}/validate
      console.log(`🔄 Using PUT method with sender ID: ${sender.id}`);
      
      // The documentation shows the OTP should be sent as integer, not string
      const otpAsInteger = parseInt(otp, 10);
      console.log(`📦 Converting OTP to integer:`, otpAsInteger);
      
      const verifyResponse = await fetch(`https://api.brevo.com/v3/senders/${sender.id}/validate`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY || '',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ otp: otpAsInteger })
      });
      
      console.log(`📊 PUT method response status:`, verifyResponse.status);
      
      let successful = false;
      if (verifyResponse.status === 204 || verifyResponse.status === 200) {
        console.log(`✅ SUCCESS with PUT method and integer OTP!`);
        successful = true;
      } else {
        const errorText = await verifyResponse.text();
        console.log(`❌ PUT method failed:`, errorText);
      }

      console.log('🔐 Brevo verify response status:', verifyResponse.status);
      
      if (successful) {
        // Success response from Brevo (204 No Content)
        console.log('✅ OTP verification successful');
        await storage.updateEmailVerificationStatus(user.uid, true, 'verified');
        
        res.json({ 
          success: true, 
          message: 'Email verified successfully! You can now send emails.',
          verified: true 
        });
      } else {
        // All formats failed
        console.error('❌ All verification formats failed');
        
        res.status(400).json({ 
          error: 'invalid_code',
          message: 'The verification code is incorrect or has expired.',
          details: 'Brevo verification codes expire quickly (within 2-3 minutes). If your code is more than a few minutes old, please click "Get New Code" to receive a fresh verification email.'
        });
      }

    } catch (error) {
      console.error('❌ OTP verification error:', error);
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  });

  // Check email verification status route
  app.get('/api/check-email-status', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      
      if (!user.senderEmail) {
        return res.json({ verified: false, status: 'not_setup' });
      }

      // Check verification status with Brevo if needed
      if (process.env.BREVO_API_KEY && user.emailVerificationStatus === 'pending') {
        try {
          const brevoResponse = await fetch(`https://api.brevo.com/v3/senders?email=${user.senderEmail}`, {
            headers: {
              'api-key': process.env.BREVO_API_KEY
            }
          });

          if (brevoResponse.ok) {
            const senders = await brevoResponse.json();
            const sender = senders.senders?.find((s: any) => s.email === user.senderEmail);
            
            if (sender && sender.status === 'verified') {
              // Update verification status in database
              await storage.updateEmailVerificationStatus(user.uid, true, 'verified');
              return res.json({ verified: true, status: 'verified' });
            }
          }
        } catch (brevoError) {
          console.error('Brevo status check error:', brevoError);
        }
      }

      res.json({ 
        verified: user.isEmailVerified || false, 
        status: user.emailVerificationStatus || 'unknown',
        senderEmail: user.senderEmail 
      });

    } catch (error) {
      console.error('Check email status error:', error);
      res.status(500).json({ error: 'Failed to check email status' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}