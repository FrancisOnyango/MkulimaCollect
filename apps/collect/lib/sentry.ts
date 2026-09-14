import * as Sentry from "@sentry/react";
import { getAppEnvironment } from "@/lib/api/environment";
import { getAppVersion } from "@/lib/appVersion";

let initialized = false;

export function initSentry(): void {
  if (initialized) {
    return;
  }

  initialized = true;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();

  Sentry.init({
    dsn: dsn || undefined,
    enabled: Boolean(dsn),
    environment: getAppEnvironment(),
    release: `mkulimacollect@${getAppVersion()}`,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.authorization;
      }
      if (event.extra) {
        delete event.extra.accessToken;
        delete event.extra.refreshToken;
        delete event.extra.nationalId;
        delete event.extra.idNumber;
      }
      return event;
    },
  });
}
