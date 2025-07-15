import { Menu, Clock, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { logoutUser } from '@/lib/auth';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export const Header = ({ title, onMenuClick }: HeaderProps) => {
  const { userData, trialDaysLeft } = useAuth();

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const getDisplayName = () => {
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    return userData?.displayName || userData?.email || 'User';
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      // Redirect will be handled by the AuthContext
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-slate-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {userData && !userData.isSubscriber && trialDaysLeft > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              <Clock className="h-3 w-3 mr-1" />
              {trialDaysLeft} days left in trial
            </Badge>
          )}
          
          <ThemeToggle />
          
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(getDisplayName())}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200">
              Hi {userData?.firstName || userData?.displayName || userData?.email}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
