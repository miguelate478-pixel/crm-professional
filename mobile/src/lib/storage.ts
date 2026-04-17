import AsyncStorage from "@react-native-async-storage/async-storage";
import { MMKV } from "react-native-mmkv";
import type { SyncQueue, LocationData, PhotoData } from "@types/index";

// MMKV for fast key-value storage
export const mmkvStorage = new MMKV();

// AsyncStorage for larger data
const SYNC_QUEUE_KEY = "sync_queue";
const OFFLINE_DATA_KEY = "offline_data";
const LOCATION_HISTORY_KEY = "location_history";
const PHOTO_CACHE_KEY = "photo_cache";

// Sync Queue Management
export async function addToSyncQueue(item: SyncQueue): Promise<void> {
  try {
    const queue = await getSyncQueue();
    queue.push(item);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to add to sync queue:", error);
    throw error;
  }
}

export async function getSyncQueue(): Promise<SyncQueue[]> {
  try {
    const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get sync queue:", error);
    return [];
  }
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove sync queue item:", error);
    throw error;
  }
}

export async function clearSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (error) {
    console.error("Failed to clear sync queue:", error);
    throw error;
  }
}

// Offline Data Management
export async function saveOfflineData(
  key: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const offlineData = await getOfflineData();
    offlineData[key] = {
      ...data,
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
  } catch (error) {
    console.error("Failed to save offline data:", error);
    throw error;
  }
}

export async function getOfflineData(): Promise<Record<string, any>> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to get offline data:", error);
    return {};
  }
}

export async function removeOfflineData(key: string): Promise<void> {
  try {
    const offlineData = await getOfflineData();
    delete offlineData[key];
    await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
  } catch (error) {
    console.error("Failed to remove offline data:", error);
    throw error;
  }
}

// Location History
export async function saveLocationHistory(location: LocationData): Promise<void> {
  try {
    const history = await getLocationHistory();
    history.push(location);
    // Keep only last 100 locations
    if (history.length > 100) {
      history.shift();
    }
    await AsyncStorage.setItem(
      LOCATION_HISTORY_KEY,
      JSON.stringify(history)
    );
  } catch (error) {
    console.error("Failed to save location history:", error);
    throw error;
  }
}

export async function getLocationHistory(): Promise<LocationData[]> {
  try {
    const data = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get location history:", error);
    return [];
  }
}

// Photo Cache
export async function cachePhoto(photo: PhotoData): Promise<void> {
  try {
    const cache = await getPhotoCache();
    cache.push(photo);
    await AsyncStorage.setItem(PHOTO_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Failed to cache photo:", error);
    throw error;
  }
}

export async function getPhotoCache(): Promise<PhotoData[]> {
  try {
    const data = await AsyncStorage.getItem(PHOTO_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get photo cache:", error);
    return [];
  }
}

export async function clearPhotoCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PHOTO_CACHE_KEY);
  } catch (error) {
    console.error("Failed to clear photo cache:", error);
    throw error;
  }
}

// MMKV Fast Storage
export function setMMKVValue(key: string, value: any): void {
  try {
    mmkvStorage.set(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to set MMKV value:", error);
  }
}

export function getMMKVValue(key: string): any {
  try {
    const value = mmkvStorage.getString(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Failed to get MMKV value:", error);
    return null;
  }
}

export function removeMMKVValue(key: string): void {
  try {
    mmkvStorage.delete(key);
  } catch (error) {
    console.error("Failed to remove MMKV value:", error);
  }
}
