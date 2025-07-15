export interface User {
  uid: string;
  email: string;
  displayName?: string;
  trialStartDate: Date;
  isSubscriber: boolean;
  isSuspended: boolean;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  uid: string;
  name: string;
  logo?: string;
  address: string;
  vatNumber?: string;
  registrationNumber?: string;
  currency: string;
  dateFormat: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  uid: string;
  name: string;
  description?: string;
  unitPrice: number;
  taxRate: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  uid: string;
  number: string;
  customerId: string;
  customerName: string;
  date: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quote {
  id: string;
  uid: string;
  number: string;
  customerId: string;
  customerName: string;
  date: Date;
  validUntil: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Statement {
  id: string;
  uid: string;
  number: string;
  customerId: string;
  customerName: string;
  date: Date;
  startDate: Date;
  endDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecycleBinItem {
  id: string;
  uid: string;
  originalId: string;
  type: 'invoice' | 'quote' | 'statement' | 'customer' | 'product';
  data: any;
  deletedAt: Date;
}

export type DocumentType = 'invoice' | 'quote' | 'statement';
