import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "mkulima.access_token";
const REFRESH_TOKEN_KEY = "mkulima.refresh_token";
const SESSION_KEY = "mkulima.session";
const DEVICE_ID_KEY = "mkulima.device_id";

export const SecureTokenStore = {
  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async setAccessToken(token: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token: string) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async getSessionJson() {
    return SecureStore.getItemAsync(SESSION_KEY);
  },

  async setSessionJson(sessionJson: string) {
    await SecureStore.setItemAsync(SESSION_KEY, sessionJson);
  },

  async getDeviceId() {
    return SecureStore.getItemAsync(DEVICE_ID_KEY);
  },

  async setDeviceId(deviceId: string) {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  },

  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(SESSION_KEY),
    ]);
  },
};
