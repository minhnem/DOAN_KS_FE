import React, { useEffect, useState } from "react";
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
import { getStudentSessionsWithAttendance } from "../api/client";

type Props = NativeStackScreenProps<any>;

interface SessionItem {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "ongoing" | "closed";
  attendanceStatus: "present" | "late" | "absent_excused" | "absent_unexcused" | null;
  checkInTime: string | null;
}

const StudentSessionListScreen: React.FC<Props> = ({ route, navigation }) => {
  const classId = route?.params?.classId as string | undefined;
  const className = route?.params?.className as string | undefined;
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  if (!classId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy thông tin lớp.</Text>
      </View>
    );
  }

  const fetchSessions = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await getStudentSessionsWithAttendance(classId);
      setSessions(res.data?.data ?? []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const getSessionStatusDisplay = (status: string) => {
    switch (status) {
      case "ongoing":
        return { text: "Đang mở", color: "#2ecc71", bgColor: "#d4edda" };
      case "scheduled":
        return { text: "Sắp diễn ra", color: "#f39c12", bgColor: "#fff3cd" };
      case "closed":
        return { text: "Đã kết thúc", color: "#95a5a6", bgColor: "#e9ecef" };
      default:
        return { text: status, color: "#666", bgColor: "#f0f0f0" };
    }
  };

  const getAttendanceStatusDisplay = (status: string | null) => {
    switch (status) {
      case "present":
        return { text: "✓ Có mặt", color: "#155724", bgColor: "#d4edda", icon: "✓" };
      case "late":
        return { text: "⏰ Muộn", color: "#856404", bgColor: "#fff3cd", icon: "⏰" };
      case "absent_excused":
        return { text: "📝 Vắng có phép", color: "#383d41", bgColor: "#e2e3e5", icon: "📝" };
      case "absent_unexcused":
        return { text: "✗ Vắng không phép", color: "#721c24", bgColor: "#f8d7da", icon: "✗" };
      default:
        return { text: "○ Chưa điểm danh", color: "#666", bgColor: "#f0f0f0", icon: "○" };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item }: { item: SessionItem }) => {
    const sessionStatus = getSessionStatusDisplay(item.status);
    const attendanceStatus = getAttendanceStatusDisplay(item.attendanceStatus);
    const isOngoing = item.status === "ongoing";
    const canCheckIn = isOngoing && !item.attendanceStatus;

    return (
      <TouchableOpacity
        style={[styles.card, isOngoing && styles.cardOngoing]}
        disabled={!canCheckIn}
        onPress={() =>
          navigation.navigate("QRScanner", {
            sessionId: item._id,
          })
        }
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>{item.title || "Buổi học"}</Text>
            <Text style={styles.sessionDate}>
              📅 {formatDate(item.startTime)} • {formatTime(item.startTime)} - {formatTime(item.endTime)}
            </Text>
          </View>
          <View style={[styles.sessionBadge, { backgroundColor: sessionStatus.bgColor }]}>
            <Text style={[styles.sessionBadgeText, { color: sessionStatus.color }]}>
              {sessionStatus.text}
            </Text>
          </View>
        </View>

        {/* Attendance Status */}
        <View style={styles.attendanceRow}>
          <Text style={styles.attendanceLabel}>Trạng thái điểm danh:</Text>
          <View style={[styles.attendanceBadge, { backgroundColor: attendanceStatus.bgColor }]}>
            <Text style={[styles.attendanceBadgeText, { color: attendanceStatus.color }]}>
              {attendanceStatus.text}
            </Text>
          </View>
        </View>

        {/* Check-in time if available */}
        {item.checkInTime && (
          <Text style={styles.checkInTime}>
            ⏱️ Điểm danh lúc: {formatTime(item.checkInTime)}
          </Text>
        )}

        {/* Scan prompt for ongoing sessions without attendance */}
        {canCheckIn && (
          <View style={styles.scanPrompt}>
            <Text style={styles.scanPromptText}>👆 Bấm để quét QR điểm danh</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Thống kê nhanh
  const presentCount = sessions.filter((s) => s.attendanceStatus === "present").length;
  const lateCount = sessions.filter((s) => s.attendanceStatus === "late").length;
  const absentExcusedCount = sessions.filter((s) => s.attendanceStatus === "absent_excused").length;
  const absentUnexcusedCount = sessions.filter((s) => s.attendanceStatus === "absent_unexcused").length;
  const notCheckedCount = sessions.filter((s) => !s.attendanceStatus && s.status === "closed").length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
        <Text style={styles.loadingText}>Đang tải buổi học...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats */}
      {sessions.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statItem, { backgroundColor: "#d4edda" }]}>
              <Text style={[styles.statNumber, { color: "#155724" }]}>{presentCount}</Text>
              <Text style={[styles.statLabel, { color: "#155724" }]}>Có mặt</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: "#fff3cd" }]}>
              <Text style={[styles.statNumber, { color: "#856404" }]}>{lateCount}</Text>
              <Text style={[styles.statLabel, { color: "#856404" }]}>Muộn</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: "#e2e3e5" }]}>
              <Text style={[styles.statNumber, { color: "#383d41" }]}>{absentExcusedCount}</Text>
              <Text style={[styles.statLabel, { color: "#383d41" }]}>Có phép</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: "#f8d7da" }]}>
              <Text style={[styles.statNumber, { color: "#721c24" }]}>{absentUnexcusedCount + notCheckedCount}</Text>
              <Text style={[styles.statLabel, { color: "#721c24" }]}>Vắng</Text>
            </View>
          </View>
        </View>
      )}

      {/* List */}
      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchSessions(true)} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>Chưa có buổi học nào</Text>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 16,
  },
  statsContainer: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  cardOngoing: {
    borderWidth: 2,
    borderColor: "#2ecc71",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 10,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 13,
    color: "#666",
  },
  sessionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  attendanceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  attendanceLabel: {
    fontSize: 13,
    color: "#666",
  },
  attendanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  attendanceBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  checkInTime: {
    fontSize: 12,
    color: "#888",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  scanPrompt: {
    backgroundColor: "#d4edda",
    paddingVertical: 12,
    alignItems: "center",
  },
  scanPromptText: {
    color: "#155724",
    fontWeight: "600",
    fontSize: 14,
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
});

export default StudentSessionListScreen;
