import { getAppEnvironment, usesRemoteApi } from "./environment";

describe("api factory environment", () => {
  const original = process.env.EXPO_PUBLIC_ENVIRONMENT;

  afterEach(() => {
    process.env.EXPO_PUBLIC_ENVIRONMENT = original;
  });

  test("preview and production use the remote adapter", () => {
    process.env.EXPO_PUBLIC_ENVIRONMENT = "preview";
    expect(getAppEnvironment()).toBe("preview");
    expect(usesRemoteApi("preview")).toBe(true);
    expect(usesRemoteApi("production")).toBe(true);
    expect(usesRemoteApi("development")).toBe(false);
  });
});
