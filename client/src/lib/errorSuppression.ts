// Error suppression utility for PDF generation in Replit environment
export class ErrorSuppressor {
  private originalHandlers: {
    windowError: ((event: ErrorEvent) => void | boolean) | null;
    unhandledRejection: ((event: PromiseRejectionEvent) => void | boolean) | null;
    consoleError: (...args: any[]) => void;
  } = {
    windowError: null,
    unhandledRejection: null,
    consoleError: console.error
  };

  private isActive = false;

  activate() {
    if (this.isActive) return;
    
    console.log('Activating comprehensive error suppression for PDF generation');
    
    // Store original handlers
    this.originalHandlers.windowError = window.onerror;
    this.originalHandlers.unhandledRejection = window.onunhandledrejection;
    this.originalHandlers.consoleError = console.error;
    
    // Override window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      if (typeof message === 'string' && this.isPDFRelatedError(message)) {
        console.warn('PDF generation error suppressed:', message);
        return true; // Prevent error dialog
      }
      return this.originalHandlers.windowError 
        ? this.originalHandlers.windowError.call(window, message, source, lineno, colno, error)
        : false;
    };
    
    // Override unhandled rejection
    window.onunhandledrejection = (event) => {
      if (event.reason && event.reason.message && this.isPDFRelatedError(event.reason.message)) {
        console.warn('PDF generation promise rejection suppressed:', event.reason.message);
        event.preventDefault();
        return true;
      }
      return this.originalHandlers.unhandledRejection 
        ? this.originalHandlers.unhandledRejection.call(window, event)
        : false;
    };
    
    // Override console.error
    console.error = (...args) => {
      const errorString = args.join(' ');
      if (this.isPDFRelatedError(errorString)) {
        console.warn('PDF generation console error suppressed:', ...args);
        return;
      }
      this.originalHandlers.consoleError.apply(console, args);
    };
    
    this.isActive = true;
  }

  deactivate() {
    if (!this.isActive) return;
    
    console.log('Deactivating error suppression');
    
    // Restore original handlers
    window.onerror = this.originalHandlers.windowError;
    window.onunhandledrejection = this.originalHandlers.unhandledRejection;
    console.error = this.originalHandlers.consoleError;
    
    this.isActive = false;
  }

  private isPDFRelatedError(message: string): boolean {
    const pdfErrorPatterns = [
      'WebFrameMain',
      'frame was disposed',
      'emitter.emit',
      'browser_init.js2',
      'Render frame was disposed',
      'WebContents.emit',
      'WebContents.<anonymous>',
      'node:events:518',
      'node:events:531'
    ];
    
    // Don't suppress mailto or email-related errors
    if (message.includes('mailto') || message.includes('email') || message.includes('mail')) {
      return false;
    }
    
    return pdfErrorPatterns.some(pattern => message.includes(pattern));
  }

  // Auto-cleanup with timeout
  activateWithTimeout(timeoutMs: number = 10000) {
    this.activate();
    setTimeout(() => {
      this.deactivate();
    }, timeoutMs);
  }
}

// Global instance
export const errorSuppressor = new ErrorSuppressor();

// Helper function for newly created documents
export const suppressErrorsForNewDocument = (document: any) => {
  const isNewlyCreated = document.createdAt && 
    new Date(document.createdAt) > new Date(Date.now() - 120000); // 2 minutes
    
  if (isNewlyCreated) {
    console.log('Detected newly created document - activating targeted error suppression');
    errorSuppressor.activateWithTimeout(8000); // 8 seconds - shorter timeout
    return true;
  }
  
  return false;
};