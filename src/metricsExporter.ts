import * as Sentry from '@sentry/react';
import { flushMetrics } from './metrics';

export async function exportMetrics() {
  const metrics = flushMetrics();

  try {
    // Send metrics as a Sentry breadcrumb for lightweight ingestion
    Sentry.addBreadcrumb({ category: 'metrics', message: 'metrics-flush', data: { metrics } });
  } catch (e) {
    // ignore
  }

  // Also log to console for CI/retention
  // eslint-disable-next-line no-console
  console.log('METRICS_EXPORT', JSON.stringify(metrics));

  return metrics;
}
