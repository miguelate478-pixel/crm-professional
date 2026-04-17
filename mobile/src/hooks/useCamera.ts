import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { cachePhoto } from "@lib/storage";
import type { PhotoData, LocationData } from "@types/index";

export function useCamera() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === "granted";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Permission request failed");
      return false;
    }
  }, []);

  const takePhoto = useCallback(
    async (location?: LocationData) => {
      setIsLoading(true);
      try {
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          setError("Camera permission denied");
          setIsLoading(false);
          return null;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });

        if (result.canceled) {
          setIsLoading(false);
          return null;
        }

        const asset = result.assets[0];
        const photoData: PhotoData = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          base64: asset.base64,
          timestamp: Date.now(),
          location,
        };

        await cachePhoto(photoData);
        setError(null);
        setIsLoading(false);
        return photoData;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to take photo";
        setError(errorMsg);
        setIsLoading(false);
        return null;
      }
    },
    [requestPermission]
  );

  const pickImage = useCallback(
    async (location?: LocationData) => {
      setIsLoading(true);
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          setError("Photo library permission denied");
          setIsLoading(false);
          return null;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });

        if (result.canceled) {
          setIsLoading(false);
          return null;
        }

        const asset = result.assets[0];
        const photoData: PhotoData = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          base64: asset.base64,
          timestamp: Date.now(),
          location,
        };

        await cachePhoto(photoData);
        setError(null);
        setIsLoading(false);
        return photoData;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to pick image";
        setError(errorMsg);
        setIsLoading(false);
        return null;
      }
    },
    []
  );

  return {
    isLoading,
    error,
    takePhoto,
    pickImage,
    requestPermission,
  };
}
