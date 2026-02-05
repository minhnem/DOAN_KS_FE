import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  getDeviceRequestsApi,
  approveDeviceRequestApi,
  rejectDeviceRequestApi,
} from "../api/client";

type Props = NativeStackScreenProps<any>;

interface DeviceRequest {
  _id: string;
  studentName: string;
  studentEmail: string;
  studentCode: string;
  oldDeviceId: string | null;
  newDeviceId: string;
  status: "pending" | "approved" | "rejected";
  rejectReason: string | null;
  createdAt: string;
  processedAt: string | null;
}

const DeviceRequestsScreen: React.FC<Props> = ({ navigation }) => {
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const fetchRequests = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const status = filter === "all" ? undefined : filter;
      const res = await getDeviceRequestsApi(status);
      setRequests(res.data?.data ?? []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchRequests();
    });
    return unsubscribe;
  }, [navigation, filter]);

  const handleApprove = async (requestId: string, studentName: string) => {
    Alert.alert(
      "Xác nhận phê duyệt",
      `Cho phép sinh viên "${studentName}" đổi sang thiết bị mới?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Phê duyệt",
          onPress: async () => {
            try {
              setProcessingId(requestId);
              await approveDeviceRequestApi(requestId);
              Alert.alert("Thành công", "Đã phê duyệt yêu cầu đổi thiết bị.");
              fetchRequests();
            } catch (error: any) {
              Alert.alert("Lỗi", error.response?.data?.message ?? "Phê duyệt thất bại");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (requestId: string, studentName: string) => {
    Alert.alert(
      "Xác nhận từ chối",
      `Từ chối yêu cầu đổi thiết bị của sinh viên "${studentName}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(requestId);
              await rejectDeviceRequestApi(requestId, "Giáo viên từ chối yêu cầu");
              Alert.alert("Thành công", "Đã từ chối yêu cầu đổi thiết bị.");
              fetchRequests();
            } catch (error: any) {
              Alert.alert("Lỗi", error.response?.data?.message ?? "Từ chối thất bại");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { text: "Đang chờ", bgColor: "#fff3cd", textColor: "#856404" };
      case "approved":
        return { text: "Đã duyệt", bgColor: "#d4edda", textColor: "#155724" };
      case "rejected":
        return { text: "Đã từ chối", bgColor: "#f8d7da", textColor: "#721c24" };
      default:
        return { text: status, bgColor: "#f0f0f0", textColor: "#666" };
    }
  };

  const renderItem = ({ item }: { item: DeviceRequest }) => {
    const statusConfig = getStatusConfig(item.status);
    const isProcessing = processingId === item._id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.studentName}</Text>
            <Text style={styles.studentCode}>MSV: {item.studentCode}</Text>
            <Text style={styles.studentEmail}>{item.studentEmail}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        <View style={styles.deviceInfo}>
          <Text style={styles.deviceLabel}>Thiết bị cũ:</Text>
          <Text style={styles.deviceId}>{item.oldDeviceId || "Chưa có"}</Text>
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceLabel}>Thiết bị mới:</Text>
          <Text style={styles.deviceId}>{item.newDeviceId}</Text>
        </View>

        <Text style={styles.dateText}>Yêu cầu lúc: {formatDate(item.createdAt)}</Text>

        {item.status === "rejected" && item.rejectReason && (
          <Text style={styles.rejectReason}>Lý do từ chối: {item.rejectReason}</Text>
        )}

        {item.status === "pending" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.approveButton, isProcessing && styles.disabledButton]}
              onPress={() => handleApprove(item._id, item.studentName)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.approveButtonText}>✓ Phê duyệt</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectButton, isProcessing && styles.disabledButton]}
              onPress={() => handleReject(item._id, item.studentName)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.rejectButtonText}>✗ Từ chối</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý thiết bị</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.activeFilterTab]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
              {f === "pending" ? "Chờ duyệt" : f === "approved" ? "Đã duyệt" : f === "rejected" ? "Từ chối" : "Tất cả"}
            </Text>
            {f === "pending" && pendingCount > 0 && filter !== "pending" && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4361ee" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchRequests(true)} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📱</Text>
              <Text style={styles.emptyText}>
                {filter === "pending"
                  ? "Không có yêu cầu nào đang chờ duyệt"
                  : "Không có yêu cầu nào"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#4361ee",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: "#4361ee",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  activeFilterText: {
    color: "#fff",
  },
  badge: {
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  studentCode: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4361ee",
    marginTop: 2,
  },
  studentEmail: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  deviceLabel: {
    fontSize: 13,
    color: "#666",
    width: 90,
  },
  deviceId: {
    fontSize: 12,
    color: "#1a1a2e",
    fontFamily: "monospace",
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
  },
  rejectReason: {
    fontSize: 12,
    color: "#e74c3c",
    marginTop: 8,
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#27ae60",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  approveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  rejectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.7,
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
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default DeviceRequestsScreen;
