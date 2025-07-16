import { users, customers, products, invoices, quotes, statements, companies, recycleBin, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Storage interface for user operations
export interface IStorage {
  getUser(uid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(uid: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateUserSubscriptionStatus(uid: string, status: string, currentPeriodEnd?: Date): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(uid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.uid, uid));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserStripeInfo(uid: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId, 
        stripeSubscriptionId,
        isSubscriber: true,
        updatedAt: new Date()
      })
      .where(eq(users.uid, uid))
      .returning();
    return user;
  }

  async updateUserSubscriptionStatus(uid: string, status: string, currentPeriodEnd?: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        subscriptionStatus: status,
        subscriptionCurrentPeriodEnd: currentPeriodEnd,
        isSubscriber: status === 'active',
        updatedAt: new Date()
      })
      .where(eq(users.uid, uid))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
