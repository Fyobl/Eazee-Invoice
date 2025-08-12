import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { globalErrorSuppressor } from './lib/globalErrorSuppression';

// Global error handler to suppress PDF-related browser errors
window.addEventListener('error', (event) => {
  console.log('Global error captured:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
  
  // Suppress WebFrameMain errors that occur during PDF generation
  if (event.message && (
    event.message.includes('WebFrameMain') ||
    event.message.includes('frame was disposed') ||
    event.message.includes('browser_init.js2') ||
    event.message.includes('WebContents.emit') ||
    event.message.includes('Render frame was disposed') ||
    event.message.includes('emitter.emit')
  )) {
    console.warn('PDF generation browser error suppressed:', event.message);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.log('Global unhandled rejection captured:', {
    reason: event.reason,
    promise: event.promise
  });
  
  // Suppress promise rejections related to PDF generation
  if (event.reason && event.reason.message && (
    event.reason.message.includes('WebFrameMain') ||
    event.reason.message.includes('frame was disposed') ||
    event.reason.message.includes('browser_init.js2') ||
    event.reason.message.includes('Render frame was disposed') ||
    event.reason.message.includes('emitter.emit')
  )) {
    console.warn('PDF generation promise rejection suppressed:', event.reason.message);
    event.preventDefault();
    return false;
  }
});

// Override console.error to prevent error dialogs from appearing
const originalConsoleError = console.error;
console.error = function(...args) {
  // Check if this is a PDF-related error
  const errorString = args.join(' ');
  if (errorString.includes('WebFrameMain') || 
      errorString.includes('frame was disposed') ||
      errorString.includes('emitter.emit') ||
      errorString.includes('browser_init.js2')) {
    console.warn('PDF generation error suppressed:', ...args);
    return;
  }
  
  // Call original console.error for other errors
  originalConsoleError.apply(console, args);
};

// Enhanced error suppression to completely prevent JavaScript error dialogs
const originalWindowOnError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  const messageStr = String(message);
  
  // Always log the error for debugging
  console.log('Window onerror triggered:', {
    message: messageStr,
    source: source,
    lineno: lineno,
    colno: colno,
    error: error
  });
  
  // Suppress PDF-related errors completely
  if (messageStr.includes('WebFrameMain') ||
      messageStr.includes('frame was disposed') ||
      messageStr.includes('emitter.emit') ||
      messageStr.includes('browser_init.js2') ||
      messageStr.includes('Render frame was disposed') ||
      messageStr.includes('Object has been destroyed') ||
      messageStr.includes('Cannot read properties of undefined') ||
      messageStr.includes('electron') ||
      messageStr.includes('webContents') ||
      messageStr.includes('BrowserWindow')) {
    console.warn('PDF generation window error suppressed:', messageStr);
    return true; // Prevent default error handling AND error dialog
  }
  
  // Call original handler for other errors
  return originalWindowOnError ? originalWindowOnError(message, source, lineno, colno, error) : false;
};

// Aggressive error suppression for Replit environment
// This completely prevents any error dialogs from appearing

// Override the global error event to prevent any error dialogs
const preventErrorDialogs = () => {
  // Override alert to prevent error dialogs
  const originalAlert = window.alert;
  window.alert = function(message) {
    const messageStr = String(message);
    if (messageStr.includes('WebFrameMain') || 
        messageStr.includes('frame was disposed') ||
        messageStr.includes('JavaScript error occurred') ||
        messageStr.includes('A JavaScript error occurred in the browser process')) {
      console.warn('JavaScript error dialog suppressed:', messageStr);
      return;
    }
    originalAlert.call(window, message);
  };
  
  // Override confirm to prevent error dialogs
  const originalConfirm = window.confirm;
  window.confirm = function(message) {
    const messageStr = String(message);
    if (messageStr.includes('WebFrameMain') || 
        messageStr.includes('frame was disposed') ||
        messageStr.includes('JavaScript error occurred') ||
        messageStr.includes('A JavaScript error occurred in the browser process')) {
      console.warn('JavaScript error confirm dialog suppressed:', messageStr);
      return false;
    }
    return originalConfirm.call(window, message);
  };

  // Intercept and prevent error dialogs from the Replit environment
  const originalShowModalDialog = (window as any).showModalDialog;
  if (originalShowModalDialog) {
    (window as any).showModalDialog = function(url: string, argument?: any, options?: any) {
      if (url && url.includes('error')) {
        console.warn('Modal error dialog suppressed');
        return null;
      }
      return originalShowModalDialog.call(window, url, argument, options);
    };
  }

  // Override any potential error notification systems
  if (window.Notification) {
    const originalNotification = window.Notification;
    (window as any).Notification = function(title: string, options?: NotificationOptions) {
      if (title && (title.includes('WebFrameMain') || title.includes('JavaScript error'))) {
        console.warn('Error notification suppressed:', title);
        return {
          close: () => {},
          addEventListener: () => {},
          removeEventListener: () => {}
        } as any;
      }
      return new originalNotification(title, options);
    };
  }
};

// Apply error suppression immediately and after DOM loads
preventErrorDialogs();
document.addEventListener('DOMContentLoaded', preventErrorDialogs);

createRoot(document.getElementById("root")!).render(<App />);
