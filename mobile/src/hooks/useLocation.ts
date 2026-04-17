import { useEffect, useState, useCallback } from "react";
import * as Location from "expo-location";
import { saveLocationHistory } from "@lib/storage";
import type { LocationData } from "@types/index";

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Permission request failed");
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setError("Location permission denied");
        setIsLoading(false);
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy ?? undefined,
        altitude: currentLocation.coords.altitude ?? undefined,
        heading: currentLocation.coords.heading ?? undefined,
        speed: currentLocation.coords.speed ?? undefined,
        timestamp: currentLocation.timestamp,
      };

      setLocation(locationData);
      await saveLocationHistory(locationData);
      setError(null);
      return locationData;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get location";
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [requestPermission]);

  const watchLocation = useCallback(
    async (callback?: (location: LocationData) => void) => {
      try {
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          setError("Location permission denied");
          return null;
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // 5 seconds
            distanceInterval: 10, // 10 meters
          },
          async (currentLocation) => {
            const locationData: LocationData = {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              accuracy: currentLocation.coords.accuracy ?? undefined,
              altitude: currentLocation.coords.altitude ?? undefined,
              heading: currentLocation.coords.heading ?? undefined,
              speed: currentLocation.coords.speed ?? undefined,
              timestamp: currentLocation.timestamp,
            };

            setLocation(locationData);
            await saveLocationHistory(locationData);
            callback?.(locationData);
          }
        );

        return subscription;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to watch location";
        setError(errorMsg);
        return null;
      }
    },
    [requestPermission]
  );

  return {
    location,
    error,
    isLoading,
    getCurrentLocation,
    watchLocation,
    requestPermission,
  };
}
