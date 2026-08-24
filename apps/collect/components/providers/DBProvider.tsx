import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { type AppDatabase, openAppDatabase } from "@/lib/db/database";

type DBContextValue = {
  db: AppDatabase;
};

const DBContext = createContext<DBContextValue | null>(null);

export function DBProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<AppDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    openAppDatabase()
      .then((database) => {
        if (mounted) {
          setDb(database);
        }
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : "Database initialization failed");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => (db ? { db } : null), [db]);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: Colors.surface }}>
        <Text style={{ color: Colors.redField, fontSize: 16, fontWeight: "600", textAlign: "center" }}>Database startup failed</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 8, textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  if (!value) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface }}>
        <ActivityIndicator color={Colors.brand} />
        <Text style={{ color: Colors.charcoal500, marginTop: 12 }}>Preparing offline storage</Text>
      </View>
    );
  }

  return <DBContext.Provider value={value}>{children}</DBContext.Provider>;
}

export function useDatabase() {
  const context = useContext(DBContext);

  if (!context) {
    throw new Error("useDatabase must be used inside DBProvider");
  }

  return context.db;
}
