// Native background sync adapter for Expo-managed projects.
// Uses expo-task-manager and expo-background-fetch when available.

let TaskManager: any;
let BackgroundFetch: any;

try {
  // Dynamic import so web builds don't fail
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  TaskManager = require('expo-task-manager');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  BackgroundFetch = require('expo-background-fetch');
} catch (e) {
  // Not running in Expo/native environment — provide no-op fallbacks
  TaskManager = null;
  BackgroundFetch = null;
}

const TASK_NAME = 'MKL_BACKGROUND_SYNC_TASK';

// Lazy imports to avoid bundling native-only modules into web builds
async function runSyncFromBackground() {
  try {
    // Import inside function so web builds skip native modules
    const { openAppDatabase } = await import('@/lib/db/database');
    const { createApiClient } = await import('@/lib/api');
    const { runSyncEngine } = await import('./SyncEngine');

    const db = await openAppDatabase();
    const api = createApiClient();

    await runSyncEngine(db, api);
  } catch (e) {
    // Ignore errors in background context
  }
}

export async function registerBackgroundSyncTask() {
  if (!BackgroundFetch || !TaskManager) return false;

  try {
    // Register the task if not already registered
    if (!TaskManager.isTaskRegistered || !(await TaskManager.isTaskRegistered(TASK_NAME))) {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 60 * 15, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }

    return true;
  } catch (err) {
    return false;
  }
}

export async function unregisterBackgroundSyncTask() {
  if (!BackgroundFetch || !TaskManager) return false;

  try {
    await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
    return true;
  } catch (err) {
    return false;
  }
}

// Provide a TaskManager task handler that calls runSyncEngine directly when available
if (TaskManager && TaskManager.defineTask) {
  TaskManager.defineTask(TASK_NAME, async ({ data, error }: any) => {
    try {
      await runSyncFromBackground();
      return BackgroundFetch.Result.NewData;
    } catch (e) {
      return BackgroundFetch.Result.Failed;
    }
  });
}

// Also listen for the global event used by the web/service-worker pathway so that an
// app context can trigger a background sync run if available.
if (typeof globalThis?.addEventListener === 'function') {
  globalThis.addEventListener('MKL_BACKGROUND_FETCH', () => {
    void runSyncFromBackground();
  });
}
