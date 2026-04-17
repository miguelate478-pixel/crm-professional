import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@store/auth";
import { useSyncStore } from "@store/sync";
import { isOnline } from "@lib/sync";
import type { DashboardKPIs } from "@types/index";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isSyncing, pendingChanges, lastSyncTime } = useSyncStore();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnlineStatus, setIsOnlineStatus] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
    checkOnlineStatus();
  }, []);

  const checkOnlineStatus = async () => {
    const online = await isOnline();
    setIsOnlineStatus(online);
  };

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual tRPC call
      // const data = await trpc.dashboard.getKPIs.query();
      // setKpis(data);

      // Mock data for now
      setKpis({
        totalLeads: 24,
        activeOpportunities: 8,
        monthlyRevenue: 125000,
        conversionRate: 33.3,
        tasksOverdue: 2,
        tasksToday: 5,
      });
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkOnlineStatus();
    await loadDashboard();
    setRefreshing(false);
  };

  const KPICard = ({
    title,
    value,
    subtitle,
    color,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) => (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: color,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>{title}</Text>
      <Text style={{ fontSize: 28, fontWeight: "bold", color: "#1F2937" }}>
        {value}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>{subtitle}</Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={{ backgroundColor: "#ffffff", padding: 16, paddingTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1F2937" }}>
          Welcome, {user?.firstName}
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>

        {/* Status Bar */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: "#6B7280" }}>Status</Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isOnlineStatus ? "#10B981" : "#EF4444",
                marginTop: 2,
              }}
            >
              {isOnlineStatus ? "Online" : "Offline"}
            </Text>
          </View>
          {pendingChanges > 0 && (
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>Pending Sync</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#F59E0B", marginTop: 2 }}>
                {pendingChanges} changes
              </Text>
            </View>
          )}
          {isSyncing && (
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>Syncing...</Text>
              <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 2 }} />
            </View>
          )}
        </View>
      </View>

      {/* KPIs */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 12 }}>
          Key Metrics
        </Text>

        {kpis && (
          <>
            <KPICard
              title="Total Leads"
              value={kpis.totalLeads}
              color="#3B82F6"
            />
            <KPICard
              title="Active Opportunities"
              value={kpis.activeOpportunities}
              color="#10B981"
            />
            <KPICard
              title="Monthly Revenue"
              value={`$${(kpis.monthlyRevenue / 1000).toFixed(0)}K`}
              color="#8B5CF6"
            />
            <KPICard
              title="Conversion Rate"
              value={`${kpis.conversionRate.toFixed(1)}%`}
              color="#F59E0B"
            />
            <KPICard
              title="Tasks Overdue"
              value={kpis.tasksOverdue}
              subtitle={`${kpis.tasksToday} due today`}
              color={kpis.tasksOverdue > 0 ? "#EF4444" : "#10B981"}
            />
          </>
        )}
      </View>

      {/* Quick Actions */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 12 }}>
          Quick Actions
        </Text>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => router.push("/(app)/leads")}
            style={{
              flex: 1,
              backgroundColor: "#3B82F6",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 14 }}>
              View Leads
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(app)/opportunities")}
            style={{
              flex: 1,
              backgroundColor: "#10B981",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 14 }}>
              Opportunities
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push("/(app)/tasks")}
            style={{
              flex: 1,
              backgroundColor: "#F59E0B",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 14 }}>
              Tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(app)/profile")}
            style={{
              flex: 1,
              backgroundColor: "#8B5CF6",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 14 }}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
