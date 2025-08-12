import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with retry and timeout settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 10000, // 10 seconds connection timeout
});

// Add pool error handling
pool.on('error', (err: Error, client: any) => {
  console.error('Unexpected error on idle client:', err);
  // The pool will handle reconnection automatically
});

export const db = drizzle({ client: pool, schema });

// Database connection retry utility
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Check if it's a connection error worth retrying
      const errorString = (error as Error).toString().toLowerCase();
      const retryableErrors = [
        'connection terminated',
        'connection closed',
        'connection lost',
        'socket hang up',
        'econnreset',
        'timeout'
      ];
      
      if (retryableErrors.some(keyword => errorString.includes(keyword))) {
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error; // Don't retry non-connection errors
      }
    }
  }
  // This should never be reached due to the throw in the loop, but TypeScript requires it
  throw new Error('executeWithRetry: All attempts failed');
}