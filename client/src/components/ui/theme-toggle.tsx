import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" />
      ) : (
        <Sun className="h-4 w-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" />
      )}
    </Button>
  );
};