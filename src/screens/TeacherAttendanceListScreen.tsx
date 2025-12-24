import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getSessionStudentsWithAttendance, manualCheckInApi } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherAttendance">;

interface StudentAttendance {
  _id: string;
  name: string;
  email: string;
  attendanceId: string | null;
  status: "present" | "late" | "absent";
  checkInTime: string | null;
  location: {
    distanceToClass?: number;
  } | null;
}

interface SessionInfo {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
}

const TeacherAttendanceListScreen: React.FC<Props> = ({ route }) => {
  const { sessionId } = route.params;
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await getSessionStudentsWithAttendance(sessionId);
      const data = res.data?.data;
      setSession(data?.session ?? null);
      setStudents(data?.students ?? []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualCheckIn = async (
    studentId: string,
    status: "present" | "late"
  ) => {
    try {
      setProcessingId(studentId);
      await manualCheckInApi({ sessionId, studentId, status });

      // Cập nhật local state
      setStudents((prev) =>
        prev.map((s) =>
          s._id === studentId
            ? { ...s, status, checkInTime: new Date().toISOString() }
            : s
        )
      );

      Alert.alert(
        "Thành công",
        `Đã điểm danh ${status === "present" ? "có mặt" : "muộn"}`
      );
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message ?? "Điểm danh thất bại");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "present":
        return {
          text: "Có mặt",
          bgColor: "#d4edda",
          textColor: "#155724",
          icon: "✓",
        };
      case "late":
        return {
          text: "Muộn",
          bgColor: "#fff3cd",
          textColor: "#856404",
          icon: "⏰",
        };
      case "absent":
      default:
        return {
          text: "Chưa điểm danh",
          bgColor: "#f8d7da",
          textColor: "#721c24",
          icon: "✗",
        };
    }
  };

  const renderStudentItem = ({ item }: { item: StudentAttendance }) => {
    const statusConfig = getStatusConfig(item.status);
    const isProcessing = processingId === item._id;

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentEmail}>{item.email}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}
          >
            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
              {statusConfig.icon} {statusConfig.text}
            </Text>
          </View>
        </View>

        {item.checkInTime && (
          <Text style={styles.checkInTime}>
            Điểm danh lúc: {new Date(item.checkInTime).toLocaleTimeString("vi-VN")}
            {item.location?.distanceToClass !== undefined &&
              ` • Cách ${item.location.distanceToClass.toFixed(0)}m`}
          </Text>
        )}

        {/* Nút điểm danh thủ công cho sinh viên chưa điểm danh */}
        {item.status === "absent" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.presentButton]}
              onPress={() => handleManualCheckIn(item._id, "present")}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>✓ Có mặt</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.lateButton]}
              onPress={() => handleManualCheckIn(item._id, "late")}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>⏰ Muộn</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Nút thay đổi trạng thái cho sinh viên đã điểm danh */}
        {item.status !== "absent" && (
          <View style={styles.changeStatusRow}>
            <Text style={styles.changeStatusLabel}>Đổi trạng thái:</Text>
            <View style={styles.miniButtons}>
              {item.status !== "present" && (
                <TouchableOpacity
                  style={[styles.miniButton, styles.miniPresent]}
                  onPress={() => handleManualCheckIn(item._id, "present")}
                  disabled={isProcessing}
                >
                  <Text style={styles.miniButtonText}>Có mặt</Text>
                </TouchableOpacity>
              )}
              {item.status !== "late" && (
                <TouchableOpacity
                  style={[styles.miniButton, styles.miniLate]}
                  onPress={() => handleManualCheckIn(item._id, "late")}
                  disabled={isProcessing}
                >
                  <Text style={styles.miniButtonText}>Muộn</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Thống kê nhanh
  const presentCount = students.filter((s) => s.status === "present").length;
  const lateCount = students.filter((s) => s.status === "late").length;
  const absentCount = students.filter((s) => s.status === "absent").length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
        <Text style={styles.loadingText}>Đang tải danh sách...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Session Info */}
      {session && (
        <View style={styles.sessionCard}>
          <Text style={styles.sessionTitle}>{session.title || "Buổi học"}</Text>
          <Text style={styles.sessionTime}>
            {new Date(session.startTime).toLocaleString("vi-VN")}
          </Text>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.statsBar}>
        <View style={[styles.statItem, { backgroundColor: "#d4edda" }]}>
          <Text style={[styles.statNumber, { color: "#155724" }]}>{presentCount}</Text>
          <Text style={styles.statLabel}>Có mặt</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: "#fff3cd" }]}>
          <Text style={[styles.statNumber, { color: "#856404" }]}>{lateCount}</Text>
          <Text style={styles.statLabel}>Muộn</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: "#f8d7da" }]}>
          <Text style={[styles.statNumber, { color: "#721c24" }]}>{absentCount}</Text>
          <Text style={styles.statLabel}>Vắng</Text>
        </View>
      </View>

      {/* Students List */}
      <FlatList
        data={students}
        keyExtractor={(item) => item._id}
        renderItem={renderStudentItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có sinh viên trong lớp</Text>
          </View>
        }
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
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  sessionCard: {
    backgroundColor: "#4361ee",
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  sessionTime: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  statsBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  studentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  studentEmail: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  checkInTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  presentButton: {
    backgroundColor: "#27ae60",
  },
  lateButton: {
    backgroundColor: "#f39c12",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  changeStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  changeStatusLabel: {
    fontSize: 12,
    color: "#888",
    marginRight: 10,
  },
  miniButtons: {
    flexDirection: "row",
    gap: 8,
  },
  miniButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  miniPresent: {
    backgroundColor: "#27ae60",
  },
  miniLate: {
    backgroundColor: "#f39c12",
  },
  miniButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
  },
});

export default TeacherAttendanceListScreen;
