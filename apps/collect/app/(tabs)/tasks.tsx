import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Colors } from "@/constants/colors";
import { AppHeader, FilterChip, ScreenShell } from "@/components/ui/ScreenShell";
import { useApiClient } from "@/components/providers/APIProvider";
import { useDatabase } from "@/components/providers/DBProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { getFarmersByAgent } from "@/features/farmers/farmerRepository";
import { completeTask, getTasksForAgent, type UpsertTaskInput, upsertTask } from "@/features/tasks/taskRepository";
import { startVisit, type VisitPurpose } from "@/features/visits/visitRepository";
import { type tasks } from "@/lib/db/schema";

type TaskRow = typeof tasks.$inferSelect;
type Filter = "All" | "Today" | "High" | "Done";

const purposeCards: { purpose: VisitPurpose; label: string; detail: string }[] = [
  { purpose: "full_assessment", label: "New assessment", detail: "Consent through holdings" },
  { purpose: "update", label: "Revisit", detail: "Change events only" },
  { purpose: "verification", label: "Verification", detail: "Restricted flagged fields" },
  { purpose: "cycle_follow_up", label: "Cycle follow-up", detail: "Stage, inputs, events" },
  { purpose: "harvest_sale", label: "Harvest / sale", detail: "Lots, buyers, payment" },
  { purpose: "outcome", label: "Loan outcome", detail: "Use of funds and repayment" },
  { purpose: "correction", label: "Correction", detail: "Returned records" },
];

function isToday(value: string | null) {
  if (!value) {
    return false;
  }
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) {
    return value.toLowerCase() === "today";
  }
  const now = new Date();
  return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
}

export default function TasksScreen() {
  const db = useDatabase();
  const { api } = useApiClient();
  const { agent } = useAuth();
  const [items, setItems] = useState<TaskRow[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!agent) {
      setItems([]);
      return;
    }
    setItems(await getTasksForAgent(db, agent.id));
  }, [agent, db]);

  const hydrate = useCallback(async () => {
    if (!agent) {
      return;
    }

    try {
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
          if (task.farmerId) input.farmerId = task.farmerId;
          if (task.detail) input.detail = task.detail;
          if (task.dueDate) input.dueDate = task.dueDate;
          return upsertTask(db, input);
        }),
      );
    } catch {
      // Keep local tasks when the API is unreachable.
    }

    const existing = await getTasksForAgent(db, agent.id);
    const existingIds = new Set(existing.map((task) => task.id));
    const farmers = await getFarmersByAgent(db, agent.id);
    const today = new Date().toISOString();
    await Promise.all(
      farmers
        .filter((farmer) => farmer.status !== "SUBMITTED" && farmer.status !== "VERIFIED" && !existingIds.has(`followup-${farmer.id}`))
        .map((farmer) => {
          const name = farmer.identity?.fullLegalName || [farmer.identity?.firstName, farmer.identity?.surname].filter(Boolean).join(" ") || "this farmer";
          return upsertTask(db, {
            id: `followup-${farmer.id}`,
            agentId: agent.id,
            farmerId: farmer.id,
            type: "FOLLOW_UP",
            priority: "HIGH",
            status: "OPEN",
            title: `Finish ${name}'s collection`,
            detail: `Profile is ${farmer.completenessPct}% complete. Continue holdings, enterprises, or walk the boundary last.`,
            dueDate: today,
          });
        }),
    );
  }, [agent, api, db]);

  useFocusEffect(
    useCallback(() => {
      void hydrate().finally(() => {
        void refresh();
      });
    }, [hydrate, refresh]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await hydrate();
    await refresh();
    setRefreshing(false);
  }

  async function handleStart(purpose: VisitPurpose) {
    if (!agent) {
      return;
    }
    await startVisit(db, { agentId: agent.id, purpose, interviewLanguage: "en" });
    if (purpose === "full_assessment") {
      router.push("/collect/consent");
      return;
    }
    router.push("/(tabs)/farmers");
  }

  async function handleDone(taskId: string) {
    if (!agent) {
      return;
    }
    await completeTask(db, taskId, agent.id);
    await refresh();
  }

  const visible = useMemo(() => {
    return items.filter((item) => {
      if (filter === "Today") return isToday(item.dueDate);
      if (filter === "High") return item.priority === "HIGH";
      if (filter === "Done") return item.status === "COMPLETED";
      return item.status !== "COMPLETED";
    });
  }, [filter, items]);

  const dueToday = items.filter((item) => item.status !== "COMPLETED" && isToday(item.dueDate)).length;

  return (
    <ScreenShell>
      <AppHeader title="Work" subtitle={`${dueToday} due today · assigned visits and follow-ups`} />

      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: Colors.charcoal500, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 8 }}>START A VISIT</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {purposeCards.map((card) => (
            <Pressable
              accessibilityRole="button"
              key={card.purpose}
              onPress={() => void handleStart(card.purpose)}
              style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, width: "48%" }}
            >
              <Text style={{ color: Colors.charcoal, fontWeight: "800", fontSize: 13 }}>{card.label}</Text>
              <Text style={{ color: Colors.charcoal500, marginTop: 2, fontSize: 11 }}>{card.detail}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {(["All", "Today", "High", "Done"] as Filter[]).map((item) => (
          <FilterChip key={item} label={item} active={filter === item} onPress={() => setFilter(item)} />
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={Colors.brand} />}
        contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <Text style={{ color: Colors.charcoal500, marginTop: 28, textAlign: "center" }}>
            No work in this filter. Incomplete farmer profiles appear here automatically.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 16, padding: 14, marginBottom: 10, opacity: item.status === "COMPLETED" ? 0.55 : 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <Text style={{ color: Colors.charcoal500, fontSize: 12, fontWeight: "700" }}>{item.type}</Text>
              <Text style={{ color: isToday(item.dueDate) ? Colors.redField : Colors.charcoal500, fontSize: 12, fontWeight: "700" }}>
                {item.priority}{item.dueDate ? ` · ${isToday(item.dueDate) ? "Today" : item.dueDate.slice(0, 10)}` : ""}
              </Text>
            </View>
            <Text style={{ color: Colors.charcoal, fontWeight: "800", fontSize: 16, marginTop: 6 }}>{item.title}</Text>
            {item.detail ? <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{item.detail}</Text> : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {item.farmerId ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/collect/holdings", params: { farmerId: item.farmerId as string } })}
                  style={{ backgroundColor: Colors.brandMuted, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}
                >
                  <Text style={{ color: Colors.brandDark, fontWeight: "800" }}>Open farmer</Text>
                </Pressable>
              ) : null}
              {item.status !== "COMPLETED" ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void handleDone(item.id)}
                  style={{ backgroundColor: Colors.brand, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}
                >
                  <Text style={{ color: Colors.brandInk, fontWeight: "800" }}>Done</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
      />
    </ScreenShell>
  );
}
