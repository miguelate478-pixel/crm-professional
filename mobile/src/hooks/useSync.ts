import { useCallback, useEffect } from "react";
import { useSyncStore } from "@store/sync";
import { isOnline, queueOfflineChange, syncPendingChanges } from "@lib/sync";
import type { SyncQueue } from "@types/index";

export function useSync() {
  const {
    isSyncing,
    lastSyncTime,
    pendingChanges,
    error,
    startSync,
    setSyncing,
    setPendingChanges,
    setError,
    updateLastSyncTime,
  } = useSyncStore();

  const queueChange = useCallback(
    async (
      action: "create" | "update" | "delete",
      entity: "lead" | "contact" | "opportunity" | "task" | "activity",
      entityId: string,
      data: Record<string, any>
    ) => {
      try {
        await queueOfflineChange(action, entity, entityId, data);
        setPendingChanges(pendingChanges + 1);

        // Try to sync immediately if online
        const online = await isOnline();
        if (online) {
          await startSync();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to queue change");
      }
    },
    [pendingChanges, setPendingChanges, startSync, setError]
  );

  const sync = useCallback(async (syncFn?: (items: SyncQueue[]) => Promise<void>) => {
    setSyncing(true);
    try {
      const online = await isOnline();
      if (!online) {
        setError("No internet connection");
        setSyncing(false);
        return;
      }

      if (syncFn) {
        await syncPendingChanges(syncFn);
      }

      updateLastSyncTime();
      setPendingChanges(0);
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [setSyncing, setError, updateLastSyncTime, setPendingChanges]);

  return {
    isSyncing,
    lastSyncTime,
    pendingChanges,
    error,
    queueChange,
    sync,
    startSync,
  };
}
