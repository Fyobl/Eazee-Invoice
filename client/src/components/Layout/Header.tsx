import { Menu, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export const Header = ({ title, onMenuClick }: HeaderProps) => {
  const { userData, trialDaysLeft } = useAuth();

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {userData && !userData.isSubscriber && trialDaysLeft > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              <Clock className="h-3 w-3 mr-1" />
              {trialDaysLeft} days left in trial
            </Badge>
          )}
          
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(userData?.displayName || userData?.email || 'U')}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-slate-700">
              {userData?.displayName || userData?.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
