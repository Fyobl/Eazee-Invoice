import { type User } from "@shared/schema";

// Storage interface for user operations
export interface IStorage {
  getUser(uid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(uid: string): Promise<User | undefined> {
    return this.users.get(uid);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = { 
      ...userData, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.uid, user);
    return user;
  }
}

export const storage = new MemStorage();
