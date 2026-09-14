import { getAppEnvironment, usesRemoteApi } from "./environment";

describe("api factory environment", () => {
  const originalEnv = process.env.EXPO_PUBLIC_ENVIRONMENT;
  const originalUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_ENVIRONMENT = originalEnv;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalUrl;
  });

  test("preview and production use the remote adapter", () => {
    process.env.EXPO_PUBLIC_ENVIRONMENT = "preview";
    expect(getAppEnvironment()).toBe("preview");
    expect(usesRemoteApi("preview")).toBe(true);
    expect(usesRemoteApi("production")).toBe(true);
  });

  test("development uses the mock adapter when no API base URL is set", () => {
    process.env.EXPO_PUBLIC_ENVIRONMENT = "development";
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(usesRemoteApi("development")).toBe(false);
  });

  test("development uses the remote adapter when an API base URL is set", () => {
    process.env.EXPO_PUBLIC_ENVIRONMENT = "development";
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://127.0.0.1:8088";
    expect(usesRemoteApi("development")).toBe(true);
  });
});
