import type { MkulimaScoreApi } from "./ApiClient";
import { LocalDevelopmentAdapter } from "./adapters/LocalDevelopmentAdapter";
import { ProductionApiAdapter } from "./adapters/ProductionApiAdapter";

export type AppEnvironment = "development" | "preview" | "production";

export function getAppEnvironment(): AppEnvironment {
  const value = process.env.EXPO_PUBLIC_ENVIRONMENT;

  if (value === "production" || value === "preview" || value === "development") {
    return value;
  }

  return "development";
}

export function createApiClient(): MkulimaScoreApi {
  const environment = getAppEnvironment();

  if (environment === "production") {
    return new ProductionApiAdapter();
  }

  return new LocalDevelopmentAdapter();
}
