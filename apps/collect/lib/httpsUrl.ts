export function assertHttpsUrl(url: string, allowLocalHttp = false): string {
  const normalized = url.replace(/\/+$/, "");

  if (normalized.startsWith("https://")) {
    return normalized;
  }

  if (allowLocalHttp && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(normalized)) {
    return normalized;
  }

  throw new Error("MkulimaCollect requires an HTTPS API base URL.");
}
