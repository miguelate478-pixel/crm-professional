import { create } from "zustand";
import type { SyncStatus } from "@types/index";
import { isOnline, syncPendingChanges } from "@lib/sync";

interface SyncState extends SyncStatus {
  // Actions
  startSync: () => Promise<void>;
  setSyncing: (syncing: boolean) => void;
  setPendingChanges: (count: number) => void;
  setError: (error: string | undefined) => void;
  updateLastSyncTime: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncTime: undefined,
  pendingChanges: 0,
  error: undefined,

  startSync: async () => {
    set({ isSyncing: true, error: undefined });
    try {
      const online = await isOnline();
      if (!online) {
        set({ isSyncing: false, error: "No internet connection" });
        return;
      }

      // Sync will be called from the app context
      set({ isSyncing: false, lastSyncTime: Date.now() });
    } catch (error) {
      set({
        isSyncing: false,
        error: error instanceof Error ? error.message : "Sync failed",
      });
    }
  },

  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingChanges: (pendingChanges) => set({ pendingChanges }),
  setError: (error) => set({ error }),
  updateLastSyncTime: () => set({ lastSyncTime: Date.now() }),
}));
