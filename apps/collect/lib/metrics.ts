export type MetricRecord = { name: string; value: number; tags?: Record<string, string> };

const metrics: MetricRecord[] = [];

export function recordMetric(name: string, value = 1, tags?: Record<string, string>) {
  metrics.push({ name, value, tags });
}

export function flushMetrics(): MetricRecord[] {
  const copy = metrics.slice();
  metrics.length = 0;
  return copy;
}
