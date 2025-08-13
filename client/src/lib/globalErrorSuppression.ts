// Global error suppression for Replit environment
// This prevents WebFrameMain errors from showing as JavaScript error dialogs

class GlobalErrorSuppressor {
  private static instance: GlobalErrorSuppressor;
  private originalHandlers: {
    windowError: ((event: ErrorEvent) => void | boolean) | null;
    unhandledRejection: ((event: PromiseRejectionEvent) => void | boolean) | null;
    consoleError: (...args: any[]) => void;
  };
  private isActive = false;

  constructor() {
    this.originalHandlers = {
      windowError: null,
      unhandledRejection: null,
      consoleError: console.error
    };
  }

  static getInstance(): GlobalErrorSuppressor {
    if (!GlobalErrorSuppressor.instance) {
      GlobalErrorSuppressor.instance = new GlobalErrorSuppressor();
    }
    return GlobalErrorSuppressor.instance;
  }

  private suppressedErrorPatterns = [
    'WebFrameMain',
    'frame was disposed',
    'browser_init.js2',
    'emitter.emit',
    'Render frame was disposed',
    'Object has been destroyed',
    'Cannot read properties of undefined',
    'Cannot read property',
    'electron',
    'webContents',
    'BrowserWindow',
    'node_modules/@s',
    'browser_init.js',
    'emitter.js'
  ];

  private shouldSuppressError(message: string): boolean {
    return this.suppressedErrorPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  activate() {
    if (this.isActive) return;
    
    console.log('Activating global error suppression for Replit environment');
    
    // Store original handlers
    this.originalHandlers.windowError = window.onerror;
    this.originalHandlers.unhandledRejection = window.onunhandledrejection;
    this.originalHandlers.consoleError = console.error;
    
    // Override window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      if (typeof message === 'string' && this.shouldSuppressError(message)) {
        console.warn('Global error suppressed:', message);
        return true; // Prevent error dialog
      }
      return this.originalHandlers.windowError 
        ? this.originalHandlers.windowError(message)
        : false;
    };
    
    // Override unhandled rejection
    window.onunhandledrejection = (event) => {
      const errorMessage = event.reason?.message || event.reason?.toString() || '';
      if (this.shouldSuppressError(errorMessage)) {
        console.warn('Global promise rejection suppressed:', errorMessage);
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
      if (this.shouldSuppressError(errorString)) {
        console.warn('Global console error suppressed:', ...args);
        return;
      }
      this.originalHandlers.consoleError.apply(console, args);
    };
    
    this.isActive = true;
  }

  deactivate() {
    if (!this.isActive) return;
    
    console.log('Deactivating global error suppression');
    
    // Restore original handlers
    window.onerror = this.originalHandlers.windowError as OnErrorEventHandler;
    window.onunhandledrejection = this.originalHandlers.unhandledRejection;
    console.error = this.originalHandlers.consoleError;
    
    this.isActive = false;
  }
}

export const globalErrorSuppressor = GlobalErrorSuppressor.getInstance();

// Auto-activate in Replit environment
if (typeof window !== 'undefined' && window.location.hostname.includes('replit')) {
  globalErrorSuppressor.activate();
}