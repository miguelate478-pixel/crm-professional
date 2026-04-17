import React, { createContext, useContext, useEffect, useState } from "react";
import {
  registerForPushNotifications,
  addNotificationListener,
  addNotificationReceivedListener,
} from "@lib/notifications";
import type { PushNotification } from "@types/index";

interface NotificationContextType {
  pushToken: string | null;
  notifications: PushNotification[];
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);

  useEffect(() => {
    // Register for push notifications
    const registerNotifications = async () => {
      const token = await registerForPushNotifications();
      if (token) {
        setPushToken(token);
        // Send token to backend for storing
        console.log("Push token:", token);
      }
    };

    registerNotifications();
  }, []);

  useEffect(() => {
    // Listen for notifications
    const unsubscribeReceived = addNotificationReceivedListener((notification) => {
      const pushNotification: PushNotification = {
        id: notification.request.identifier,
        title: notification.request.content.title || "",
        body: notification.request.content.body || "",
        data: notification.request.content.data,
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((prev) => [pushNotification, ...prev]);
    });

    const unsubscribeResponse = addNotificationListener((notification) => {
      // Handle notification tap
      console.log("Notification tapped:", notification);
    });

    return () => {
      unsubscribeReceived();
      unsubscribeResponse();
    };
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value: NotificationContextType = {
    pushToken,
    notifications,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
