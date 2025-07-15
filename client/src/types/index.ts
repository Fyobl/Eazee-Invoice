export type UserRole = 'trial' | 'subscriber' | 'admin';

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  trialStartDate: Date;
  trialDaysLeft: number;
  isSubscriber: boolean;
  isSuspended: boolean;
  isAdmin: boolean;
}

export interface FormState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface FilterOption {
  value: string;
  label: string;
}
