import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface BannerProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Banner = ({ variant = 'info', children, onClose, className }: BannerProps) => {
  const variants = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={cn('border rounded-lg p-4 flex items-center justify-between', variants[variant], className)}>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-current hover:opacity-70 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
