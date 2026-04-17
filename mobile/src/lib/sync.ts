import NetInfo from "@react-native-community/netinfo";
import { nanoid } from "nanoid";
import {
  addToSyncQueue,
  getSyncQueue,
  removeSyncQueueItem,
  getOfflineData,
  removeOfflineData,
} from "./storage";
import type { SyncQueue } from "@types/index";

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

export async function queueOfflineChange(
  action: "create" | "update" | "delete",
  entity: "lead" | "contact" | "opportunity" | "task" | "activity",
  entityId: string,
  data: Record<string, any>
): Promise<string> {
  const id = nanoid();
  const item: SyncQueue = {
    id,
    action,
    entity,
    entityId,
    data,
    timestamp: Date.now(),
    synced: false,
  };

  await addToSyncQueue(item);
  return id;
}

export async function syncPendingChanges(
  syncFn: (items: SyncQueue[]) => Promise<void>
): Promise<{ synced: number; failed: number }> {
  const online = await isOnline();
  if (!online) {
    return { synced: 0, failed: 0 };
  }

  const queue = await getSyncQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  try {
    await syncFn(queue);
    // Clear queue after successful sync
    for (const item of queue) {
      await removeSyncQueueItem(item.id);
    }
    synced = queue.length;
  } catch (error) {
    console.error("Sync failed:", error);
    failed = queue.length;
  }

  return { synced, failed };
}

export async function getOfflineChanges(): Promise<Record<string, any>> {
  return getOfflineData();
}

export async function clearOfflineChanges(): Promise<void> {
  const changes = await getOfflineChanges();
  for (const key of Object.keys(changes)) {
    await removeOfflineData(key);
  }
}
