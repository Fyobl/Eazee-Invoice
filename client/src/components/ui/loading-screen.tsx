import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export const LoadingScreen = ({ 
  message = "Loading...", 
  className = "" 
}: LoadingScreenProps) => {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};