import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getStudentClasses } from "../api/client";
import { useAuth } from "../context/AuthContext";

type Props = NativeStackScreenProps<any>;

interface ClassItem {
  _id: string;
  code: string;
  name: string;
  description?: string;
  teacherName?: string;
  studentCount?: number;
}

const StudentClassListScreen: React.FC<Props> = ({ navigation }) => {
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
      const res = await getStudentClasses();
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
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("StudentSessions", { classId: item._id })}
    >
      <Text style={styles.name}>{item.name}</Text>
      <View style={styles.codeRow}>
        <Text style={styles.codeLabel}>Mã lớp:</Text>
        <Text style={styles.codeValue}>{item.code}</Text>
      </View>
      {item.teacherName && (
        <Text style={styles.teacher}>👨‍🏫 GV: {item.teacherName}</Text>
      )}
      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lớp của tôi</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Join Class Button */}
      <TouchableOpacity
        style={styles.joinButton}
        onPress={() => navigation.navigate("JoinClass")}
      >
        <Text style={styles.joinButtonIcon}>+</Text>
        <Text style={styles.joinButtonText}>Tham gia lớp học</Text>
      </TouchableOpacity>

      {/* History Button */}
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate("AttendanceHistory")}
      >
        <Text style={styles.historyButtonText}>📋 Xem lịch sử điểm danh</Text>
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
            <Text style={styles.emptyIcon}>🎓</Text>
            <Text style={styles.emptyText}>Chưa tham gia lớp nào</Text>
            <Text style={styles.emptyHint}>
              Bấm "Tham gia lớp học" để nhập mã lớp hoặc quét QR
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    color: "#e74c3c",
    fontWeight: "600",
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4361ee",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#4361ee",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonIcon: {
    fontSize: 22,
    color: "#fff",
    marginRight: 8,
    fontWeight: "300",
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  historyButton: {
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#4361ee",
  },
  historyButtonText: {
    color: "#4361ee",
    fontSize: 15,
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
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 8,
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
  teacher: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
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
    textAlign: "center",
    paddingHorizontal: 40,
  },
  emptyList: {
    flexGrow: 1,
  },
});

export default StudentClassListScreen;

