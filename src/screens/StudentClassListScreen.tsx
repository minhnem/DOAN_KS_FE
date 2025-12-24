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
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>Đang tải lớp học...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#27ae60" />
      
      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>Xin chào, Sinh viên 👋</Text>
            <Text style={styles.headerTitle}>Lớp học của tôi</Text>
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
            <Text style={styles.statLabel}>Lớp đã tham gia</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => navigation.navigate("JoinClass")}
        >
          <Text style={styles.joinButtonIcon}>+</Text>
          <Text style={styles.joinButtonText}>Tham gia lớp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate("AttendanceHistory")}
        >
          <Text style={styles.historyButtonIcon}>📋</Text>
          <Text style={styles.historyButtonText}>Lịch sử</Text>
        </TouchableOpacity>
      </View>

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
              Bấm "Tham gia lớp" để nhập mã lớp hoặc quét QR
            </Text>
          </View>
        }
        contentContainerStyle={classes.length === 0 ? styles.emptyList : styles.listContent}
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
    backgroundColor: "#27ae60",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#27ae60",
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
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  joinButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27ae60",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#27ae60",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonIcon: {
    fontSize: 20,
    color: "#fff",
    marginRight: 6,
    fontWeight: "300",
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  historyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#27ae60",
  },
  historyButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  historyButtonText: {
    color: "#27ae60",
    fontSize: 15,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 20,
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
    color: "#27ae60",
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
