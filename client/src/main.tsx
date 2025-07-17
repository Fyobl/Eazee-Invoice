import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

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

// Override window.onerror to prevent error dialogs
const originalWindowOnError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  console.log('Window onerror triggered:', {
    message: message,
    source: source,
    lineno: lineno,
    colno: colno,
    error: error
  });
  
  // Suppress PDF-related errors
  if (typeof message === 'string' && (
    message.includes('WebFrameMain') ||
    message.includes('frame was disposed') ||
    message.includes('emitter.emit') ||
    message.includes('browser_init.js2') ||
    message.includes('Render frame was disposed')
  )) {
    console.warn('PDF generation window error suppressed:', message);
    return true; // Prevent default error handling
  }
  
  // Call original handler for other errors
  return originalWindowOnError ? originalWindowOnError(message, source, lineno, colno, error) : false;
};

createRoot(document.getElementById("root")!).render(<App />);
