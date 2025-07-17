import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handler to suppress PDF-related browser errors
window.addEventListener('error', (event) => {
  // Suppress WebFrameMain errors that occur during PDF generation
  if (event.message && (
    event.message.includes('WebFrameMain') ||
    event.message.includes('frame was disposed') ||
    event.message.includes('browser_init.js2') ||
    event.message.includes('WebContents.emit')
  )) {
    console.warn('PDF generation browser error suppressed:', event.message);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  // Suppress promise rejections related to PDF generation
  if (event.reason && event.reason.message && (
    event.reason.message.includes('WebFrameMain') ||
    event.reason.message.includes('frame was disposed') ||
    event.reason.message.includes('browser_init.js2')
  )) {
    console.warn('PDF generation promise rejection suppressed:', event.reason.message);
    event.preventDefault();
    return false;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
