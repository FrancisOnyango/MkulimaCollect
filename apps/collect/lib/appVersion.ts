import Constants from "expo-constants";
import { compareSemver, isVersionSupported } from "./semver";

export { compareSemver, isVersionSupported };

export function getAppVersion(): string {
  return process.env.EXPO_PUBLIC_APP_VERSION || Constants.expoConfig?.version || "0.1.0";
}
