import * as Location from "expo-location";

export type DevicePosition = {
  latitude: number;
  longitude: number;
  accuracyM: number | null;
  altitude: number | null;
};

export async function captureCurrentPosition(): Promise<DevicePosition> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== Location.PermissionStatus.GRANTED) {
    throw new Error("Location permission is required to capture GPS.");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Highest,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyM: position.coords.accuracy,
    altitude: position.coords.altitude,
  };
}
