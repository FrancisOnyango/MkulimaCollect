import type { MkulimaScoreApi } from "./ApiClient";
import { LocalDevelopmentAdapter } from "./adapters/LocalDevelopmentAdapter";
import { ProductionApiAdapter } from "./adapters/ProductionApiAdapter";
import { getAppEnvironment, usesRemoteApi } from "./environment";

export type { AppEnvironment } from "./environment";
export { getAppEnvironment, usesRemoteApi };

export function createApiClient(): MkulimaScoreApi {
  if (usesRemoteApi()) {
    return new ProductionApiAdapter();
  }

  return new LocalDevelopmentAdapter();
}
