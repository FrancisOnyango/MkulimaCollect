import * as Sentry from "@sentry/react";
import { flushMetrics } from "./metrics";

export async function exportMetrics() {
  const metrics = flushMetrics();

  try {
    Sentry.addBreadcrumb({ category: "metrics", message: "metrics-flush", data: { metrics } });
  } catch {
    // Metrics must not interrupt synchronization.
  }

  return metrics;
}
