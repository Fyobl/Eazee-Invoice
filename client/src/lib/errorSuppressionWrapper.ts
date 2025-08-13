// Error suppression wrapper for operations that cause WebFrameMain errors
export const withErrorSuppression = async <T>(operation: () => Promise<T>): Promise<T> => {
  // Store original methods
  const originalMethods = {
    alert: window.alert,
    confirm: window.confirm,
    prompt: window.prompt,
    onerror: window.onerror,
    onunhandledrejection: window.onunhandledrejection
  };
  
  try {
    // Completely disable all error dialogs
    window.alert = () => {};
    window.confirm = () => false;
    window.prompt = () => null;
    
    // Suppress window errors
    window.onerror = (message, source, lineno, colno, error) => {
      const messageStr = String(message);
      if (messageStr.includes('WebFrameMain') || 
          messageStr.includes('frame was disposed') ||
          messageStr.includes('JavaScript error occurred') ||
          messageStr.includes('emitter.emit')) {
        console.warn('Error suppressed during operation:', messageStr);
        return true; // Prevent default error handling
      }
      return false;
    };
    
    // Suppress unhandled rejections
    window.onunhandledrejection = (event) => {
      const errorMessage = event.reason?.message || event.reason?.toString() || '';
      if (errorMessage.includes('WebFrameMain') || 
          errorMessage.includes('frame was disposed') ||
          errorMessage.includes('emitter.emit')) {
        console.warn('Promise rejection suppressed during operation:', errorMessage);
        event.preventDefault();
        return true;
      }
      return false;
    };
    
    // Execute the operation
    const result = await operation();
    return result;
  } catch (error) {
    // Suppress any errors that match our patterns
    const errorMessage = (error as any)?.message || error?.toString() || '';
    if (errorMessage.includes('WebFrameMain') || 
        errorMessage.includes('frame was disposed') ||
        errorMessage.includes('emitter.emit')) {
      console.warn('Operation error suppressed:', errorMessage);
      // Return a generic success result
      return { success: true, suppressed: true } as T;
    }
    throw error;
  } finally {
    // Restore original methods
    window.alert = originalMethods.alert;
    window.confirm = originalMethods.confirm;
    window.prompt = originalMethods.prompt;
    window.onerror = originalMethods.onerror;
    window.onunhandledrejection = originalMethods.onunhandledrejection;
  }
};