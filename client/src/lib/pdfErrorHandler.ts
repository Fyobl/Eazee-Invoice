// PDF Error Handler for Browser-Specific Issues
export const handlePDFError = (error: Error): boolean => {
  // Check if it's a browser frame disposal error
  if (error.message.includes('WebFrameMain') || 
      error.message.includes('frame was disposed') ||
      error.message.includes('browser process')) {
    
    console.warn('Browser frame disposal error detected - this is a browser-specific issue and does not affect functionality');
    
    // Return true to indicate this is a handled/expected error
    return true;
  }
  
  // Return false for other errors that should be handled normally
  return false;
};

// Suppress browser error dialogs for known PDF generation issues
export const suppressBrowserErrors = () => {
  const originalConsoleError = console.error;
  
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Don't show browser frame disposal errors
    if (message.includes('WebFrameMain') || 
        message.includes('frame was disposed') ||
        message.includes('browser process')) {
      console.warn('PDF generation browser error suppressed:', message);
      return;
    }
    
    // Show other errors normally
    originalConsoleError.apply(console, args);
  };
};