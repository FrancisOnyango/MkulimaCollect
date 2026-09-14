import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { getActiveSession, resumePathForSession } from "@/features/farmers/collectionSessionRepository";

export default function CollectIndex() {
  const db = useDatabase();

  useEffect(() => {
    void getActiveSession(db).then((session) => {
      if (!session?.farmerId) {
        router.replace("/collect/consent");
        return;
      }

      const target = resumePathForSession(session);
        router.replace({ pathname: target.pathname, params: target.params } as never);
    });
  }, [db]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface }}>
      <ActivityIndicator color={Colors.brand} />
      <Text style={{ color: Colors.charcoal500, marginTop: 12 }}>Resuming collection</Text>
    </View>
  );
}
