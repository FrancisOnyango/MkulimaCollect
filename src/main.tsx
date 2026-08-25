import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { initSentry } from './sentry';
import Sentry from './sentry';

// Initialize Sentry early if DSN present
initSentry();

// Global error handlers to capture unhandled rejections and runtime errors in Sentry
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (ev) => {
    try {
      const err = ev.reason instanceof Error ? ev.reason : new Error(String(ev.reason));
      Sentry.captureException(err);
    } catch (e) {
      // swallow
    }
  });

  window.addEventListener('error', (ev) => {
    try {
      Sentry.captureException((ev as ErrorEvent).error || new Error((ev as ErrorEvent).message));
    } catch (e) {
      // swallow
    }
  });
}

// Register service worker in production to enable PWA offline behavior
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failure is non-fatal — app continues to work without SW
    });

    // Listen for SW messages (e.g., to trigger sync)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_NOW') {
        // App-level sync handler should run SyncEngine — placeholder event
        window.dispatchEvent(new Event('MKL_SYNC_NOW'));
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
