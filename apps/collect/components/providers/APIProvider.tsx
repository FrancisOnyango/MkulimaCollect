import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { MkulimaScoreApi } from "@/lib/api/ApiClient";
import { createApiClient, getAppEnvironment, type AppEnvironment } from "@/lib/api";

type APIContextValue = {
  api: MkulimaScoreApi;
  environment: AppEnvironment;
};

const APIContext = createContext<APIContextValue | null>(null);

export function APIProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      api: createApiClient(),
      environment: getAppEnvironment(),
    }),
    [],
  );

  return <APIContext.Provider value={value}>{children}</APIContext.Provider>;
}

export function useApiClient() {
  const context = useContext(APIContext);

  if (!context) {
    throw new Error("useApiClient must be used inside APIProvider");
  }

  return context;
}
