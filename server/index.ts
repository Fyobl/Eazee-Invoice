import express, { type Request, Response, NextFunction } from "express";
import { setupRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

    // Start database monitoring
    monitorDatabaseConnection();

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
