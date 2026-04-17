import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import type { Opportunity } from "@types/index";

export default function OpportunitiesScreen() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual tRPC call
      // const data = await trpc.opportunities.list.query();
      // setOpportunities(data);

      // Mock data
      setOpportunities([
        {
          id: "1",
          name: "Implementación ERP - TechCorp",
          amount: 85000,
          probability: 75,
          expectedCloseDate: "2024-03-15",
          pipelineId: "pipe1",
          stageId: "stage3",
          stageName: "Negociación",
          companyId: "comp1",
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: "org1",
          userId: "user1",
        },
        {
          id: "2",
          name: "Consultoría Digital - Innovate",
          amount: 42000,
          probability: 60,
          expectedCloseDate: "2024-04-01",
          pipelineId: "pipe1",
          stageId: "stage2",
          stageName: "Propuesta",
          companyId: "comp2",
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: "org1",
          userId: "user1",
        },
      ]);
    } catch (error) {
      console.error("Failed to load opportunities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOpportunities();
    setRefreshing(false);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Prospecto":
        return "#3B82F6";
      case "Calificado":
        return "#60A5FA";
      case "Propuesta":
        return "#F59E0B";
      case "Negociación":
        return "#8B5CF6";
      case "Cerrado":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const renderOpportunityItem = ({ item }: { item: Opportunity }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/opportunities/${item.id}`)}
      style={{
        backgroundColor: "#ffffff",
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", flex: 1 }}>
          {item.name}
        </Text>
        <View
          style={{
            backgroundColor: getStageColor(item.stageName || ""),
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }}>
            {item.stageName}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#1F2937" }}>
          ${item.amount.toLocaleString()}
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280" }}>
          {item.probability}% probability
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#F3F4F6",
          height: 4,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            backgroundColor: getStageColor(item.stageName || ""),
            height: "100%",
            width: `${item.probability}%`,
          }}
        />
      </View>

      <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
        Expected close: {new Date(item.expectedCloseDate).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <View style={{ backgroundColor: "#ffffff", padding: 16, paddingTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1F2937" }}>
          Opportunities
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
          {opportunities.length} opportunities
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={opportunities}
        renderItem={renderOpportunityItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 16, color: "#6B7280" }}>
              No opportunities yet
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        onPress={() => router.push("/(app)/opportunities/new")}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#3B82F6",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 28, color: "#ffffff", fontWeight: "300" }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
