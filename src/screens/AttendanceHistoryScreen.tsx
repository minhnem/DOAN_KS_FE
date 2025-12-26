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
import { getAttendanceHistory } from "../api/client";

type Props = NativeStackScreenProps<any>;

interface AttendanceItem {
  _id: string;
  sessionTitle?: string;
  sessionStartTime?: string;
  sessionEndTime?: string;
  checkInTime: string;
  status: "present" | "late" | "absent_excused" | "absent_unexcused";
}

const AttendanceHistoryScreen: React.FC<Props> = () => {
  const [items, setItems] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await getAttendanceHistory();
      setItems(res.data?.data ?? []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

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
      case "absent_excused":
        return {
          text: "Vắng có phép",
          bgColor: "#e2e3e5",
          textColor: "#383d41",
          icon: "📝",
        };
      case "absent_unexcused":
        return {
          text: "Vắng không phép",
          bgColor: "#f8d7da",
          textColor: "#721c24",
          icon: "✗",
        };
      default:
        return {
          text: status,
          bgColor: "#f0f0f0",
          textColor: "#666",
          icon: "○",
        };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item }: { item: AttendanceItem }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>
              {item.sessionTitle ?? "Buổi học"}
            </Text>
            {item.sessionStartTime && (
              <Text style={styles.sessionDate}>
                {formatDate(item.sessionStartTime)}
              </Text>
            )}
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}
          >
            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
              {statusConfig.icon} {statusConfig.text}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⏱️ Điểm danh lúc:</Text>
            <Text style={styles.infoValue}>{formatTime(item.checkInTime)}</Text>
          </View>
          {item.sessionStartTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📅 Buổi học:</Text>
              <Text style={styles.infoValue}>
                {formatTime(item.sessionStartTime)}
                {item.sessionEndTime && ` - ${formatTime(item.sessionEndTime)}`}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Thống kê nhanh
  const presentCount = items.filter((i) => i.status === "present").length;
  const lateCount = items.filter((i) => i.status === "late").length;
  const absentExcusedCount = items.filter((i) => i.status === "absent_excused").length;
  const absentUnexcusedCount = items.filter((i) => i.status === "absent_unexcused").length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats - Nằm ngang */}
      {items.length > 0 && (
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
              <Text style={[styles.statNumber, { color: "#721c24" }]}>{absentUnexcusedCount}</Text>
              <Text style={[styles.statLabel, { color: "#721c24" }]}>Không phép</Text>
            </View>
          </View>
        </View>
      )}

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Chưa có lịch sử điểm danh</Text>
            <Text style={styles.emptySubtext}>
              Điểm danh các buổi học để xem lịch sử tại đây
            </Text>
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
    fontSize: 14,
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
    justifyContent: "space-between",
    gap: 8,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  sessionDate: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    padding: 16,
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: "#666",
    marginRight: 8,
  },
  infoValue: {
    fontSize: 13,
    color: "#1a1a2e",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});

export default AttendanceHistoryScreen;
