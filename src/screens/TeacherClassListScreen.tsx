import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getTeacherClasses } from "../api/client";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherClasses">;

interface ClassItem {
  _id: string;
  code: string;
  name: string;
  description?: string;
  studentCount?: number;
  status: string;
}

const TeacherClassListScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClasses = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const res = await getTeacherClasses();
      setClasses(res.data?.data ?? []);
    } catch (error) {
      // TODO: show alert
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Refresh khi quay lại màn hình
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchClasses();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(() => {
    fetchClasses(true);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const renderItem = ({ item }: { item: ClassItem }) => (
    <View style={styles.item}>
      <TouchableOpacity
        onPress={() => navigation.navigate("TeacherSessions", { classId: item._id })}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={[styles.statusBadge, item.status === "active" ? styles.activeBadge : styles.closedBadge]}>
            <Text style={styles.statusText}>
              {item.status === "active" ? "Hoạt động" : "Đã đóng"}
            </Text>
          </View>
        </View>
        <View style={styles.codeRow}>
          <Text style={styles.codeLabel}>Mã lớp:</Text>
          <Text style={styles.codeValue}>{item.code}</Text>
        </View>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.studentCountRow}>
          <Text style={styles.statsText}>👥 {item.studentCount ?? 0} sinh viên</Text>
        </View>
      </TouchableOpacity>
      
      {/* Action Buttons */}
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.itemActionButton, styles.sessionsButton]}
          onPress={() => navigation.navigate("TeacherSessions", { classId: item._id })}
        >
          <Text style={styles.itemActionText}>📅 Buổi học</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.itemActionButton, styles.statsButton]}
          onPress={() => navigation.navigate("TeacherClassStats", { classId: item._id })}
        >
          <Text style={styles.itemActionText}>📊 Thống kê</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
        <Text style={styles.loadingText}>Đang tải lớp học...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4361ee" />
      
      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>Xin chào, Giảng viên 👋</Text>
            <Text style={styles.headerTitle}>Quản lý lớp học</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutIconContainer}>
              <Text style={styles.logoutIcon}>⏻</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{classes.length}</Text>
            <Text style={styles.statLabel}>Lớp học</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {classes.filter(c => c.status === "active").length}
            </Text>
            <Text style={styles.statLabel}>Đang hoạt động</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Create Class Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate("CreateClass")}
      >
        <Text style={styles.createButtonIcon}>+</Text>
        <Text style={styles.createButtonText}>Tạo lớp học mới</Text>
      </TouchableOpacity>

      {/* Class List */}
      <FlatList
        data={classes}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>Chưa có lớp học nào</Text>
            <Text style={styles.emptyHint}>
              Bấm "Tạo lớp học mới" để bắt đầu
            </Text>
          </View>
        }
        contentContainerStyle={classes.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  headerSafeArea: {
    backgroundColor: "#4361ee",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#4361ee",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
  },
  logoutButton: {
    marginTop: 4,
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(231, 76, 60, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIcon: {
    fontSize: 16,
    color: "#fff",
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginVertical: 4,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4361ee",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#4361ee",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonIcon: {
    fontSize: 22,
    color: "#fff",
    marginRight: 8,
    fontWeight: "300",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  item: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a2e",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: "#d4edda",
  },
  closedBadge: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#155724",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  codeLabel: {
    fontSize: 13,
    color: "#888",
  },
  codeValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4361ee",
    marginLeft: 6,
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  studentCountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    fontSize: 13,
    color: "#888",
  },
  itemActions: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 10,
  },
  itemActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  sessionsButton: {
    backgroundColor: "#4361ee",
  },
  statsButton: {
    backgroundColor: "#9b59b6",
  },
  itemActionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
  emptyHint: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
});

export default TeacherClassListScreen;
