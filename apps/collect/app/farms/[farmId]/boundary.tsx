import { useState } from "react";
import * as Location from "expo-location";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/colors";
import { useDatabase } from "@/components/providers/DBProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { saveGeometry } from "@/features/farms/farmRepository";

type BoundaryPoint = {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracyM?: number | null;
  capturedAt: string;
};

export default function FarmBoundaryScreen() {
  const db = useDatabase();
  const { agent } = useAuth();
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const [points, setPoints] = useState<BoundaryPoint[]>([]);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function capturePoint() {
    setCapturing(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setError("Location permission is required for boundary capture.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      setCurrentAccuracy(position.coords.accuracy);
      setPoints((existing) => [
        ...existing,
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracyM: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
        },
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to capture GPS point");
    } finally {
      setCapturing(false);
    }
  }

  async function completeBoundary() {
    if (!farmId) {
      setError("Missing farm link.");
      return;
    }

    if (points.length < 3) {
      setError("Capture at least 3 GPS points before completing the boundary.");
      return;
    }

    const areaCalculatedAcres = calculateAreaAcres(points);

    if (areaCalculatedAcres <= 0) {
      setError("Captured points do not form a valid polygon.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const firstPoint = points[0];

      if (!firstPoint) {
        setError("Capture at least 3 GPS points before completing the boundary.");
        return;
      }

      const coordinates = [...points.map((point) => [point.longitude, point.latitude]), [firstPoint.longitude, firstPoint.latitude]];
      const accuracyMeters = maxAccuracy(points);
      const geometryInput = {
        farmId,
        areaCalculatedAcres,
        calculationMethod: "GPS_WALKED_POLYGON",
        pointCount: points.length,
        distanceM: calculateDistanceM(points),
        agentId: agent?.id ?? "local-agent",
        points,
        polygonGeojson: JSON.stringify({ type: "Polygon", coordinates: [coordinates] }),
      };

      await saveGeometry(db, accuracyMeters ? { ...geometryInput, accuracyMeters } : geometryInput);
      router.replace({ pathname: "/farms/[farmId]", params: { farmId } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save boundary");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.surface }} contentContainerStyle={{ padding: 18 }}>
      <Text style={{ color: Colors.brand, fontSize: 28, fontWeight: "700" }}>Walk boundary</Text>
      <Text style={{ color: Colors.charcoal500, marginTop: 8 }}>
        Capture GPS points around the farm. This works without map tiles; the path is persisted locally when completed.
      </Text>

      <View style={mapFallbackStyle}>
        <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>Captured points: {points.length}</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>Current accuracy: {currentAccuracy ? `${Math.round(currentAccuracy)} m` : "Not captured"}</Text>
        <Text style={{ color: Colors.charcoal500, marginTop: 6 }}>Estimated area: {points.length >= 3 ? `${calculateAreaAcres(points).toFixed(3)} acres` : "Need 3 points"}</Text>
      </View>

      {points.map((point, index) => (
        <View key={`${point.latitude}-${point.longitude}-${index}`} style={pointRowStyle}>
          <Text style={{ color: Colors.charcoal, fontWeight: "700" }}>Point {index + 1}</Text>
          <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>{point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</Text>
          <Text style={{ color: Colors.charcoal500, marginTop: 4 }}>Accuracy {point.accuracyM ? Math.round(point.accuracyM) : "n/a"} m</Text>
        </View>
      ))}

      {error ? <Text style={{ color: Colors.redField, marginTop: 14 }}>{error}</Text> : null}

      <Pressable accessibilityRole="button" disabled={capturing || saving} onPress={capturePoint} style={buttonStyle(capturing || saving, Colors.brand)}>
        {capturing ? <ActivityIndicator color="white" /> : <Text style={buttonTextStyle}>Capture current position</Text>}
      </Pressable>
      <Pressable accessibilityRole="button" disabled={!points.length || saving} onPress={() => setPoints((existing) => existing.slice(0, -1))} style={buttonStyle(!points.length || saving, Colors.amberField)}>
        <Text style={buttonTextStyle}>Undo last point</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={saving} onPress={completeBoundary} style={buttonStyle(saving, Colors.brandDark)}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={buttonTextStyle}>Complete boundary</Text>}
      </Pressable>
    </ScrollView>
  );
}

function calculateAreaAcres(points: BoundaryPoint[]) {
  if (points.length < 3) {
    return 0;
  }

  const origin = points[0];

  if (!origin) {
    return 0;
  }
  const meters = points.map((point) => {
    const x = (point.longitude - origin.longitude) * 111_320 * Math.cos((origin.latitude * Math.PI) / 180);
    const y = (point.latitude - origin.latitude) * 110_540;
    return { x, y };
  });
  const twiceArea = meters.reduce((sum, point, index) => {
    const next = meters[(index + 1) % meters.length] ?? point;
    return sum + point.x * next.y - next.x * point.y;
  }, 0);

  return Math.abs(twiceArea / 2) / 4046.8564224;
}

function calculateDistanceM(points: BoundaryPoint[]) {
  if (points.length < 2) {
    return 0;
  }

  const firstPoint = points[0];

  if (!firstPoint) {
    return 0;
  }

  const path = [...points, firstPoint];
  return path.slice(1).reduce((sum, point, index) => {
    const previous = path[index];
    return previous ? sum + distanceBetween(previous, point) : sum;
  }, 0);
}

function distanceBetween(a: BoundaryPoint, b: BoundaryPoint) {
  const latDistance = (b.latitude - a.latitude) * 110_540;
  const lonDistance = (b.longitude - a.longitude) * 111_320 * Math.cos((a.latitude * Math.PI) / 180);
  return Math.sqrt(latDistance * latDistance + lonDistance * lonDistance);
}

function maxAccuracy(points: BoundaryPoint[]) {
  const accuracies = points.map((point) => point.accuracyM).filter((value): value is number => typeof value === "number");
  return accuracies.length ? Math.max(...accuracies) : undefined;
}

const mapFallbackStyle = { backgroundColor: "white", borderWidth: 1, borderColor: Colors.charcoal100, borderRadius: 12, padding: 16, marginTop: 16 };
const pointRowStyle = { backgroundColor: Colors.brandMuted, borderRadius: 10, padding: 12, marginTop: 10 };
const buttonTextStyle = { color: "white", fontWeight: "700" as const };

function buttonStyle(disabled: boolean, color: string) {
  return {
    alignItems: "center" as const,
    borderRadius: 12,
    backgroundColor: disabled ? Colors.charcoal300 : color,
    paddingVertical: 14,
    marginTop: 12,
  };
}
