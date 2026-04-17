import React, { createContext, useContext, useEffect, useCallback } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useSync } from "@hooks/useSync";
import { useSyncStore } from "@store/sync";
import { getSyncQueue } from "@lib/storage";
import type { SyncQueue } from "@types/index";

interface SyncContextType {
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncTime?: number;
  error?: string;
  queueChange: (
    action: "create" | "update" | "delete",
    entity: "lead" | "contact" | "opportunity" | "task" | "activity",
    entityId: string,
    data: Record<string, any>
  ) => Promise<void>;
  sync: (syncFn?: (items: SyncQueue[]) => Promise<void>) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isSyncing, pendingChanges, lastSyncTime, error, queueChange, sync } = useSync();
  const { setPendingChanges } = useSyncStore();

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && !isSyncing) {
        // Attempt to sync when connection is restored
        sync();
      }
    });

    return unsubscribe;
  }, [isSyncing, sync]);

  // Load pending changes on mount
  useEffect(() => {
    const loadPendingChanges = async () => {
      const queue = await getSyncQueue();
      setPendingChanges(queue.length);
    };

    loadPendingChanges();
  }, [setPendingChanges]);

  const value: SyncContextType = {
    isSyncing,
    pendingChanges,
    lastSyncTime,
    error,
    queueChange,
    sync,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useAppSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useAppSync must be used within SyncProvider");
  }
  return context;
}
