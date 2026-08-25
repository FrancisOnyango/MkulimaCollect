import * as Sentry from '@sentry/react';

export function initSentry() {
  try {
    const dsn = (import.meta as any).env?.VITE_SENTRY_DSN || process.env.VITE_SENTRY_DSN || process.env.SENTRY_DSN;
    if (!dsn) return;

    Sentry.init({
      dsn,
      tracesSampleRate: 0.05,
    });
  } catch (e) {
    // Ignore init failures to avoid breaking the app when Sentry isn't available
  }
}

export default Sentry;
