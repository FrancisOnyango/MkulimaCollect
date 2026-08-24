import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { useApiClient } from "@/components/providers/APIProvider";
import { useDatabase } from "@/components/providers/DBProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { completeTask, getTasksForAgent, type UpsertTaskInput, upsertTask } from "@/features/tasks/taskRepository";
import { type tasks } from "@/lib/db/schema";

type TaskRow = typeof tasks.$inferSelect;

export default function TasksScreen() {
  const db = useDatabase();
  const { api } = useApiClient();
  const { agent } = useAuth();
  const [items, setItems] = useState<TaskRow[]>([]);

  const refresh = useCallback(async () => {
    if (!agent) {
      setItems([]);
      return;
    }

    setItems(await getTasksForAgent(db, agent.id));
  }, [agent, db]);

  const hydrateFromApi = useCallback(async () => {
    if (!agent) {
      return;
    }

    const remoteTasks = await api.getTasks(agent.id);
    await Promise.all(
      remoteTasks.map((task) => {
        const input: UpsertTaskInput = {
          id: task.id,
          agentId: agent.id,
          type: task.type,
          priority: task.priority,
          status: "OPEN",
          title: task.title,
        };

        if (task.farmerId) {
          input.farmerId = task.farmerId;
        }
        if (task.detail) {
          input.detail = task.detail;
        }
        if (task.dueDate) {
          input.dueDate = task.dueDate;
        }

        return upsertTask(db, input);
      }),
    );
  }, [agent, api, db]);

  useEffect(() => {
    void hydrateFromApi().finally(() => {
      void refresh();
    });
  }, [hydrateFromApi, refresh]);

  async function handleDone(taskId: string) {
    if (!agent) {
      return;
    }

    await completeTask(db, taskId, agent.id);
    await refresh();
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 18 }}>
      <Text style={{ color: Colors.brand, fontSize: 26, fontWeight: "700", marginBottom: 14 }}>Tasks</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: Colors.charcoal500, marginTop: 24 }}>No local tasks yet.</Text>}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 14, marginBottom: 10, opacity: item.status === "COMPLETED" ? 0.55 : 1 }}>
            <Text style={{ color: Colors.charcoal, fontWeight: "700", fontSize: 16 }}>{item.title}</Text>
            {item.detail ? <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{item.detail}</Text> : null}
            <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>{item.priority} - {item.status}</Text>
            {item.status !== "COMPLETED" ? (
              <Pressable accessibilityRole="button" onPress={() => void handleDone(item.id)} style={{ alignSelf: "flex-start", backgroundColor: Colors.brand, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10 }}>
                <Text style={{ color: "white", fontWeight: "700" }}>Done</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}
