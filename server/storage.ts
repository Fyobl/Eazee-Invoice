import { users, customers, products, invoices, quotes, statements, companies, recycleBin, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

// Storage interface for user operations
export interface IStorage {
  getUser(uid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(uid: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateUserSubscriptionStatus(uid: string, status: string, currentPeriodEnd?: Date): Promise<User>;
  // Authentication methods
  registerUser(email: string, password: string, firstName: string, lastName: string, companyName: string): Promise<User>;
  loginUser(email: string, password: string): Promise<User | null>;
  updatePassword(uid: string, currentPassword: string, newPassword: string): Promise<boolean>;
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

  // Authentication methods
  async registerUser(email: string, password: string, firstName: string, lastName: string, companyName: string): Promise<User> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const uid = uuidv4();
    
    const userData: InsertUser = {
      uid,
      email,
      passwordHash,
      firstName,
      lastName,
      companyName,
      displayName: `${firstName} ${lastName}`,
      trialStartDate: new Date(),
      isSubscriber: false,
      isSuspended: false,
      isAdmin: false,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }
    
    // Check if user is suspended
    if (user.isSuspended) {
      return null;
    }
    
    return user;
  }

  async updatePassword(uid: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(uid);
    if (!user || !user.passwordHash) {
      return false;
    }
    
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return false;
    }
    
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    await db
      .update(users)
      .set({ 
        passwordHash: newPasswordHash,
        mustChangePassword: false,
        updatedAt: new Date()
      })
      .where(eq(users.uid, uid));
    
    return true;
  }


}

export const storage = new DatabaseStorage();
