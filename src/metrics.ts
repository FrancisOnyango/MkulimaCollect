// Simple in-memory metrics collector for local aggregation and CI-friendly output
export type MetricRecord = { name: string; value: number; tags?: Record<string, string> };

const metrics: MetricRecord[] = [];

export function recordMetric(name: string, value = 1, tags?: Record<string, string>) {
  metrics.push({ name, value, tags });
}

export function flushMetrics(): MetricRecord[] {
  const copy = metrics.slice();
  metrics.length = 0;
  // In CI or production, send these to the configured exporter (Sentry/Prometheus). For now, log.
  // Consumer can import and send elsewhere.
  // eslint-disable-next-line no-console
  console.log('METRICS_FLUSH', JSON.stringify(copy));
  return copy;
}
