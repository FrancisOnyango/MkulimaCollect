import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AgentProfile } from "@/lib/api/types";
import { useApiClient } from "@/components/providers/APIProvider";
import { useDatabase } from "@/components/providers/DBProvider";
import { getAppVersion, isVersionSupported } from "@/lib/appVersion";
import { MetadataKey, setMetadata } from "@/lib/db/metadataRepository";
import * as SessionManager from "./SessionManager";
import { saveLocalAgent } from "./localAgentRepository";

type LoginInput = {
  agentId: string;
  password: string;
  orgId: string;
};

type AuthContextValue = {
  agent: AgentProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  upgradeRequired: boolean;
  minSupportedVersion: string | null;
  login(input: LoginInput): Promise<void>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const { api } = useApiClient();
  const [session, setSessionState] = useState<SessionManager.Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [minSupportedVersion, setMinSupportedVersion] = useState<string | null>(null);

  const applyBootstrap = useCallback(
    async (agentId: string) => {
      const bootstrap = await api.getBootstrapConfig(agentId);
      setMinSupportedVersion(bootstrap.minSupportedVersion);
      await setMetadata(db, MetadataKey.MIN_SUPPORTED_VERSION, bootstrap.minSupportedVersion);
      if (!isVersionSupported(getAppVersion(), bootstrap.minSupportedVersion)) {
        setUpgradeRequired(true);
        return false;
      }
      setUpgradeRequired(false);
      return true;
    },
    [api, db],
  );

  useEffect(() => {
    let mounted = true;

    SessionManager.getStoredSession()
      .then(async (stored) => {
        if (!stored) {
          return;
        }

        try {
          const next = await SessionManager.refreshIfNeeded(api, stored);
          if (!mounted) {
            return;
          }
          setSessionState(next);
          await saveLocalAgent(db, next.agent);
          await applyBootstrap(next.agent.id);
        } catch {
          await SessionManager.clearSession();
          if (mounted) {
            setSessionState(null);
          }
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [api, applyBootstrap, db]);

  const login = useCallback(
    async (input: LoginInput) => {
      setIsLoading(true);
      try {
        const deviceId = await SessionManager.getDeviceId();
        const nextSession = await api.authenticate({ ...input, deviceId });
        await SessionManager.setSession(nextSession);
        await saveLocalAgent(db, nextSession.agent);
        await applyBootstrap(nextSession.agent.id);
        setSessionState(nextSession);
      } finally {
        setIsLoading(false);
      }
    },
    [api, applyBootstrap, db],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      const deviceId = await SessionManager.getDeviceId();
      try {
        await api.revokeDevice(deviceId);
      } catch {
        // Local logout still proceeds.
      }
      await SessionManager.clearSession();
      setSessionState(null);
      setUpgradeRequired(false);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const value = useMemo<AuthContextValue>(
    () => ({
      agent: session?.agent ?? null,
      isAuthenticated: Boolean(session),
      isLoading,
      upgradeRequired,
      minSupportedVersion,
      login,
      logout,
    }),
    [isLoading, login, logout, minSupportedVersion, session, upgradeRequired],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
