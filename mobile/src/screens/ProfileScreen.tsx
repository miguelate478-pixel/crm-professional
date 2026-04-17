import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@store/auth";
import { useCamera } from "@hooks/useCamera";
import { useLocation } from "@hooks/useLocation";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { takePhoto, isLoading: isCameraLoading } = useCamera();
  const { getCurrentLocation, isLoading: isLocationLoading } = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Logout",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
            router.replace("/login");
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo) {
      Alert.alert("Success", "Photo taken and cached");
    }
  };

  const handleGetLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      Alert.alert(
        "Location",
        `Latitude: ${location.latitude.toFixed(4)}\nLongitude: ${location.longitude.toFixed(4)}`
      );
    }
  };

  const MenuItem = ({
    title,
    subtitle,
    onPress,
    isLoading,
  }: {
    title: string;
    subtitle?: string;
    onPress: () => void;
    isLoading?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      style={{
        backgroundColor: "#ffffff",
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937" }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {isLoading && <ActivityIndicator size="small" color="#3B82F6" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <View style={{ backgroundColor: "#ffffff", padding: 16, paddingTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1F2937" }}>
          Profile
        </Text>
      </View>

      {/* User Info */}
      <View style={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: "#ffffff",
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#3B82F6",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#ffffff" }}>
              {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
            </Text>
          </View>

          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1F2937" }}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
            {user?.email}
          </Text>
          <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
            Role: {user?.role}
          </Text>
        </View>

        {/* Features */}
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 12 }}>
          Features
        </Text>

        <MenuItem
          title="Take Photo"
          subtitle="Capture and cache photos"
          onPress={handleTakePhoto}
          isLoading={isCameraLoading}
        />

        <MenuItem
          title="Get Location"
          subtitle="Capture current location"
          onPress={handleGetLocation}
          isLoading={isLocationLoading}
        />

        {/* Settings */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#1F2937",
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          Settings
        </Text>

        <MenuItem
          title="Edit Profile"
          subtitle="Update your information"
          onPress={() => router.push("/(app)/profile/edit")}
        />

        <MenuItem
          title="Change Password"
          subtitle="Update your password"
          onPress={() => router.push("/(app)/profile/change-password")}
        />

        <MenuItem
          title="Notifications"
          subtitle="Manage notification settings"
          onPress={() => router.push("/(app)/profile/notifications")}
        />

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={isLoggingOut}
          style={{
            backgroundColor: "#EF4444",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 24,
            marginBottom: 40,
          }}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
              Logout
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
