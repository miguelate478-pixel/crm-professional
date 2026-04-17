import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import type { PushNotification } from "@types/index";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      throw new Error("Project ID not found");
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (error) {
    console.error("Failed to register for push notifications:", error);
    return null;
  }
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: "default",
      },
      trigger: { seconds: 1 },
    });
  } catch (error) {
    console.error("Failed to send local notification:", error);
  }
}

export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
): () => void {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    callback(response.notification);
  }).remove;
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): () => void {
  return Notifications.addNotificationReceivedListener((notification) => {
    callback(notification);
  }).remove;
}
