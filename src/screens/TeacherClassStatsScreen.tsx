import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getClassAttendanceStats } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherClassStats">;

interface StudentStats {
  _id: string;
  name: string;
  email: string;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentExcusedCount: number;
  absentUnexcusedCount: number;
  notCheckedIn: number;
  attendanceRate: number;
}

interface ClassStats {
  className: string;
  classCode: string;
  totalSessions: number;
  totalStudents: number;
  students: StudentStats[];
}

const TeacherClassStatsScreen: React.FC<Props> = ({ route }) => {
  const { classId } = route.params;
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await getClassAttendanceStats(classId);
      setStats(res.data?.data ?? null);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return "#27ae60";
    if (rate >= 60) return "#f39c12";
    return "#e74c3c";
  };

  const renderStudentItem = ({ item }: { item: StudentStats }) => {
    const totalAbsent = item.absentExcusedCount + item.absentUnexcusedCount + item.notCheckedIn;

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentEmail}>{item.email}</Text>
          </View>
          <View
            style={[
              styles.rateCircle,
              { borderColor: getAttendanceColor(item.attendanceRate) },
            ]}
          >
            <Text
              style={[
                styles.rateText,
                { color: getAttendanceColor(item.attendanceRate) },
              ]}
            >
              {item.attendanceRate}%
            </Text>
          </View>
        </View>

        {/* Stats Row 1: Có mặt & Muộn */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: "#d4edda" }]}>
            <Text style={[styles.statNumber, { color: "#155724" }]}>
              {item.presentCount}
            </Text>
            <Text style={[styles.statLabel, { color: "#155724" }]}>Có mặt</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#fff3cd" }]}>
            <Text style={[styles.statNumber, { color: "#856404" }]}>
              {item.lateCount}
            </Text>
            <Text style={[styles.statLabel, { color: "#856404" }]}>Muộn</Text>
          </View>
        </View>

        {/* Stats Row 2: Vắng có phép & Vắng không phép */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: "#e2e3e5" }]}>
            <Text style={[styles.statNumber, { color: "#383d41" }]}>
              {item.absentExcusedCount}
            </Text>
            <Text style={[styles.statLabel, { color: "#383d41" }]}>Vắng có phép</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#f8d7da" }]}>
            <Text style={[styles.statNumber, { color: "#721c24" }]}>
              {item.absentUnexcusedCount + item.notCheckedIn}
            </Text>
            <Text style={[styles.statLabel, { color: "#721c24" }]}>Vắng không phép</Text>
          </View>
        </View>

        {/* Total sessions info */}
        <Text style={styles.totalSessionsText}>
          Tổng: {item.totalSessions} buổi học
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
        <Text style={styles.loadingText}>Đang tải thống kê...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.center}>
        <Text>Không có dữ liệu thống kê.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.headerCard}>
        <Text style={styles.className}>{stats.className}</Text>
        <Text style={styles.classCode}>Mã lớp: {stats.classCode}</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{stats.totalStudents}</Text>
            <Text style={styles.summaryLabel}>Sinh viên</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{stats.totalSessions}</Text>
            <Text style={styles.summaryLabel}>Buổi học</Text>
          </View>
        </View>
      </View>

      {/* Students List */}
      <Text style={styles.sectionTitle}>Thống kê từng sinh viên</Text>

      <FlatList
        data={stats.students}
        keyExtractor={(item) => item._id}
        renderItem={renderStudentItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStats(true)}
          />
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
  headerCard: {
    backgroundColor: "#4361ee",
    margin: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
  },
  className: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  classCode: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  summaryLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
    marginHorizontal: 16,
    marginBottom: 12,
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
    marginBottom: 12,
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
  rateCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  rateText: {
    fontSize: 14,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  totalSessionsText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 4,
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

export default TeacherClassStatsScreen;
