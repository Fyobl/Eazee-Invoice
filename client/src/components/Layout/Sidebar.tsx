import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Quote, 
  FileBarChart, 
  Users, 
  Package, 
  BarChart3, 
  Trash2, 
  Settings, 
  User, 
  Shield,
  Mail,
  X,
  CreditCard,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [location] = useLocation();
  const { isAdmin, isSubscriber } = useAuth();

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const mainNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/invoices', label: 'Invoices', icon: FileText },
    { href: '/quotes', label: 'Quotes', icon: Quote },
    { href: '/statements', label: 'Statements', icon: FileBarChart },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/recycle-bin', label: 'Recycle Bin', icon: Trash2 },
    { href: '/help', label: 'Help', icon: HelpCircle },
  ];

  const accountNavItems = [
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/account', label: 'Account', icon: User },
    { href: '/email-settings', label: 'Email Settings', icon: Mail },
  ];

  // Add subscription management - check both regular and admin-granted subscriptions
  const hasAnySubscription = isSubscriber || userData?.isAdminGrantedSubscription;
  
  if (!hasAnySubscription) {
    accountNavItems.push({ href: '/subscribe', label: 'Upgrade to Pro', icon: CreditCard });
  } else {
    accountNavItems.push({ href: '/manage-subscription', label: 'Manage Subscription', icon: CreditCard });
  }

  if (isAdmin) {
    accountNavItems.push({ href: '/admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">Eazee Invoice</span>
          </div>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 space-y-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
                  )}
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          <div className="mt-8 px-4 space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-2">
              Account
            </div>
            {accountNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700"
                  )}
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};
