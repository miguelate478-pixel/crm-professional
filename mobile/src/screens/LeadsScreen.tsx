import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import type { Lead } from "@types/index";

export default function LeadsScreen() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [searchQuery, leads]);

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual tRPC call
      // const data = await trpc.leads.list.query();
      // setLeads(data);

      // Mock data
      setLeads([
        {
          id: "1",
          firstName: "Carlos",
          lastName: "Mendoza",
          email: "carlos@techcorp.com",
          phone: "+57 300 111 2222",
          company: "TechCorp",
          jobTitle: "CEO",
          source: "Sitio Web",
          status: "contactado",
          score: 85,
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: "org1",
          userId: "user1",
        },
        {
          id: "2",
          firstName: "Ana",
          lastName: "Rodríguez",
          email: "ana@innovate.com",
          phone: "+57 310 222 3333",
          company: "Innovate SAS",
          jobTitle: "CTO",
          source: "Referido",
          status: "contactado",
          score: 72,
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: "org1",
          userId: "user1",
        },
      ]);
    } catch (error) {
      console.error("Failed to load leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterLeads = () => {
    if (!searchQuery) {
      setFilteredLeads(leads);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = leads.filter(
      (lead) =>
        lead.firstName.toLowerCase().includes(query) ||
        lead.lastName.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.company?.toLowerCase().includes(query)
    );
    setFilteredLeads(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "nuevo":
        return "#3B82F6";
      case "contactado":
        return "#F59E0B";
      case "calificado":
        return "#10B981";
      case "descartado":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const renderLeadItem = ({ item }: { item: Lead }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/leads/${item.id}`)}
      style={{
        backgroundColor: "#ffffff",
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: getStatusColor(item.status),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937" }}>
          {item.firstName} {item.lastName}
        </Text>
        <View
          style={{
            backgroundColor: getStatusColor(item.status),
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }}>
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>
        {item.email}
      </Text>

      {item.phone && (
        <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>
          {item.phone}
        </Text>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
        <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
          {item.company}
        </Text>
        <View
          style={{
            backgroundColor: "#FEF3C7",
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
          }}
        >
          <Text style={{ color: "#92400E", fontSize: 12, fontWeight: "600" }}>
            Score: {item.score}
          </Text>
        </View>
      </View>
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
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1F2937", marginBottom: 12 }}>
          Leads
        </Text>

        {/* Search */}
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#D1D5DB",
            borderRadius: 8,
            padding: 10,
            fontSize: 14,
            backgroundColor: "#F9FAFB",
          }}
          placeholder="Search leads..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredLeads}
        renderItem={renderLeadItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 16, color: "#6B7280" }}>
              {searchQuery ? "No leads found" : "No leads yet"}
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        onPress={() => router.push("/(app)/leads/new")}
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
