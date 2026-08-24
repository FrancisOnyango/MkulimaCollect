import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AgentProfile } from "@/lib/api/types";
import { useApiClient } from "@/components/providers/APIProvider";
import * as SessionManager from "./SessionManager";

type LoginInput = {
  agentId: string;
  password: string;
  orgId: string;
};

type AuthContextValue = {
  agent: AgentProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(input: LoginInput): Promise<void>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { api } = useApiClient();
  const [session, setSessionState] = useState<SessionManager.Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    SessionManager.getSession()
      .then((stored) => {
        if (mounted) {
          setSessionState(stored);
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
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      setIsLoading(true);
      try {
        const deviceId = await SessionManager.getDeviceId();
        const nextSession = await api.authenticate({ ...input, deviceId });
        await SessionManager.setSession(nextSession);
        setSessionState(nextSession);
      } finally {
        setIsLoading(false);
      }
    },
    [api],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await SessionManager.clearSession();
      setSessionState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      agent: session?.agent ?? null,
      isAuthenticated: Boolean(session),
      isLoading,
      login,
      logout,
    }),
    [isLoading, login, logout, session],
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
