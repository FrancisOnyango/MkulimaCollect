export type AppEnvironment = "development" | "preview" | "production";

export function getAppEnvironment(): AppEnvironment {
  const value = process.env.EXPO_PUBLIC_ENVIRONMENT;

  if (value === "production" || value === "preview" || value === "development") {
    return value;
  }

  return "development";
}

export function usesRemoteApi(environment: AppEnvironment = getAppEnvironment()): boolean {
  return environment === "preview" || environment === "production";
}
