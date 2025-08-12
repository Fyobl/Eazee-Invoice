import express, { type Request, Response, NextFunction } from "express";
import { setupRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import path from "path";

const app = express();
// Increase body size limits to handle PDF attachments (up to 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add CORS headers for external access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Add security headers
app.use((req, res, next) => {
  // Content Security Policy - Prevents XSS attacks
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://script.charaton.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://api.stripe.com https://api.openweathermap.org https://api.open-meteo.com; " +
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );
  
  // X-Frame-Options - Prevents clickjacking attacks
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // X-Content-Type-Options - Prevents MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy - Controls referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy - Controls browser features
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  
  // X-XSS-Protection - Additional XSS protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
});

// Serve attached assets (videos, images, etc.)
app.use('/attached_assets', express.static(path.resolve(import.meta.dirname, '..', 'attached_assets')));

// Add analytics tracking middleware
import { analyticsMiddleware } from './analytics';
app.use(analyticsMiddleware);

// Analytics is now tracking live data only - no sample data generation

// Session middleware
const PgSession = ConnectPgSimple(session);
// Determine if we should use secure cookies
const isSecure = process.env.NODE_ENV === 'production' && 
  (process.env.HTTPS_ENABLED === 'true' || process.env.REPLIT_DB_URL !== undefined);

app.use(session({
  store: new PgSession({
    pool,
    tableName: 'sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset the expiration on each request
  cookie: {
    secure: isSecure,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // Allow cross-site usage for better compatibility
  },
}));



app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Global error handlers for uncaught exceptions
process.on('uncaughtException', (error) => {
  log('Uncaught Exception: ' + error.message);
  console.error('Uncaught Exception:', error);
  
  // Check if it's a database connection error
  if (isDatabaseError(error)) {
    log('Database error detected, attempting restart...');
    gracefulRestart();
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  log('Unhandled Rejection at: ' + promise + ' reason: ' + reason);
  console.error('Unhandled Rejection:', reason);
  
  // Check if it's a database connection error
  if (isDatabaseError(reason)) {
    log('Database error detected, attempting restart...');
    gracefulRestart();
  } else {
    process.exit(1);
  }
});

// Function to check if error is database-related
function isDatabaseError(error: any): boolean {
  if (!error) return false;
  
  const errorString = error.toString().toLowerCase();
  const databaseErrorKeywords = [
    'connection terminated',
    'connection closed',
    'connection lost',
    'database connection',
    'pool terminated',
    'connection timeout',
    'socket hang up',
    'econnreset',
    'enotfound',
    'connection refused'
  ];
  
  return databaseErrorKeywords.some(keyword => errorString.includes(keyword));
}

// Function to gracefully restart the application
function gracefulRestart() {
  log('Initiating graceful restart...');
  
  // Close database connections
  pool.end().catch(err => {
    log('Error closing database pool: ' + err.message);
  });
  
  // Exit the process - the workflow will restart it
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Database connection monitoring
async function monitorDatabaseConnection() {
  setInterval(async () => {
    try {
      await pool.query('SELECT 1');
    } catch (error) {
      log('Database health check failed: ' + (error as Error).message);
      if (isDatabaseError(error)) {
        log('Database connection lost, restarting...');
        gracefulRestart();
      }
    }
  }, 30000); // Check every 30 seconds
}

(async () => {
  try {
    // Health check endpoints for deployment - must be before other routes
    app.get('/health', (_req, res) => {
      res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: process.env.NODE_ENV || 'development'
      });
    });

    // Robots.txt for better SEO and external access
    app.get('/robots.txt', (req, res) => {
      res.type('text/plain');
      res.send(
        'User-agent: *\n' +
        'Allow: /\n' +
        'Allow: /about\n' +
        'Allow: /privacy\n' +
        'Allow: /terms\n' +
        'Allow: /support\n' +
        'Allow: /login\n' +
        'Allow: /register\n' +
        'Disallow: /admin\n' +
        'Disallow: /api/\n' +
        'Disallow: /dashboard\n' +
        'Disallow: /invoices\n' +
        'Disallow: /quotes\n' +
        'Disallow: /statements\n' +
        'Disallow: /customers\n' +
        'Disallow: /products\n' +
        'Disallow: /reports\n' +
        'Disallow: /settings\n' +
        'Disallow: /account\n' +
        'Disallow: /email-settings\n' +
        'Disallow: /manage-subscription\n' +
        'Disallow: /subscribe\n' +
        'Disallow: /recycle-bin\n' +
        '\n' +
        'Crawl-delay: 1\n' +
        '\n' +
        'Sitemap: ' + (req.protocol + '://' + req.get('host') + '/sitemap.xml')
      );
    });

    // Comprehensive sitemap for better discoverability
    app.get('/sitemap.xml', (req, res) => {
      const baseUrl = req.protocol + '://' + req.get('host');
      const currentDate = new Date().toISOString().split('T')[0];
      
      res.type('application/xml');
      res.send(
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        '  <url>\n' +
        '    <loc>' + baseUrl + '/</loc>\n' +
        '    <lastmod>' + currentDate + '</lastmod>\n' +
        '    <changefreq>weekly</changefreq>\n' +
        '    <priority>1.0</priority>\n' +
        '  </url>\n' +
        '  <url>\n' +
        '    <loc>' + baseUrl + '/about</loc>\n' +
        '    <lastmod>' + currentDate + '</lastmod>\n' +
        '    <changefreq>monthly</changefreq>\n' +
        '    <priority>0.8</priority>\n' +
        '  </url>\n' +
        '  <url>\n' +
        '    <loc>' + baseUrl + '/support</loc>\n' +
        '    <lastmod>' + currentDate + '</lastmod>\n' +
        '    <changefreq>monthly</changefreq>\n' +
        '    <priority>0.7</priority>\n' +
        '  </url>\n' +
        '  <url>\n' +
        '    <loc>' + baseUrl + '/privacy</loc>\n' +
        '    <lastmod>' + currentDate + '</lastmod>\n' +
        '    <changefreq>yearly</changefreq>\n' +
        '    <priority>0.5</priority>\n' +
        '  </url>\n' +
        '  <url>\n' +
        '    <loc>' + baseUrl + '/terms</loc>\n' +
        '    <lastmod>' + currentDate + '</lastmod>\n' +
        '    <changefreq>yearly</changefreq>\n' +
        '    <priority>0.5</priority>\n' +
        '  </url>\n' +
        '  <url>\n' +
        '    <loc>' + baseUrl + '/login</loc>\n' +
        '    <lastmod>' + currentDate + '</lastmod>\n' +
        '    <changefreq>yearly</changefreq>\n' +
        '    <priority>0.3</priority>\n' +
        '  </url>\n' +
        '  <url>\n' +
        '    <loc>' + baseUrl + '/register</loc>\n' +
        '    <lastmod>' + currentDate + '</lastmod>\n' +
        '    <changefreq>yearly</changefreq>\n' +
        '    <priority>0.6</priority>\n' +
        '  </url>\n' +
        '</urlset>'
      );
    });

    // Deployment readiness endpoint
    app.get('/ready', async (_req, res) => {
      try {
        // Test database connection
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

    // Simple public endpoint for external services
    app.get('/api/status', (_req, res) => {
      res.status(200).json({
        status: 'online',
        service: 'Eazee Invoice',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    await setupRoutes(app);

    // Enhanced error handler with database error detection
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log the error for debugging
      log('API Error: ' + message);
      console.error('API Error:', err);

      // Check if it's a database error
      if (isDatabaseError(err)) {
        log('Database error in API request, scheduling restart...');
        setTimeout(() => gracefulRestart(), 100);
      }

      res.status(status).json({ message });
    });

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    const host = "0.0.0.0";
    
    const server = app.listen(port, host, () => {
      log(`serving on http://${host}:${port}`);
    });

    // Configure server timeouts for better deployment stability
    server.keepAliveTimeout = 65000; // 65 seconds (longer than most load balancers)
    server.headersTimeout = 66000; // Must be longer than keepAliveTimeout
    server.requestTimeout = 300000; // 5 minutes for long-running requests
    server.timeout = 300000; // 5 minutes socket timeout

    // Start database monitoring
    monitorDatabaseConnection();

    // Graceful shutdown handling for deployment
    const gracefulShutdown = (signal: string) => {
      log(`Received ${signal}, starting graceful shutdown...`);
      
      server.close((err) => {
        if (err) {
          log('Error during server shutdown: ' + err.message);
          process.exit(1);
        }
        
        log('HTTP server closed');
        
        // Close database connections
        pool.end()
          .then(() => {
            log('Database connections closed');
            process.exit(0);
          })
          .catch((poolErr) => {
            log('Error closing database pool: ' + poolErr.message);
            process.exit(1);
          });
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        log('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
  } catch (error) {
    log('Startup error: ' + (error as Error).message);
    console.error('Startup error:', error);
    
    if (isDatabaseError(error)) {
      log('Database error during startup, restarting...');
      gracefulRestart();
    } else {
      process.exit(1);
    }
  }
})();
