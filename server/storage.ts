import { users, customers, products, invoices, quotes, statements, recycleBin, passwordResetTokens, systemSettings, onboardingProgress, type User, type InsertUser, type PasswordResetToken, type InsertPasswordResetToken, type SystemSetting, type InsertSystemSetting, type OnboardingProgress, type InsertOnboardingProgress } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

// Storage interface for user operations
export interface IStorage {
  getUser(uid: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(uid: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateUserSubscriptionStatus(uid: string, status: string, currentPeriodEnd?: Date): Promise<User>;
  deleteUser(uid: string): Promise<boolean>;
  // Authentication methods
  registerUser(email: string, password: string, firstName: string, lastName: string, companyName: string): Promise<User>;
  loginUser(email: string, password: string): Promise<User | null>;
  updatePassword(uid: string, currentPassword: string, newPassword: string): Promise<boolean>;
  // Password reset methods
  createPasswordResetToken(email: string): Promise<string>;
  validatePasswordResetToken(token: string): Promise<PasswordResetToken | null>;
  resetPasswordWithToken(token: string, newPassword: string): Promise<boolean>;
  // Admin password management
  adminSetUserPassword(userUid: string, newPassword: string): Promise<boolean>;
  // System settings methods
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  setSystemSetting(key: string, value: string): Promise<SystemSetting>;
  // Onboarding methods
  getOnboardingProgress(uid: string): Promise<OnboardingProgress | undefined>;
  updateOnboardingProgress(uid: string, updates: Partial<OnboardingProgress>): Promise<OnboardingProgress>;
  createOnboardingProgress(uid: string): Promise<OnboardingProgress>;
  dismissOnboarding(uid: string): Promise<OnboardingProgress>;
}

export class DatabaseStorage implements IStorage {
  async getUser(uid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.uid, uid));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
  async registerUser(email: string, password: string, firstName: string, lastName: string, companyName: string, country?: string): Promise<User> {
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
      country: country || 'GB', // Use detected country or default to GB
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

  async deleteUser(uid: string): Promise<boolean> {
    try {
      // Delete all user's data in the correct order to avoid foreign key conflicts
      await db.delete(recycleBin).where(eq(recycleBin.uid, uid));
      await db.delete(statements).where(eq(statements.uid, uid));
      await db.delete(quotes).where(eq(quotes.uid, uid));
      await db.delete(invoices).where(eq(invoices.uid, uid));
      await db.delete(products).where(eq(products.uid, uid));
      await db.delete(customers).where(eq(customers.uid, uid));

      
      // Finally delete the user
      const result = await db.delete(users).where(eq(users.uid, uid));
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Password reset methods
  async createPasswordResetToken(email: string): Promise<string> {
    // Clean up expired tokens first
    await db.delete(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.email, email),
        gt(passwordResetTokens.expiresAt, new Date())
      ));

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    const tokenData: InsertPasswordResetToken = {
      email,
      token,
      expiresAt,
      used: false
    };

    await db.insert(passwordResetTokens).values(tokenData);
    return token;
  }

  async validatePasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, new Date())
      ));

    return resetToken || null;
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    const resetToken = await this.validatePasswordResetToken(token);
    if (!resetToken) {
      return false;
    }

    const user = await this.getUserByEmail(resetToken.email);
    if (!user) {
      return false;
    }

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password
    await db.update(users)
      .set({ 
        passwordHash,
        mustChangePassword: false,
        updatedAt: new Date()
      })
      .where(eq(users.uid, user.uid));

    // Mark token as used
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return true;
  }

  // Admin password management
  async adminSetUserPassword(userUid: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.getUser(userUid);
      if (!user) {
        return false;
      }

      // Hash the new password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update user's password
      await db.update(users)
        .set({ 
          passwordHash,
          mustChangePassword: false,
          updatedAt: new Date()
        })
        .where(eq(users.uid, userUid));

      return true;
    } catch (error) {
      console.error('Error setting user password:', error);
      return false;
    }
  }

  // System settings methods
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async setSystemSetting(key: string, value: string): Promise<SystemSetting> {
    // Try to update existing setting first
    const existing = await this.getSystemSetting(key);
    
    if (existing) {
      const [updated] = await db.update(systemSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemSettings.key, key))
        .returning();
      return updated;
    } else {
      // Create new setting
      const [created] = await db.insert(systemSettings)
        .values({ key, value })
        .returning();
      return created;
    }
  }

  // Onboarding methods
  async getOnboardingProgress(uid: string): Promise<OnboardingProgress | undefined> {
    const [progress] = await db.select().from(onboardingProgress).where(eq(onboardingProgress.uid, uid));
    return progress || undefined;
  }

  async createOnboardingProgress(uid: string): Promise<OnboardingProgress> {
    const progressData: InsertOnboardingProgress = {
      uid,
      companyBrandingComplete: false,
      logoUploaded: false,
      firstCustomerAdded: false,
      firstProductAdded: false,
      firstQuoteCreated: false,
      firstInvoiceCreated: false,
      firstQuoteConverted: false,
      isOnboardingDismissed: false
    };

    const [progress] = await db
      .insert(onboardingProgress)
      .values(progressData)
      .returning();
    return progress;
  }

  async updateOnboardingProgress(uid: string, updates: Partial<OnboardingProgress>): Promise<OnboardingProgress> {
    // First try to get existing progress
    let progress = await this.getOnboardingProgress(uid);
    
    if (!progress) {
      // Create if doesn't exist
      progress = await this.createOnboardingProgress(uid);
    }

    const [updated] = await db
      .update(onboardingProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(onboardingProgress.uid, uid))
      .returning();
    return updated;
  }

  async dismissOnboarding(uid: string): Promise<OnboardingProgress> {
    return this.updateOnboardingProgress(uid, { isOnboardingDismissed: true });
  }

}

export const storage = new DatabaseStorage();
