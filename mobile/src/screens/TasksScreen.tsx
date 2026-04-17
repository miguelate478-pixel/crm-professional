import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SectionList,
} from "react-native";
import { useRouter } from "expo-router";
import type { Task } from "@types/index";

export default function TasksScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual tRPC call
      // const data = await trpc.tasks.list.query();
      // setTasks(data);

      // Mock data
      setTasks([
        {
          id: "1",
          title: "Llamar a Carlos Mendoza - TechCorp",
          priority: "alta",
          status: "pendiente",
          dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: "org1",
          userId: "user1",
        },
        {
          id: "2",
          title: "Enviar propuesta a Innovate SAS",
          priority: "alta",
          status: "pendiente",
          dueDate: new Date(Date.now() + 172800000).toISOString().split("T")[0],
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: "org1",
          userId: "user1",
        },
        {
          id: "3",
          title: "Reunión de seguimiento - GlobalCo",
          priority: "media",
          status: "pendiente",
          dueDate: new Date(Date.now() + 259200000).toISOString().split("T")[0],
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: "org1",
          userId: "user1",
        },
        {
          id: "4",
          title: "Preparar demo para Enterprise SA",
          priority: "alta",
          status: "en_progreso",
          dueDate: new Date(Date.now() + 432000000).toISOString().split("T")[0],
          createdAt: new Date(),
          updatedAt: new Date(),
          organizationId: "org1",
          userId: "user1",
        },
      ]);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const groupTasksByStatus = () => {
    const grouped: Record<string, Task[]> = {
      pendiente: [],
      en_progreso: [],
      completada: [],
    };

    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return Object.entries(grouped)
      .filter(([_, items]) => items.length > 0)
      .map(([status, items]) => ({
        title: status === "pendiente" ? "Pending" : status === "en_progreso" ? "In Progress" : "Completed",
        data: items,
      }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "#EF4444";
      case "media":
        return "#F59E0B";
      case "baja":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "#3B82F6";
      case "en_progreso":
        return "#F59E0B";
      case "completada":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/tasks/${item.id}`)}
      style={{
        backgroundColor: "#ffffff",
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: getPriorityColor(item.priority),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", flex: 1 }}>
          {item.title}
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
            {item.status === "pendiente" ? "Pending" : item.status === "en_progreso" ? "In Progress" : "Done"}
          </Text>
        </View>
      </View>

      {item.dueDate && (
        <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
          Due: {new Date(item.dueDate).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <Text
      style={{
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 16,
      }}
    >
      {title}
    </Text>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const sections = groupTasksByStatus();

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <View style={{ backgroundColor: "#ffffff", padding: 16, paddingTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1F2937" }}>
          Tasks
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
          {tasks.length} tasks
        </Text>
      </View>

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 16, color: "#6B7280" }}>
              No tasks yet
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        onPress={() => router.push("/(app)/tasks/new")}
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
